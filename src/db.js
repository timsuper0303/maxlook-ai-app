// ═══════════════════════════════════════════════════════
// Supabase-backed Database — replaces JSON file storage
// All functions are ASYNC (return Promises). Callers must use await.
// Tables: maxlook_users, maxlook_scans, maxlook_templates
// ═══════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('[db] SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum di-set di .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ── Users ─────────────────────────────────────────────────

async function findUserByToken(token) {
  if (!token) return null;
  const { data, error } = await supabase
    .from('maxlook_users')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (error) {
    console.error('[db.findUserByToken]', error.message);
    return null;
  }
  return data || null;
}

async function findUserById(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from('maxlook_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('[db.findUserById]', error.message);
    return null;
  }
  return data || null;
}

async function listUsers() {
  const { data, error } = await supabase
    .from('maxlook_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[db.listUsers]', error.message);
    return [];
  }
  return data || [];
}

async function createUser({ token, name, phone, email, gender, variant }) {
  const { data, error } = await supabase
    .from('maxlook_users')
    .insert({
      token,
      name,
      phone: phone || null,
      email: email || null,
      gender,
      variant: variant || 'maxlook',
      total_scans: 0
    })
    .select()
    .single();
  if (error) throw new Error(`[db.createUser] ${error.message}`);
  return data;
}

async function updateUser(id, patch) {
  const { data, error } = await supabase
    .from('maxlook_users')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('[db.updateUser]', error.message);
    return null;
  }
  return data;
}

async function deleteUser(id) {
  // Cascade delete handled by ON DELETE CASCADE in maxlook_scans
  const { error, count } = await supabase
    .from('maxlook_users')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw new Error(`[db.deleteUser] ${error.message}`);
  return { changes: count || 0 };
}

// ── Scans ─────────────────────────────────────────────────

async function getUserScans(userId, limit = 20) {
  const { data, error } = await supabase
    .from('maxlook_scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[db.getUserScans]', error.message);
    return [];
  }
  return data || [];
}

async function getLatestScan(userId) {
  const scans = await getUserScans(userId, 1);
  return scans[0] || null;
}

async function getScanById(scanId) {
  if (!scanId) return null;
  const { data, error } = await supabase
    .from('maxlook_scans')
    .select('*')
    .eq('id', scanId)
    .maybeSingle();
  if (error) {
    console.error('[db.getScanById]', error.message);
    return null;
  }
  return data || null;
}

// ── Baseline = user's first scan (scan_number=1) ──
async function getUserBaseline(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('maxlook_scans')
    .select('id, scan_number, overall_score, potential_score, skin_glow, jawline, harmony, created_at')
    .eq('user_id', userId)
    .eq('scan_number', 1)
    .maybeSingle();
  if (error) {
    console.error('[db.getUserBaseline]', error.message);
    return null;
  }
  return data || null;
}

// ── Previous scan = the scan right before given scan (scan_number=N-1) ──
async function getPreviousScan(userId, beforeScanNumber) {
  if (!userId || !beforeScanNumber || beforeScanNumber <= 1) return null;
  const { data, error } = await supabase
    .from('maxlook_scans')
    .select('id, scan_number, overall_score, potential_score, skin_glow, jawline, harmony, created_at')
    .eq('user_id', userId)
    .eq('scan_number', beforeScanNumber - 1)
    .maybeSingle();
  if (error) {
    console.error('[db.getPreviousScan]', error.message);
    return null;
  }
  return data || null;
}

// ── Build scan context (for AI prompt + frontend display) ──
// Returns: { baseline, previous, deltaSinceBaseline, deltaSincePrevious, smoothedOverall, scanNumber }
async function buildScanContext(userId, currentScan) {
  if (!currentScan) return null;
  const scanNumber = currentScan.scan_number || 1;
  if (scanNumber <= 1) {
    return {
      scan_number: 1,
      is_baseline: true,
      baseline: null,
      previous: null,
      delta_since_baseline: 0,
      delta_since_previous: 0,
      smoothed_overall: currentScan.overall_score || 0
    };
  }
  const baseline = await getUserBaseline(userId);
  const previous = await getPreviousScan(userId, scanNumber);
  const currentOverall = currentScan.overall_score || 0;
  const prevOverall = previous?.overall_score || currentOverall;
  return {
    scan_number: scanNumber,
    is_baseline: false,
    baseline: baseline,
    previous: previous,
    delta_since_baseline: baseline ? (currentOverall - (baseline.overall_score || 0)) : 0,
    delta_since_previous: previous ? (currentOverall - prevOverall) : 0,
    smoothed_overall: Math.round((currentOverall + prevOverall) / 2)
  };
}

async function createScan({ userId, imagePath, result, faceLandmarks, asymmetryAnalysis, faceThirds }) {
  const user = await findUserById(userId);
  if (!user) throw new Error('User not found');

  const scanNumber = (user.total_scans || 0) + 1;

  const { data, error } = await supabase
    .from('maxlook_scans')
    .insert({
      user_id: userId,
      scan_number: scanNumber,
      // Core scores
      overall_score: result.overall || null,
      potential_score: result.potential || null,
      skin_glow: result.scores?.skin_glow || null,
      symmetry: result.scores?.symmetry || null,
      jawline: result.scores?.jawline || null,
      eye_area: result.scores?.eye_area || null,
      harmony: result.scores?.harmony || null,
      skin_type: result.skin_type || null,
      undertone: result.undertone || null,
      season: result.season || null,
      // Enhanced fields v2
      face_shape: result.face_shape || null,
      face_landmarks: faceLandmarks || null,
      face_thirds: result.face_thirds || faceThirds || null,
      golden_ratio_score: result.golden_ratio_score || null,
      asymmetry_score: result.asymmetry_score || asymmetryAnalysis?.overall_asymmetry_score || null,
      detailed_concerns: result.detailed_concerns || null,
      top_concerns: result.top_concerns || null,
      annotation_zones: result.annotation_zones || null,
      lifestyle_indicators: result.lifestyle_indicators || null,
      // Photo handling — never store the photo itself
      photo_processed_at: new Date().toISOString(),
      photo_auto_deleted: true,
      // Raw + status
      raw_result: result,
      vision_status: 'done',
      image_gen_status: 'pending'
    })
    .select()
    .single();

  if (error) throw new Error(`[db.createScan] ${error.message}`);

  // Update user stats
  await updateUser(userId, {
    last_scan_at: data.created_at,
    total_scans: scanNumber
  });

  return data;
}

async function updateScan(scanId, patch) {
  const { data, error } = await supabase
    .from('maxlook_scans')
    .update(patch)
    .eq('id', scanId)
    .select()
    .single();
  if (error) {
    console.error('[db.updateScan]', error.message);
    return null;
  }
  return data;
}

// ── Rate limiting ─────────────────────────────────────────

async function canUserScan(userId, weekLimit = 1) {
  const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('maxlook_scans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sinceDate);
  if (error) {
    console.error('[db.canUserScan]', error.message);
    return false; // Fail-safe: block scan if DB broken
  }
  return (count || 0) < weekLimit;
}

async function nextAllowedScanAt(userId) {
  const lastScan = await getLatestScan(userId);
  if (!lastScan) return null;
  const lastDate = new Date(lastScan.created_at);
  return new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

// ── Templates ─────────────────────────────────────────────

async function listTemplates({ category, gender, limit = 100 } = {}) {
  let q = supabase
    .from('maxlook_templates')
    .select('*')
    .eq('active', true)
    .limit(limit);
  if (category) q = q.eq('category', category);
  if (gender) q = q.eq('gender', gender);
  const { data, error } = await q;
  if (error) {
    console.error('[db.listTemplates]', error.message);
    return [];
  }
  return data || [];
}

async function createTemplate(template) {
  const { data, error } = await supabase
    .from('maxlook_templates')
    .insert(template)
    .select()
    .single();
  if (error) throw new Error(`[db.createTemplate] ${error.message}`);
  return data;
}

// ── Storage helpers (Supabase Storage) ────────────────────

async function uploadScanImage(userId, scanId, fileBuffer, contentType = 'image/jpeg') {
  const ext = contentType.split('/')[1] || 'jpg';
  const path = `users/${userId}/scan-${scanId}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('maxlook-scans')
    .upload(path, fileBuffer, { contentType, upsert: false });
  if (error) throw new Error(`[db.uploadScanImage] ${error.message}`);
  return { path: data.path };
}

async function getScanImageSignedUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from('maxlook-scans')
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(`[db.getScanImageSignedUrl] ${error.message}`);
  return data.signedUrl;
}

async function uploadGeneratedImage(scanId, kind, fileBuffer, contentType = 'image/png') {
  // kind = 'color-analysis' | 'skin-analysis' | 'glowup-potential'
  const ext = contentType.split('/')[1] || 'png';
  const path = `generated/scan-${scanId}/${kind}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('maxlook-scans')
    .upload(path, fileBuffer, { contentType, upsert: true });
  if (error) throw new Error(`[db.uploadGeneratedImage] ${error.message}`);
  const signed = await getScanImageSignedUrl(data.path, 60 * 60 * 24 * 7); // 7-day URL
  return { path: data.path, signedUrl: signed };
}

// ── Admin / Stats queries ─────────────────────────────────

async function findUserByEmail(email) {
  if (!email) return null;
  const { data, error } = await supabase
    .from('maxlook_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) {
    console.error('[db.findUserByEmail]', error.message);
    return null;
  }
  return data || null;
}

async function findUserByOrderId(orderId) {
  if (!orderId) return null;
  const { data, error } = await supabase
    .from('maxlook_users')
    .select('*')
    .eq('order_id', String(orderId))
    .maybeSingle();
  if (error) {
    console.error('[db.findUserByOrderId]', error.message);
    return null;
  }
  return data || null;
}

async function listUsersWithFilters({ status, search, limit = 200, offset = 0 } = {}) {
  let q = supabase
    .from('maxlook_users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status && status !== 'all') q = q.eq('status', status);
  if (search) {
    // Search across name, email, phone, token, order_id
    q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,token.ilike.%${search}%,order_id.ilike.%${search}%`);
  }
  const { data, error, count } = await q;
  if (error) {
    console.error('[db.listUsersWithFilters]', error.message);
    return { users: [], total: 0 };
  }
  return { users: data || [], total: count || 0 };
}

async function getUserStats() {
  // Get count per status using groupby (Supabase doesn't have native groupBy in SDK,
  // so we'll do a single full select of just the status column and aggregate in JS)
  const { data, error } = await supabase
    .from('maxlook_users')
    .select('status');
  if (error) {
    console.error('[db.getUserStats]', error.message);
    return { total: 0, pending: 0, activated: 0, active: 0, suspended: 0, expired: 0 };
  }
  const counts = { total: data.length, pending: 0, activated: 0, active: 0, suspended: 0, expired: 0 };
  for (const row of data) {
    if (row.status && counts.hasOwnProperty(row.status)) counts[row.status]++;
  }
  return counts;
}

// ── Audit log ─────────────────────────────────────────────

async function logAudit({ userId, actor, action, details, ipAddress, userAgent }) {
  try {
    await supabase
      .from('maxlook_audit_log')
      .insert({
        user_id: userId || null,
        actor: actor || 'system',
        action,
        details: details || null,
        ip_address: ipAddress || null,
        user_agent: userAgent ? String(userAgent).slice(0, 500) : null
      });
  } catch (err) {
    console.error('[db.logAudit]', err.message);
    // Don't throw — audit log failure shouldn't break the action
  }
}

async function getAuditLog({ userId, limit = 50 } = {}) {
  let q = supabase
    .from('maxlook_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) {
    console.error('[db.getAuditLog]', error.message);
    return [];
  }
  return data || [];
}

module.exports = {
  // Users
  findUserByToken,
  findUserById,
  findUserByEmail,
  findUserByOrderId,
  listUsers,
  listUsersWithFilters,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  // Scans
  getUserScans,
  getLatestScan,
  getScanById,
  getUserBaseline,
  getPreviousScan,
  buildScanContext,
  createScan,
  updateScan,
  canUserScan,
  nextAllowedScanAt,
  // Templates
  listTemplates,
  createTemplate,
  // Storage
  uploadScanImage,
  getScanImageSignedUrl,
  uploadGeneratedImage,
  // Audit log
  logAudit,
  getAuditLog,
  // Raw client (for advanced use)
  supabase
};
