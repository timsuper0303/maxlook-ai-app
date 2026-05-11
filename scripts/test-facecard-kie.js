#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Test Facecard via KIE.ai Nano Banana
// API: https://api.kie.ai/api/v1/jobs/
// Model: google/nano-banana-edit (image-to-image)
// Usage: npm run test-facecard-kie
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const KIE_API_KEY = process.env.KIE_NANO_KEY || '637d6fb16d43d520fb57fc5af1575574';
const KIE_BASE_URL = 'https://api.kie.ai';

const outDir = path.join(__dirname, '..', 'test-output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   🍌 Test Facecard via KIE.ai Nano Banana');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log(`  KIE Key: ${KIE_API_KEY.slice(0, 10)}...${KIE_API_KEY.slice(-6)}`);
console.log('');

// ── Smart file detection ──
function findPhoto(variantHint) {
  if (!fs.existsSync(outDir)) return null;
  const files = fs.readdirSync(outDir);
  const exts = ['.jpg', '.jpeg', '.png', '.webp'];
  const patterns = [
    new RegExp(`sample[\\s_-]*user[\\s_-]*${variantHint}`, 'i'),
    new RegExp(`sample[\\s_-]*${variantHint}`, 'i'),
    new RegExp(`${variantHint}`, 'i'),
    new RegExp(`sample[\\s_-]*user`, 'i'),
    /selfie/i
  ];
  for (const pat of patterns) {
    const match = files.find(f => {
      const ext = path.extname(f).toLowerCase();
      if (!exts.includes(ext)) return false;
      if (f.startsWith('facecard-') || f.startsWith('nano-') || f.startsWith('gpt-image-')) return false;
      return pat.test(f);
    });
    if (match) return path.join(outDir, match);
  }
  return null;
}

// ── Upload photo to temp public URL (tmpfiles.org) ──
async function uploadTempImage(imagePath) {
  console.log(`  📤 Uploading photo to temp host (tmpfiles.org)...`);
  const buffer = fs.readFileSync(imagePath);
  const filename = path.basename(imagePath);

  const formData = new FormData();
  const blob = new Blob([buffer]);
  formData.append('file', blob, filename);

  try {
    const res = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    if (json.status === 'success' && json.data?.url) {
      // tmpfiles returns viewing URL; need to convert to direct download
      const url = json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      console.log(`     ✅ Uploaded: ${url}`);
      return url;
    }
    throw new Error(`Upload failed: ${JSON.stringify(json).slice(0, 200)}`);
  } catch (e) {
    console.error(`     ❌ Upload error: ${e.message}`);
    return null;
  }
}

// ── Master prompt (variant-aware with hijab support) ──
function buildPrompt(variant, wearsHijab = false) {
  const isWoman = variant === 'woman';
  const isHijab = isWoman && wearsHijab;

  const accent = isWoman
    ? 'Use rose pink (#E8639A) and gold (#D4AF37) as accent colors. Soft cream/blush base. Feminine elegant feel.'
    : 'Use red (#FF0000) and orange (#ff6633) as accent colors. Neutral cream/beige base. Masculine sophisticated feel.';

  // SECTION 2 — color analysis (clothing vs hijab)
  const section2 = isHijab
    ? `SECTION 2 — PERSONAL COLOR ANALYSIS
Side-by-side HIJAB color comparisons using the same portrait wearing different colored hijabs. 4 best colors + 4 unsuitable colors for her undertone. Realistic hijab fabric color variations (pashmina/silk texture). Small palette swatches. Short labels: "Best Match", "Soft Contrast", "Too Dull", "Brightens Skin".`
    : `SECTION 2 — PERSONAL COLOR ANALYSIS
Side-by-side clothing color comparisons using the same portrait. 4 best colors + 4 unsuitable colors. Realistic outfit color variations. Small palette swatches. Short labels: "Best Match", "Soft Contrast", "Too Dull", "Brightens Skin".`;

  // SECTION 3 — hairstyle vs hijab style
  const section3 = isHijab
    ? `SECTION 3 — HIJAB STYLE ANALYSIS
Realistic hijab style comparisons using the same face. 4 hijab styles to show, all with realistic Indonesian Muslim woman aesthetic:
- Pashmina (long flowy shawl with peak at forehead)
- Segi Empat (square folded with structured front)
- Instant (pre-formed neat slip-on hijab)
- Modern wrap (turban-style fashion-forward)
Short labels: "Frames Face", "Soft Draping", "Adds Structure", "Modern Edge".
Maintain full modest coverage (no hair showing).`
    : `SECTION 3 — HAIRSTYLE ANALYSIS
Realistic hairstyle comparisons using the same face. 3 suitable + 3 not suitable. Modern trendy hairstyles. Short labels: "Adds Balance", "Soft Volume", "Too Wide", "Sharp Structure".`;

  // SECTION 1 — face features (skip hair label if hijab)
  const section1Features = isHijab
    ? 'face shape, eyes, eyebrows, nose, cheeks, lips, jawline (no hair/hairline since wearing hijab)'
    : 'face shape, eyes, eyebrows, nose, cheeks, lips, jawline';

  const hijabPreserveNote = isHijab
    ? '\n- Subject is wearing hijab. ALL panels must show subject with hijab (modest coverage, no hair visible).'
    : '';

  return `Create a premium all-in-one modern infographic poster in PORTRAIT format (close to 4:5 ratio) using the uploaded portrait as the main subject — 100% facial resemblance preserved.

POSTER STYLE: minimal, aesthetic, luxury editorial, visual-first, clean typography, rounded cards, thin lines, subtle shadows, premium infographic layout, soft modern UI design.

MAIN TITLE: "Personal Style & Face Analysis"

ACCENT COLOR THEME: ${accent}

CREATE ONE UNIFIED INFOGRAPHIC BOARD combining:

SECTION 1 — FACE FEATURES ANALYSIS
Analyze the facial features. Detect and label: ${section1Features}. Thin elegant arrows pointing to each feature. Rounded glassmorphism info cards. Each card: short title + 2-3 short bullet descriptions.

${section2}

${section3}

SECTION 4 — SPECTACLES GUIDE
Realistic glasses try-on using same portrait. 4 suitable + 4 unsuitable frames. Short labels: "Best Fit", "Balances Face", "Too Heavy", "Softens Features".

DESIGN RULES:
- Portrait poster, ultra high quality, luxury editorial aesthetic
- Apple-style infographic, Pinterest premium beauty board, Korean luxury editorial style
- Clean modern typography, no clutter, no long paragraphs
- Realistic portrait preservation — face MUST remain 100% identical to input
- Person ethnicity: Indonesian/Asian, same age, same features
- DO NOT add brand text/logo/watermark (will be HTML-overlaid)
- Avoid any text that could be misspelled — use short clear labels only${hijabPreserveNote}

CRITICAL: Same person across ALL panels. Identity preservation 100%.`;
}

// ── KIE.ai job creation + polling ──
async function generateViaKie(imageUrl, variant, wearsHijab = false) {
  const prompt = buildPrompt(variant, wearsHijab);

  console.log(`  📤 Submitting job to KIE.ai (nano-banana-edit) ${wearsHijab ? '[HIJAB]' : ''}...`);

  try {
    const createRes = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/nano-banana-edit',
        input: {
          prompt: prompt,
          image_urls: [imageUrl],
          output_format: 'png',
          image_size: 'auto'
        }
      })
    });

    const createJson = await createRes.json();
    console.log(`     Response: ${JSON.stringify(createJson).slice(0, 300)}`);

    if (createJson.code !== 200 || !createJson.data?.taskId) {
      console.error(`     ❌ Create task failed`);
      return null;
    }

    const taskId = createJson.data.taskId;
    console.log(`     ✅ Task created: ${taskId}`);

    // Poll for result
    console.log(`  ⏳ Polling for result (max 3 menit)...`);
    const startTs = Date.now();
    const maxWaitMs = 3 * 60 * 1000;
    let pollCount = 0;

    while (Date.now() - startTs < maxWaitMs) {
      await new Promise(r => setTimeout(r, 5000)); // poll every 5s
      pollCount++;

      const pollRes = await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
      });
      const pollJson = await pollRes.json();

      if (pollCount === 1) {
        console.log(`     First poll response: ${JSON.stringify(pollJson).slice(0, 300)}`);
      }

      const state = pollJson.data?.state || pollJson.data?.status;
      const elapsed = ((Date.now() - startTs) / 1000).toFixed(0);
      console.log(`     [${elapsed}s] state=${state}`);

      if (state === 'success' || state === 'completed') {
        const resultJson = pollJson.data?.resultJson;
        let resultUrls = [];
        try {
          const parsed = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
          resultUrls = parsed?.resultUrls || parsed?.urls || [];
        } catch (e) {}
        if (!resultUrls.length) resultUrls = pollJson.data?.resultUrls || pollJson.data?.urls || [];

        if (resultUrls.length === 0) {
          console.error(`     ⚠️  No result URLs in response: ${JSON.stringify(pollJson.data).slice(0, 300)}`);
          return null;
        }

        // Download first result
        const resultUrl = resultUrls[0];
        console.log(`     📥 Downloading: ${resultUrl}`);
        const imgRes = await fetch(resultUrl);
        const imgBuf = Buffer.from(await imgRes.arrayBuffer());
        const suffix = wearsHijab ? '-hijab' : '';
        const outFile = path.join(outDir, `facecard-kie-${variant}${suffix}.png`);
        fs.writeFileSync(outFile, imgBuf);
        console.log(`     ✅ SUCCESS — ${(imgBuf.length / 1024).toFixed(1)} KB → ${path.relative(process.cwd(), outFile)}`);
        return outFile;
      }

      if (state === 'failed' || state === 'fail') {
        console.error(`     ❌ Task failed: ${pollJson.data?.errorMessage || pollJson.data?.failMsg || 'unknown'}`);
        return null;
      }
    }

    console.error(`     ⏱️  Timeout setelah 3 menit`);
    return null;

  } catch (e) {
    console.error(`     ❌ Error: ${e.message}`);
    return null;
  }
}

// ── MAIN ──
(async () => {
  const results = [];

  // Detect hijab photo separately: "sample user woman hijab.jpg"
  function findHijabPhoto() {
    const files = fs.readdirSync(outDir);
    const exts = ['.jpg', '.jpeg', '.png', '.webp'];
    const match = files.find(f => {
      const ext = path.extname(f).toLowerCase();
      if (!exts.includes(ext)) return false;
      if (f.startsWith('facecard-')) return false;
      return /hijab|jilbab|kerudung/i.test(f);
    });
    return match ? path.join(outDir, match) : null;
  }

  // Test scenarios — Man + Woman-with-Hijab (existing woman photo is already hijabi)
  const scenarios = [
    { variant: 'man', wearsHijab: false, photoFinder: () => findPhoto('man') },
    { variant: 'woman', wearsHijab: true, photoFinder: () => findHijabPhoto() || findPhoto('woman') }
  ];

  for (const s of scenarios) {
    const input = s.photoFinder();
    const label = s.variant + (s.wearsHijab ? ' (HIJAB)' : '');

    if (!input) {
      console.log(`  ⚠️  No photo for ${label}, skip`);
      continue;
    }
    console.log('');
    console.log(`  ───────────────────────────────────────────────`);
    console.log(`  🎨 ${label.toUpperCase()} variant`);
    console.log(`  ───────────────────────────────────────────────`);
    console.log(`  Input: ${path.relative(process.cwd(), input)}`);

    // Upload to temp host
    const tempUrl = await uploadTempImage(input);
    if (!tempUrl) {
      console.error(`     ❌ Skip ${label} — upload failed`);
      continue;
    }

    // Generate via KIE
    const result = await generateViaKie(tempUrl, s.variant, s.wearsHijab);
    if (result) results.push({ variant: s.variant, hijab: s.wearsHijab, file: result });
  }

  // SUMMARY
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  if (results.length === 0) {
    console.log('  ❌ Tidak ada facecard yang berhasil di-generate.');
  } else {
    console.log(`  ✅ ${results.length} facecard generated via KIE.ai Nano Banana:`);
    results.forEach(r => {
      const label = r.variant + (r.hijab ? ' (HIJAB)' : '');
      console.log(`     • ${label}: ${path.relative(process.cwd(), r.file)}`);
    });
  }
  console.log('');
  console.log('  💰 Cost: Check KIE.ai dashboard untuk credit usage');
  console.log('');
  process.exit(0);
})();
