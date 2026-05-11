// ═══════════════════════════════════════════════════════
// OrderOnline Webhook Verifier — HMAC SHA256
// Spec dari OrderOnline docs:
//   header  : x-orderonline-hmac-sha256
//   payload : { type, action, payload }
//   formula : base64( hmac_sha256(json_encode({type,action,payload}), token) )
// ═══════════════════════════════════════════════════════

const crypto = require('crypto');

// Compute HMAC sesuai spec PHP-style yang diberi OrderOnline
function computeHmac(body, token) {
  // Spec: $payload_str = json_encode([type, action, payload])
  // PHP json_encode default = no spaces, no unescaped slashes (but JS JSON.stringify default works)
  const payloadObj = {
    type: body.type,
    action: body.action,
    payload: body.payload
  };
  const payloadStr = JSON.stringify(payloadObj);
  return crypto
    .createHmac('sha256', token)
    .update(payloadStr)
    .digest('base64');
}

// Verify webhook authenticity
function verifyWebhook(req, token) {
  if (!token) {
    return { valid: false, reason: 'ORDERONLINE_PERSONAL_ACCESS_TOKEN belum di-set di .env' };
  }
  const headerHmac = req.get('x-orderonline-hmac-sha256');
  if (!headerHmac) {
    return { valid: false, reason: 'Header x-orderonline-hmac-sha256 tidak ada' };
  }

  if (!req.body || typeof req.body !== 'object') {
    return { valid: false, reason: 'Body bukan JSON' };
  }

  let computed;
  try {
    computed = computeHmac(req.body, token);
  } catch (err) {
    return { valid: false, reason: `HMAC compute error: ${err.message}` };
  }

  // Constant-time compare
  const a = Buffer.from(headerHmac);
  const b = Buffer.from(computed);
  if (a.length !== b.length) {
    return { valid: false, reason: 'HMAC mismatch (length)', expected: computed, received: headerHmac };
  }
  const valid = crypto.timingSafeEqual(a, b);
  return valid
    ? { valid: true }
    : { valid: false, reason: 'HMAC mismatch', expected: computed, received: headerHmac };
}

module.exports = { verifyWebhook, computeHmac };
