// ═══════════════════════════════════════════════════════
// Maxlook AI App — Main Server
// Express + SQLite + KIE.ai (OpenAI-compatible)
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { requireAuth, softAuth } = require('./src/auth');
const db = require('./src/db');
const { runFullScan } = require('./src/scan-handler');
const { generateRoadmapHTML } = require('./src/roadmap-generator');
const adminRouter = require('./src/routes/admin');
const webhookRouter = require('./src/routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads dir exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer config — store in memory then write to disk after auth
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      const safeName = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, safeName);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Format file harus JPG/PNG/WEBP'));
  }
});

// ── Middleware ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Mount admin & webhook routers ───────────────────────
app.use('/admin', adminRouter);
app.use('/webhook', webhookRouter);

// ── Public routes ───────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auth check route ────────────────────────────────────
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const { id, name, gender, variant, total_scans, last_scan_at, created_at } = req.user;
    const canScan = await db.canUserScan(id, parseInt(process.env.SCAN_LIMIT_PER_WEEK || '1'));
    const nextScanAt = canScan ? null : await db.nextAllowedScanAt(id);
    res.json({
      user: { id, name, gender, variant, total_scans, last_scan_at, created_at },
      canScan,
      nextScanAt
    });
  } catch (err) {
    console.error('[GET /api/me]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ── Scan history ────────────────────────────────────────
app.get('/api/scans', requireAuth, async (req, res) => {
  try {
    const scans = await db.getUserScans(req.user.id, 20);
    res.json({ scans });
  } catch (err) {
    console.error('[GET /api/scans]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

app.get('/api/scans/latest', requireAuth, async (req, res) => {
  try {
    const scan = await db.getLatestScan(req.user.id);
    if (!scan) return res.status(404).json({ error: 'no_scan' });
    const scan_context = await db.buildScanContext(req.user.id, scan);
    res.json({ scan, scan_context });
  } catch (err) {
    console.error('[GET /api/scans/latest]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

app.get('/api/scans/:id', requireAuth, async (req, res) => {
  try {
    const scan = await db.getScanById(parseInt(req.params.id));
    if (!scan || scan.user_id !== req.user.id) return res.status(404).json({ error: 'not_found' });
    const scan_context = await db.buildScanContext(req.user.id, scan);
    res.json({ scan, scan_context });
  } catch (err) {
    console.error('[GET /api/scans/:id]', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ── Scan upload + AI processing ─────────────────────────
app.post('/api/scan', requireAuth, upload.single('selfie'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no_file', message: 'Upload selfie dulu' });

    // Rate limit
    const weekLimit = parseInt(process.env.SCAN_LIMIT_PER_WEEK || '1');
    const allowed = await db.canUserScan(req.user.id, weekLimit);
    if (!allowed) {
      const nextAt = await db.nextAllowedScanAt(req.user.id);
      return res.status(429).json({
        error: 'rate_limit',
        message: `Lo udah scan minggu ini. Re-scan available: ${nextAt ? new Date(nextAt).toLocaleString('id-ID') : 'minggu depan'}`,
        nextScanAt: nextAt
      });
    }

    console.log(`[scan] User ${req.user.id} (${req.user.name}) uploading scan...`);

    const imagePath = `/uploads/${req.file.filename}`;
    const fullPath = req.file.path;

    // Parse client-side facial analysis if provided (face-api.js)
    let faceLandmarks = null;
    let asymmetryAnalysis = null;
    let faceThirds = null;
    let faceBox = null;
    try {
      if (req.body.face_landmarks) faceLandmarks = JSON.parse(req.body.face_landmarks);
      if (req.body.asymmetry_analysis) asymmetryAnalysis = JSON.parse(req.body.asymmetry_analysis);
      if (req.body.face_thirds) faceThirds = JSON.parse(req.body.face_thirds);
      if (req.body.face_box) faceBox = JSON.parse(req.body.face_box);
    } catch (e) {
      console.warn('[scan] Client analysis parse failed (non-fatal):', e.message);
    }

    // Optional form fields (age, height, weight, goals, wears_hijab)
    const userInfo = {
      age: req.body.age ? parseInt(req.body.age) : null,
      height_cm: req.body.height ? parseInt(req.body.height) : null,
      weight_kg: req.body.weight ? parseInt(req.body.weight) : null,
      wears_hijab: req.body.wears_hijab === '1' || req.body.wears_hijab === 'true',
      goals: req.body.goals ? (() => { try { return JSON.parse(req.body.goals); } catch (e) { return []; } })() : []
    };
    console.log('[scan] User info:', userInfo);

    // Fetch prior scan context (for AI progression-aware scoring)
    const priorLatest = await db.getLatestScan(req.user.id);
    let priorContext = null;
    if (priorLatest) {
      const baseline = await db.getUserBaseline(req.user.id);
      priorContext = {
        scan_number: (priorLatest.scan_number || 0) + 1,
        baseline_overall: baseline?.overall_score || null,
        baseline_date: baseline?.created_at || null,
        previous_overall: priorLatest.overall_score || null,
        previous_potential: priorLatest.potential_score || null,
        previous_date: priorLatest.created_at || null,
        previous_top_concerns: (priorLatest.top_concerns || []).slice(0, 3).map(c => c.name)
      };
      console.log('[scan] Prior context:', priorContext);
    }

    // Run AI scan
    const result = await runFullScan({
      imagePath: fullPath,
      gender: req.user.gender,
      variant: req.user.variant,
      userInfo,
      priorContext
    });

    // Save to DB (with enhanced fields v2)
    const scan = await db.createScan({
      userId: req.user.id,
      imagePath,
      result,
      faceLandmarks,
      asymmetryAnalysis,
      faceThirds
    });

    // Auto-delete photo from disk (privacy-first)
    try {
      fs.unlinkSync(fullPath);
      console.log(`[scan] Photo auto-deleted from disk: ${req.file.filename}`);
    } catch (e) {
      console.warn(`[scan] Photo delete failed (non-fatal): ${e.message}`);
    }

    console.log(`[scan] User ${req.user.id} scan #${scan.scan_number} done. Overall: ${result.overall}, top_concerns: ${result.top_concerns?.length || 0}`);

    res.json({
      success: true,
      scan,
      result
    });
  } catch (error) {
    console.error('[scan] Error:', error);
    res.status(500).json({
      error: 'scan_failed',
      message: error.message || 'AI scan gagal. Coba lagi atau hubungi admin.'
    });
  }
});

// ── Roadmap HTML ────────────────────────────────────────
app.get('/api/roadmap', requireAuth, async (req, res) => {
  try {
    const scan = await db.getLatestScan(req.user.id);
    if (!scan) {
      return res.status(404).send('<h1>Belum ada scan</h1><p>Scan dulu di /scan biar dapet roadmap personalize.</p>');
    }
    // raw_result is JSONB — already object
    const result = scan.raw_result || {};
    const html = generateRoadmapHTML({
      user: req.user,
      scan,
      result
    });
    res.set('Content-Type', 'text/html').send(html);
  } catch (err) {
    console.error('[GET /api/roadmap]', err);
    res.status(500).send(`<h1>Server error</h1><p>${err.message}</p>`);
  }
});

// ── Static page routes ──────────────────────────────────
app.get('/scan', softAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

app.get('/dashboard', softAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/result', softAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'result.html'));
});

app.get('/bible-man', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bible-man.html'));
});

app.get('/bible-woman', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bible-woman.html'));
});

app.get('/workbook-man', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'workbook-man.html'));
});

app.get('/workbook-woman', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'workbook-woman.html'));
});

// ── Error handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'file_too_large', message: 'File maksimal 8MB' });
  }
  res.status(500).json({ error: 'server_error', message: err.message });
});

// ── Start server ────────────────────────────────────────
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  ✨ Maxlook AI App jalan di http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  → Public:        http://localhost:${PORT}`);
  console.log(`  → Admin Panel:   http://localhost:${PORT}/admin`);
  console.log(`  → Webhook:       POST http://localhost:${PORT}/webhook/orderonline`);
  console.log(`  → Health:        http://localhost:${PORT}/health`);
  console.log('');
  const aiProvider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const geminiOk = !!process.env.GEMINI_API_KEY;
  const openaiOk = !!process.env.KIE_API_KEY;
  const aiStatus = aiProvider === 'gemini'
    ? (geminiOk ? `✅ Gemini ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'} ready` : '❌ Gemini API key missing')
    : (openaiOk ? '✅ OpenAI/KIE ready' : '❌ OpenAI/KIE API key missing');
  console.log(`  → AI Provider:   ${aiStatus}`);
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
});
