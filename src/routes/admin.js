// ═══════════════════════════════════════════════════════
// Admin Routes — /admin/* and /admin/api/*
// ═══════════════════════════════════════════════════════

const express = require('express');
const path = require('path');
const router = express.Router();

const db = require('../db');
const { generateToken } = require('../token-gen');
const { sendActivationEmail, isConfigured: emailConfigured } = require('../email');
const {
  validateCredentials,
  setAdminCookie,
  clearAdminCookie,
  requireAdmin
} = require('../admin-auth');

// ── Public routes (login) ─────────────────────────────────

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin', 'login.html'));
});

router.post('/login', express.json(), (req, res) => {
  const { username, password } = req.body || {};
  if (!validateCredentials(username, password)) {
    return res.status(401).json({ error: 'invalid_credentials', message: 'Username/password salah' });
  }
  setAdminCookie(res, { username, loggedInAt: Date.now() });
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});

// ── Protected routes (require admin login) ────────────────

router.use(requireAdmin);

// Dashboard HTML
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin', 'index.html'));
});

// ── API: Stats ────────────────────────────────────────────
router.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getUserStats();
    res.json({
      total: stats.total,
      pending: stats.pending,
      activated: stats.activated,
      active: stats.active,
      suspended: stats.suspended,
      expired: stats.expired,
      emailConfigured: emailConfigured()
    });
  } catch (err) {
    console.error('[admin/api/stats]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ── API: List users ───────────────────────────────────────
router.get('/api/users', async (req, res) => {
  try {
    const { status, search, limit, offset } = req.query;
    const result = await db.listUsersWithFilters({
      status,
      search,
      limit: parseInt(limit) || 200,
      offset: parseInt(offset) || 0
    });
    res.json(result);
  } catch (err) {
    console.error('[admin/api/users GET]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ── API: Create user ──────────────────────────────────────
router.post('/api/users', express.json(), async (req, res) => {
  try {
    const { name, email, phone, gender, notes } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: 'invalid_input', message: 'Nama & email wajib diisi' });
    }
    if (!gender || !['man', 'woman'].includes(gender)) {
      return res.status(400).json({ error: 'invalid_input', message: 'Gender harus "man" atau "woman"' });
    }

    // Check email duplicate
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        error: 'email_exists',
        message: `Email ${email} udah terdaftar (token: ${existing.token})`,
        existing: { id: existing.id, token: existing.token, status: existing.status }
      });
    }

    // Generate unique token
    let token;
    let collision = true;
    let attempts = 0;
    while (collision && attempts < 10) {
      token = generateToken();
      const dup = await db.findUserByToken(token);
      collision = !!dup;
      attempts++;
    }

    const variant = gender === 'woman' ? 'maxlook_woman' : 'maxlook_man';
    const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;

    // Create user (status=pending, source=admin)
    const user = await db.createUser({
      token, name, email, phone: phone || null, gender, variant
    });

    // Update with admin source + notes
    await db.updateUser(user.id, {
      source: 'admin',
      notes: notes || null,
      status: 'pending'
    });

    // Send activation email
    let emailResult = { ok: false, error: 'Resend not configured' };
    if (emailConfigured()) {
      emailResult = await sendActivationEmail({
        to: email, name, token, gender, baseUrl
      });
      await db.updateUser(user.id, {
        email_sent_at: emailResult.ok ? new Date().toISOString() : null,
        email_status: emailResult.ok ? 'sent' : 'failed',
        email_message_id: emailResult.messageId || null
      });
    }

    // Audit log
    await db.logAudit({
      userId: user.id,
      actor: 'admin',
      action: 'create',
      details: { email, gender, emailSent: emailResult.ok, emailError: emailResult.error || null },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      ok: true,
      user: { ...user, status: 'pending' },
      accessLink: `${baseUrl}/?token=${encodeURIComponent(token)}`,
      email: emailResult
    });
  } catch (err) {
    console.error('[admin/api/users POST]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ── API: Suspend user ─────────────────────────────────────
router.post('/api/users/:id/suspend', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.updateUser(id, {
      status: 'suspended',
      suspended_at: new Date().toISOString()
    });
    if (!updated) return res.status(404).json({ error: 'not_found' });
    await db.logAudit({
      userId: id, actor: 'admin', action: 'suspend',
      ipAddress: req.ip, userAgent: req.get('user-agent')
    });
    res.json({ ok: true, user: updated });
  } catch (err) {
    console.error('[admin/api/users/:id/suspend]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ── API: Unsuspend user ───────────────────────────────────
router.post('/api/users/:id/unsuspend', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Restore to 'active' if previously activated, else 'activated'
    const user = await db.findUserById(id);
    if (!user) return res.status(404).json({ error: 'not_found' });
    const newStatus = user.activated_at ? 'active' : 'pending';
    const updated = await db.updateUser(id, {
      status: newStatus,
      suspended_at: null
    });
    await db.logAudit({
      userId: id, actor: 'admin', action: 'unsuspend',
      details: { newStatus },
      ipAddress: req.ip, userAgent: req.get('user-agent')
    });
    res.json({ ok: true, user: updated });
  } catch (err) {
    console.error('[admin/api/users/:id/unsuspend]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ── API: Reset device ─────────────────────────────────────
router.post('/api/users/:id/reset-device', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.updateUser(id, {
      device_id: null,
      device_bound_at: null,
      device_user_agent: null
    });
    if (!updated) return res.status(404).json({ error: 'not_found' });
    await db.logAudit({
      userId: id, actor: 'admin', action: 'reset_device',
      ipAddress: req.ip, userAgent: req.get('user-agent')
    });
    res.json({ ok: true, user: updated });
  } catch (err) {
    console.error('[admin/api/users/:id/reset-device]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ── API: Resend email ─────────────────────────────────────
router.post('/api/users/:id/resend-email', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await db.findUserById(id);
    if (!user) return res.status(404).json({ error: 'not_found' });
    if (!user.email) return res.status(400).json({ error: 'no_email', message: 'User tidak punya email' });

    const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    const emailResult = await sendActivationEmail({
      to: user.email, name: user.name, token: user.token, gender: user.gender, baseUrl
    });
    await db.updateUser(id, {
      email_sent_at: emailResult.ok ? new Date().toISOString() : user.email_sent_at,
      email_status: emailResult.ok ? 'sent' : 'failed',
      email_message_id: emailResult.messageId || user.email_message_id
    });
    await db.logAudit({
      userId: id, actor: 'admin', action: 'resend_email',
      details: { ok: emailResult.ok, error: emailResult.error || null },
      ipAddress: req.ip, userAgent: req.get('user-agent')
    });
    res.json({ ok: emailResult.ok, email: emailResult });
  } catch (err) {
    console.error('[admin/api/users/:id/resend-email]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ── API: Delete user ──────────────────────────────────────
router.delete('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.logAudit({
      userId: id, actor: 'admin', action: 'delete',
      ipAddress: req.ip, userAgent: req.get('user-agent')
    });
    const result = await db.deleteUser(id);
    res.json({ ok: true, deleted: result.changes });
  } catch (err) {
    console.error('[admin/api/users/:id DELETE]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ── API: Audit log ────────────────────────────────────────
router.get('/api/audit', async (req, res) => {
  try {
    const { user_id, limit } = req.query;
    const log = await db.getAuditLog({
      userId: user_id ? parseInt(user_id) : null,
      limit: parseInt(limit) || 50
    });
    res.json({ log });
  } catch (err) {
    console.error('[admin/api/audit]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

module.exports = router;
