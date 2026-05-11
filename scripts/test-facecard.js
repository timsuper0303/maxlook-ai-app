#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Phase 1: Test Facecard Generation
// Generate sample facecard untuk both Man + Woman variants
// Input: sample-user.jpg (Man) + auto-generate Woman face
// ═══════════════════════════════════════════════════════
//
// Usage: npm run test-facecard
//
// Output:
//   test-output/facecard-man.png
//   test-output/facecard-woman.png
//   test-output/sample-woman.png (intermediate)
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { OpenAI, toFile } = require('openai');

const apiKey = process.env.KIE_API_KEY;
if (!apiKey) {
  console.error('❌ KIE_API_KEY (OpenAI) belum di-set di .env');
  process.exit(1);
}

const client = new OpenAI({
  apiKey,
  baseURL: process.env.KIE_API_BASE_URL || 'https://api.openai.com/v1'
});

const outDir = path.join(__dirname, '..', 'test-output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   🎨 Phase 1: Test Facecard Generation');
console.log('═══════════════════════════════════════════════════════');
console.log('');

// ── MASTER PROMPT (from docs/facecard-prompt.md) ─────────
function buildPrompt(variant) {
  const isWoman = variant === 'woman';
  const accentColors = isWoman
    ? `Use rose pink (#E8639A) and gold (#D4AF37) as accent colors for icons, arrows, and subtle highlights. Maintain soft cream/blush base. Feminine elegant feel.`
    : `Use red (#FF0000) and orange (#ff6633) as accent colors for icons, arrows, and subtle highlights. Maintain neutral cream/beige base. Masculine sophisticated feel.`;

  return `Create a premium all-in-one modern infographic poster in PORTRAIT format (close to 4:5 ratio) using the uploaded portrait as the main subject — 100% facial resemblance preserved.

POSTER STYLE: minimal, aesthetic, luxury editorial, visual-first, clean typography, rounded cards, thin lines, subtle shadows, premium infographic layout, soft modern UI design.

MAIN TITLE: "Personal Style & Face Analysis"

CANVAS & LAYOUT:
- Portrait orientation only
- Vertical editorial poster layout
- Elegant spacing with clean visual hierarchy
- Portrait placed as the main central focus
- Balanced infographic composition from top to bottom
- Premium magazine-style arrangement
- Modern luxury UI aesthetic

ACCENT COLOR THEME: ${accentColors}

═══ CREATE ONE UNIFIED INFOGRAPHIC BOARD ═══

Combine these 4 sections into one cohesive poster:

SECTION 1 — FACE FEATURES ANALYSIS
Automatically analyze the actual facial features from the uploaded portrait. Detect and label: face shape, eyes, eyebrows, nose, cheeks, lips, jawline. Design: thin elegant arrows pointing to each feature, rounded glassmorphism info cards, minimal icons, concise labels only (no paragraphs). Each feature card: short title + 2-3 short bullet descriptions.

SECTION 2 — PERSONAL COLOR ANALYSIS
Create side-by-side clothing color comparisons using the same portrait. Show: best colors (4 variations), unsuitable colors (4 variations). Use realistic outfit color variations. Add small palette swatches and seasonal palette inspiration. Short labels only: "Best Match", "Soft Contrast", "Too Dull", "Brightens Skin".

SECTION 3 — HAIRSTYLE ANALYSIS
Create realistic hairstyle comparisons using the same face. Include: 3 hairstyles that suit the face, 3 hairstyles that do not suit the face. Use modern trendy hairstyles with realistic texture and volume. Examples: textured crop, messy fringe, soft middle part, taper fade, side part, fluffy textured hair. Short labels only: "Adds Balance", "Soft Volume", "Too Wide", "Sharp Structure".

SECTION 4 — SPECTACLES GUIDE
Create realistic glasses try-on comparisons using the same portrait. Recommend: 4 suitable frames, 4 unsuitable frames. Include frame types: round metal, square frames, rectangular frames, thin metal, thick acetate, clubmaster, oversized frames. Short labels only: "Best Fit", "Balances Face", "Too Heavy", "Softens Features".

═══ DESIGN RULES ═══
- Portrait poster only
- Close to 4:5 aspect ratio
- Ultra high quality
- Luxury editorial aesthetic
- Modern infographic composition
- Visual-first layout
- Elegant white space
- Cohesive premium design
- Realistic portrait preservation (face MUST remain identical to input)
- Soft neutral luxury color palette
- Subtle shadows and UI glow
- Apple-style infographic aesthetic
- Pinterest premium beauty analysis board
- Korean luxury editorial style
- Clean modern typography
- Highly detailed
- No clutter
- No long paragraphs
- DO NOT include any brand text, logo, or watermark — brand text will be overlaid via HTML after generation.

CRITICAL: The person's face must remain 100% identical to the input photo. Same ethnicity (Indonesian/Asian), same age, same features. Do not change identity.`;
}

// ── Smart file detection — handle spaces, multiple extensions ──
function findPhoto(variantHint) {
  // variantHint: 'man' | 'woman' | null
  if (!fs.existsSync(outDir)) return null;
  const files = fs.readdirSync(outDir);
  const exts = ['.jpg', '.jpeg', '.png', '.webp'];

  // Strategy 1: name contains "sample" + variant + valid ext
  const patterns = [
    new RegExp(`sample[\\s_-]*user[\\s_-]*${variantHint}`, 'i'),
    new RegExp(`sample[\\s_-]*${variantHint}`, 'i'),
    new RegExp(`${variantHint}`, 'i'),
    new RegExp(`sample[\\s_-]*user`, 'i'),  // fallback: any sample-user file
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

// ── Generate sample Woman face (fallback if no real woman photo) ──
async function generateSampleWomanFace() {
  const womanFile = path.join(outDir, 'sample-woman.png');
  if (fs.existsSync(womanFile)) {
    console.log(`  ⚡ Sample woman face already exists: ${path.relative(process.cwd(), womanFile)}`);
    return womanFile;
  }

  console.log('  🎨 Generating sample Indonesian woman face (text-to-image)...');
  try {
    const result = await client.images.generate({
      model: 'gpt-image-1',
      prompt: 'Photo of young Indonesian woman, age 22, frontal selfie, natural lighting, no makeup, soft smile, looking at camera, neutral background. Realistic photography, high quality.',
      n: 1,
      size: '1024x1024',
      quality: 'low'
    });
    const b64 = result.data?.[0]?.b64_json;
    if (b64) {
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(womanFile, buf);
      console.log(`     ✅ Generated (${(buf.length / 1024).toFixed(1)} KB) → ${path.relative(process.cwd(), womanFile)}`);
      return womanFile;
    }
  } catch (e) {
    console.error(`     ❌ Failed: ${e.message}`);
  }
  return null;
}

// ── Generate facecard (image-to-image) ───────────────────
// Quality tier: 'low' | 'medium' | 'high'
// Cost @ 1024×1536:
//   low:    $0.016 = Rp 256
//   medium: $0.063 = Rp 1.000
//   high:   $0.250 = Rp 4.000
const QUALITY = process.env.FACECARD_QUALITY || 'medium';

async function generateFacecard(inputPath, variant) {
  console.log('');
  console.log(`  ───────────────────────────────────────────────`);
  console.log(`  🎨 Generating ${variant.toUpperCase()} variant facecard`);
  console.log(`  ───────────────────────────────────────────────`);
  console.log(`  Input: ${path.relative(process.cwd(), inputPath)}`);

  const prompt = buildPrompt(variant);
  console.log(`  Prompt: ${prompt.length} chars`);
  console.log(`  Quality: ${QUALITY.toUpperCase()} (1024×1536 portrait)`);

  try {
    const imageFile = await toFile(fs.createReadStream(inputPath), 'input.png', { type: 'image/png' });

    console.log(`  ⚙️  Calling gpt-image-1...`);
    const startTs = Date.now();

    const result = await client.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: '1024x1536',
      quality: QUALITY
    });

    const elapsedSec = ((Date.now() - startTs) / 1000).toFixed(1);

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      console.log(`     ⚠️  No image in response`);
      return null;
    }

    const buf = Buffer.from(b64, 'base64');
    const outFile = path.join(outDir, `facecard-${variant}-${QUALITY}.png`);
    fs.writeFileSync(outFile, buf);

    console.log(`     ✅ SUCCESS in ${elapsedSec}s — ${(buf.length / 1024).toFixed(1)} KB`);
    console.log(`     📁 Saved: ${path.relative(process.cwd(), outFile)}`);
    return outFile;

  } catch (e) {
    const msg = (e.message || String(e)).slice(0, 300);
    console.error(`     ❌ FAILED: ${msg}`);
    if (e.status) console.error(`     Status: ${e.status}`);
    return null;
  }
}

// ── MAIN ──────────────────────────────────────────────────
(async () => {
  const results = [];

  // Allow CLI arg to skip variant: --skip-man, --skip-woman, or --variant=man|woman
  const args = process.argv.slice(2);
  const skipMan = args.includes('--skip-man');
  const skipWoman = args.includes('--skip-woman');

  // 1. MAN variant
  if (!skipMan) {
    const manInput = findPhoto('man');
    if (manInput) {
      console.log(`  📸 Found Man photo: ${path.relative(process.cwd(), manInput)}`);
      const result = await generateFacecard(manInput, 'man');
      if (result) results.push({ variant: 'man', file: result, ok: true });
    } else {
      console.error(`  ❌ Man photo not found. Drop foto selfie ke test-output/ dengan nama:`);
      console.error(`     sample-user.jpg / sample user man.jpg / selfie.jpg / dll`);
    }
  }

  // 2. WOMAN variant — pake foto woman real (kalau ada), else AI-generate
  if (!skipWoman) {
    let womanInput = findPhoto('woman');
    if (womanInput) {
      console.log(`  📸 Found real Woman photo: ${path.relative(process.cwd(), womanInput)}`);
    } else {
      console.log(`  ⚠️  No real Woman photo found. Generating AI fallback...`);
      womanInput = await generateSampleWomanFace();
    }
    if (womanInput) {
      const result = await generateFacecard(womanInput, 'woman');
      if (result) results.push({ variant: 'woman', file: result, ok: true });
    }
  }

  // ── SUMMARY ──
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  if (results.length === 0) {
    console.log('  ❌ Tidak ada facecard yang berhasil di-generate.');
  } else {
    console.log(`  ✅ ${results.length}/${2} facecard generated:`);
    results.forEach(r => {
      console.log(`     • ${r.variant.toUpperCase()}: ${path.relative(process.cwd(), r.file)}`);
    });
    console.log('');
    console.log('  💡 Action item:');
    console.log('     1. Buka folder test-output/');
    console.log('     2. Liat facecard-man.png + facecard-woman.png');
    console.log('     3. Evaluate quality:');
    console.log('        - Face identity preserved? (wajah masih sama orang)');
    console.log('        - 4 sections (Face / Color / Hair / Glasses) tampil?');
    console.log('        - Layout 4:5 portrait clean?');
    console.log('        - Accent color match variant? (red/orange Man vs rose-gold/pink Woman)');
    console.log('     4. Kasih feedback ke chat — kalo bagus, gue gas integrate to production');
  }

  console.log('');
  const costPerImage = QUALITY === 'low' ? 0.016 : QUALITY === 'medium' ? 0.063 : 0.250;
  const totalCost = costPerImage * results.length;
  console.log(`  💰 Cost run ini: ~$${totalCost.toFixed(3)} (~Rp ${Math.round(totalCost * 16000).toLocaleString('id-ID')})`);
  console.log(`     Quality: ${QUALITY.toUpperCase()} · ${results.length} facecard generated`);
  console.log('');
  process.exit(0);
})();
