// ═══════════════════════════════════════════════════════
// Auth middleware — token-based + device binding + status check
// Customer dapet unique token via email, klik link → auto-bind device
// ═══════════════════════════════════════════════════════

const db = require('./db');
const { checkDeviceBinding } = require('./device');

function extractToken(req) {
  return (
    req.query.token ||
    req.body?.token ||
    req.headers['x-maxlook-token'] ||
    req.cookies?.maxlook_token ||
    null
  );
}

async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'no_token', message: 'Token tidak ditemukan. Pakai link akses dari email.' });
    }

    const user = await db.findUserByToken(token);
    if (!user) {
      // Debug: log exact token being looked up + nearest match
      console.warn(`[auth] Token NOT FOUND. Received: "${token}" (length=${token.length}, charCodes=${[...token].map(c => c.charCodeAt(0)).join(',')})`);
      // Try to find similar tokens for debugging
      const { data: similar } = await db.supabase
        .from('maxlook_users')
        .select('token,name,status')
        .ilike('token', `%${token.slice(4, 8)}%`)
        .limit(3);
      if (similar && similar.length) {
        console.warn(`[auth] Similar tokens in DB:`, similar.map(s => `"${s.token}" (${s.name}, ${s.status})`).join(' | '));
      } else {
        console.warn(`[auth] No similar tokens found in DB.`);
      }
      return res.status(401).json({ error: 'invalid_token', message: 'Token gak valid. Cek email aktivasi atau hubungi admin.' });
    }

    // Status check
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'suspended', message: 'Akses lo di-suspend. Hubungi admin via email/WhatsApp.' });
    }
    if (user.status === 'expired') {
      return res.status(403).json({ error: 'expired', message: 'Akses lo udah expired. Hubungi admin untuk perpanjang.' });
    }

    // Device binding check
    const deviceCheck = await checkDeviceBinding({ user, req, res, db });
    if (!deviceCheck.ok) {
      return res.status(403).json({
        error: deviceCheck.reason || 'device_blocked',
        message: deviceCheck.message || 'Device tidak terotorisasi'
      });
    }

    // If status was 'pending' and just activated, refresh user object
    if (user.status === 'pending' || deviceCheck.bound) {
      const refreshed = await db.findUserById(user.id);
      req.user = refreshed || user;
    } else {
      req.user = user;
    }
    req.token = token;
    next();
  } catch (err) {
    console.error('[auth.requireAuth]', err);
    res.status(500).json({ error: 'auth_error', message: 'Auth check gagal. Coba refresh.' });
  }
}

// Soft auth — sets req.user if token valid, otherwise continues
async function softAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const user = await db.findUserByToken(token);
      if (user && user.status !== 'suspended' && user.status !== 'expired') {
        const deviceCheck = await checkDeviceBinding({ user, req, res, db });
        if (deviceCheck.ok) {
          const refreshed = deviceCheck.bound ? (await db.findUserById(user.id)) : user;
          req.user = refreshed || user;
          req.token = token;
        }
      }
    }
    next();
  } catch (err) {
    console.error('[auth.softAuth]', err);
    next(); // Soft auth — never block on error
  }
}

module.exports = { requireAuth, softAuth };
