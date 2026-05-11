// ═══════════════════════════════════════════════════════
// Webhook Routes — /webhook/orderonline
// Handles order events from OrderOnline.id
// ═══════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();

const db = require('../db');
const { generateToken } = require('../token-gen');
const { sendActivationEmail, isConfigured: emailConfigured } = require('../email');
const { verifyWebhook } = require('../webhook-verify');

const ORDERONLINE_TOKEN = process.env.ORDERONLINE_PERSONAL_ACCESS_TOKEN;
const VARIANT_MAP = parseVariantMap(process.env.WEBHOOK_VARIANT_MAP);
const DEFAULT_VARIANT = process.env.WEBHOOK_DEFAULT_VARIANT || 'maxlook_man';

function parseVariantMap(str) {
  // Format di .env: "Maxlook Woman:maxlook_woman,Maxlook Man:maxlook_man"
  // Atau JSON: '{"Maxlook Woman":"maxlook_woman"}'
  if (!str) return {};
  try {
    if (str.trim().startsWith('{')) return JSON.parse(str);
    const map = {};
    str.split(',').forEach(pair => {
      const [key, val] = pair.split(':').map(s => s.trim());
      if (key && val) map[key] = val;
    });
    return map;
  } catch (err) {
    console.error('[webhook] WEBHOOK_VARIANT_MAP parse error:', err.message);
    return {};
  }
}

// Detect variant from product name (keyword-based)
function detectVariant(productName) {
  if (!productName) return DEFAULT_VARIANT;
  const name = String(productName);

  // Exact match dari config map dulu
  for (const [key, val] of Object.entries(VARIANT_MAP)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  }

  // Keyword fallback
  const lower = name.toLowerCase();
  if (/(woman|wanita|cewek|cewe|female|girl)/.test(lower)) return 'maxlook_woman';
  if (/(man|pria|cowok|cowo|male|boy)/.test(lower)) return 'maxlook_man';

  return DEFAULT_VARIANT;
}

// Detect gender from variant
function variantToGender(variant) {
  return variant === 'maxlook_woman' ? 'woman' : 'man';
}

// Extract customer info from OrderOnline payload
// OrderOnline payload structure may vary — be defensive
function extractCustomer(payload) {
  if (!payload) return {};
  return {
    name: payload.customer_name || payload.name || payload.buyer_name || payload.customer?.name || '',
    email: payload.customer_email || payload.email || payload.buyer_email || payload.customer?.email || '',
    phone: payload.customer_phone || payload.phone || payload.buyer_phone || payload.customer?.phone || '',
    productName: payload.product_name || payload.product?.name || payload.items?.[0]?.name || payload.items?.[0]?.product_name || '',
    orderId: payload.id || payload.order_id || payload.invoice_id || payload.order_number || ''
  };
}

// Use raw body parser (we need raw bytes for HMAC verify? Actually no — OrderOnline spec hashes JSON-encoded structured payload, not raw body. So we use express.json().)
router.post('/orderonline', express.json({ limit: '2mb' }), async (req, res) => {
  const startedAt = Date.now();

  // ── Debug: log everything that comes in (controlled by env var) ──
  const DEBUG = process.env.WEBHOOK_DEBUG === 'true';
  if (DEBUG) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('[webhook/orderonline] INCOMING REQUEST');
    console.log('  Headers:', JSON.stringify(req.headers, null, 2));
    console.log('  Body:', JSON.stringify(req.body, null, 2));
    console.log('═══════════════════════════════════════════════════════');
  }

  // Always log raw body to audit (truncated for safety)
  await db.logAudit({
    userId: null,
    actor: 'webhook',
    action: 'webhook_received',
    details: {
      headers: {
        'x-orderonline-hmac-sha256': req.get('x-orderonline-hmac-sha256') || null,
        'user-agent': req.get('user-agent') || null,
        'content-type': req.get('content-type') || null
      },
      body_keys: req.body ? Object.keys(req.body) : [],
      body_type: req.body?.type || null,
      body_action: req.body?.action || null,
      payload_keys: req.body?.payload ? Object.keys(req.body.payload) : [],
      // Save full body in audit (Supabase JSONB can handle it)
      raw_body: req.body || null
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  // ── Step 1: Verify HMAC signature ──
  const verification = verifyWebhook(req, ORDERONLINE_TOKEN);
  if (!verification.valid) {
    console.warn('[webhook/orderonline] Verification failed:', verification.reason);
    await db.logAudit({
      userId: null,
      actor: 'webhook',
      action: 'webhook_rejected',
      details: { reason: verification.reason, expected: verification.expected, received: verification.received },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    return res.status(401).json({ error: 'invalid_signature', reason: verification.reason });
  }

  const body = req.body || {};
  const { type, action, payload } = body;

  console.log(`[webhook/orderonline] Received: type=${type}, action=${action}`);

  // ── Step 2: Filter — only handle Order/create ──
  if (type !== 'Order') {
    return res.json({ ok: true, ignored: true, reason: `type "${type}" not handled` });
  }
  if (action !== 'create') {
    // For now we only auto-create users on order creation
    return res.json({ ok: true, ignored: true, reason: `action "${action}" not handled` });
  }

  // ── Step 3: Extract customer + product ──
  const cust = extractCustomer(payload);
  if (!cust.email && !cust.name) {
    console.warn('[webhook/orderonline] Payload tidak punya email/nama:', JSON.stringify(payload).slice(0, 500));
    await db.logAudit({
      userId: null, actor: 'webhook', action: 'webhook_invalid_payload',
      details: { reason: 'missing email/name', payloadKeys: Object.keys(payload || {}) }
    });
    return res.status(400).json({ error: 'missing_customer_data' });
  }

  // ── Step 4: Idempotency — if order_id already processed, skip ──
  if (cust.orderId) {
    const existing = await db.findUserByOrderId(cust.orderId);
    if (existing) {
      console.log(`[webhook/orderonline] Order ${cust.orderId} already processed (user #${existing.id})`);
      return res.json({ ok: true, idempotent: true, user_id: existing.id, token: existing.token });
    }
  }

  // ── Step 5: Check email duplicate ──
  if (cust.email) {
    const existingByEmail = await db.findUserByEmail(cust.email);
    if (existingByEmail) {
      // Just link the order to existing user (don't create duplicate)
      await db.updateUser(existingByEmail.id, {
        order_id: String(cust.orderId || ''),
        order_payload: payload
      });
      console.log(`[webhook/orderonline] Email ${cust.email} already exists — linked order to user #${existingByEmail.id}`);
      return res.json({ ok: true, linked_existing: true, user_id: existingByEmail.id });
    }
  }

  // ── Step 6: Generate token + create user ──
  const variant = detectVariant(cust.productName);
  const gender = variantToGender(variant);
  let token;
  let collision = true;
  let attempts = 0;
  while (collision && attempts < 10) {
    token = generateToken();
    const dup = await db.findUserByToken(token);
    collision = !!dup;
    attempts++;
  }

  let user;
  try {
    user = await db.createUser({
      token,
      name: cust.name || 'Customer',
      email: cust.email || null,
      phone: cust.phone || null,
      gender,
      variant
    });
    await db.updateUser(user.id, {
      source: 'webhook',
      status: 'pending',
      order_id: String(cust.orderId || ''),
      order_payload: payload
    });
  } catch (err) {
    console.error('[webhook/orderonline] createUser failed:', err.message);
    await db.logAudit({
      userId: null, actor: 'webhook', action: 'webhook_create_failed',
      details: { error: err.message, customer: cust }
    });
    return res.status(500).json({ error: 'create_failed', message: err.message });
  }

  // ── Step 7: Send activation email ──
  const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  let emailResult = { ok: false, error: 'Resend not configured' };
  if (emailConfigured() && cust.email) {
    emailResult = await sendActivationEmail({
      to: cust.email, name: cust.name || 'Customer', token, gender, baseUrl
    });
    await db.updateUser(user.id, {
      email_sent_at: emailResult.ok ? new Date().toISOString() : null,
      email_status: emailResult.ok ? 'sent' : 'failed',
      email_message_id: emailResult.messageId || null
    });
  }

  // ── Step 8: Audit log ──
  await db.logAudit({
    userId: user.id,
    actor: 'webhook',
    action: 'create',
    details: {
      orderId: cust.orderId,
      productName: cust.productName,
      variant,
      emailSent: emailResult.ok,
      emailError: emailResult.error || null,
      processingMs: Date.now() - startedAt
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  console.log(`[webhook/orderonline] User #${user.id} created (${cust.email || 'no-email'}) order=${cust.orderId} variant=${variant} email=${emailResult.ok ? 'sent' : 'failed'}`);

  res.json({
    ok: true,
    user_id: user.id,
    token,
    variant,
    email: emailResult,
    processing_ms: Date.now() - startedAt
  });
});

// Health check / verification endpoint (no auth)
router.get('/orderonline', (req, res) => {
  res.json({
    status: 'ok',
    endpoint: 'OrderOnline webhook receiver',
    method: 'POST only',
    configured: !!ORDERONLINE_TOKEN,
    variant_map: VARIANT_MAP,
    default_variant: DEFAULT_VARIANT
  });
});

module.exports = router;
