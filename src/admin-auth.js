// ═══════════════════════════════════════════════════════
// Admin Auth — hardcoded credentials di .env
// Session via signed cookie (HMAC sha256, 24-jam expiry)
// ═══════════════════════════════════════════════════════

const crypto = require('crypto');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'change-me-in-env';
const COOKIE_NAME = 'maxlook_admin';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.warn('[admin-auth] ADMIN_USERNAME / ADMIN_PASSWORD belum di-set di .env. Admin panel TIDAK BISA diakses sampai di-set.');
}

// Constant-time string comparison
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Sign payload with HMAC
function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
}

// Verify signed cookie value
function verify(cookieValue) {
  if (!cookieValue || !cookieValue.includes('.')) return null;
  const [data, sig] = cookieValue.split('.');
  const expectedSig = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(data)
    .digest('base64url');
  if (!safeEqual(sig, expectedSig)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

// Read admin cookie
function readAdminCookie(req) {
  const cookieHeader = req.headers?.cookie || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Set admin cookie (login)
function setAdminCookie(res, payload) {
  const signed = sign({ ...payload, exp: Date.now() + SESSION_TTL });
  const expires = new Date(Date.now() + SESSION_TTL).toUTCString();
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(signed)}; Path=/; Expires=${expires}; HttpOnly; SameSite=Lax`;
  res.setHeader('Set-Cookie', cookie);
}

// Clear admin cookie (logout)
function clearAdminCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`);
}

// Validate username/password
function validateCredentials(username, password) {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return false;
  return safeEqual(username, ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD);
}

// Express middleware: require admin auth
function requireAdmin(req, res, next) {
  const cookieValue = readAdminCookie(req);
  const payload = verify(cookieValue);
  if (!payload) {
    // For HTML routes redirect to login; for API return 401
    if (req.accepts('html') && !req.accepts('json')) {
      return res.redirect('/admin/login');
    }
    return res.status(401).json({ error: 'unauthorized', message: 'Admin login required' });
  }
  req.admin = payload;
  next();
}

module.exports = {
  validateCredentials,
  setAdminCookie,
  clearAdminCookie,
  readAdminCookie,
  verify,
  requireAdmin,
  COOKIE_NAME
};
