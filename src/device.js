// ═══════════════════════════════════════════════════════
// Device Binding — 1-device-per-token enforcement
//
// Strategy:
//   - On first auth: generate UUID, set cookie, save to user.device_id
//   - On subsequent auth: cookie UUID must match user.device_id
//   - If mismatch → block (admin can reset via admin panel)
//   - "Reset device" admin action = clear user.device_id → next auth re-binds
//
// Cookie name: maxlook_device
// Cookie age: 10 years (effectively permanent)
// ═══════════════════════════════════════════════════════

const crypto = require('crypto');

const COOKIE_NAME = 'maxlook_device';
const COOKIE_MAX_AGE = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years in ms

function generateDeviceId() {
  return crypto.randomUUID();
}

// Read device cookie from request
function readDeviceCookie(req) {
  // Manual cookie parser (we don't want extra dep)
  const cookieHeader = req.headers?.cookie || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Set device cookie on response
function setDeviceCookie(res, deviceId) {
  const expires = new Date(Date.now() + COOKIE_MAX_AGE).toUTCString();
  // Set-Cookie header (Path=/, no HttpOnly because we may want JS access; SameSite=Lax)
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(deviceId)}; Path=/; Expires=${expires}; SameSite=Lax`;
  res.setHeader('Set-Cookie', cookie);
}

// Check device binding
// Returns: { ok: true } | { ok: false, reason }
// Side-effect: if user has no device_id yet, BIND it (auto-bind on first login)
async function checkDeviceBinding({ user, req, res, db }) {
  // Read existing cookie
  const cookieDevice = readDeviceCookie(req);

  // ── Case 1: User belum punya device binding ──
  if (!user.device_id) {
    // Auto-bind: use existing cookie (if any) or generate new
    const newDeviceId = cookieDevice || generateDeviceId();
    const userAgent = req.get('user-agent') || '';

    await db.updateUser(user.id, {
      device_id: newDeviceId,
      device_bound_at: new Date().toISOString(),
      device_user_agent: userAgent.slice(0, 500),
      // Also mark as activated if still pending
      ...(user.status === 'pending' ? { status: 'activated', activated_at: new Date().toISOString() } : {}),
      last_login_at: new Date().toISOString()
    });

    if (!cookieDevice) setDeviceCookie(res, newDeviceId);
    return { ok: true, bound: true };
  }

  // ── Case 2: User punya device_id, cookie ada → check match ──
  if (cookieDevice && cookieDevice === user.device_id) {
    // Update last_login_at (don't await — fire & forget for perf)
    db.updateUser(user.id, { last_login_at: new Date().toISOString() }).catch(err => {
      console.error('[device.checkDeviceBinding] update last_login_at failed:', err.message);
    });
    return { ok: true };
  }

  // ── Case 3: Cookie mismatch atau gak ada cookie → BLOCKED ──
  return {
    ok: false,
    reason: 'device_mismatch',
    message: 'Akses ini udah di-bind ke device lain. Hubungi admin via WhatsApp untuk reset device kalau lo ganti HP/laptop.'
  };
}

module.exports = {
  generateDeviceId,
  readDeviceCookie,
  setDeviceCookie,
  checkDeviceBinding,
  COOKIE_NAME
};
