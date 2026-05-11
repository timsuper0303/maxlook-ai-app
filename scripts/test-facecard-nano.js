#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Test Facecard Generation — Nano Banana (Gemini 2.5 Flash Image)
// Direct via Gemini API (cheaper than KIE.ai middleman)
// Cost: ~$0.039 per image = Rp 624
// Usage: npm run test-facecard-nano
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY belum di-set di .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const outDir = path.join(__dirname, '..', 'test-output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   🍌 Test Facecard — Nano Banana (Gemini 2.5 Flash Image)');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log(`  API Key: ${apiKey.slice(0, 10)}...${apiKey.slice(-6)}`);
console.log(`  Model:   gemini-2.5-flash-image`);
console.log(`  Cost:    ~$0.039 = Rp 624 per image`);
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

// ── Master prompt (variant-aware) ──
function buildPrompt(variant) {
  const isWoman = variant === 'woman';
  const accent = isWoman
    ? 'Use rose pink (#E8639A) and gold (#D4AF37) as accent colors. Soft cream/blush base. Feminine elegant feel.'
    : 'Use red (#FF0000) and orange (#ff6633) as accent colors. Neutral cream/beige base. Masculine sophisticated feel.';

  return `Create a premium all-in-one modern infographic poster in PORTRAIT format (close to 4:5 ratio) using the uploaded portrait as the main subject — 100% facial resemblance preserved.

POSTER STYLE: minimal, aesthetic, luxury editorial, visual-first, clean typography, rounded cards, thin lines, subtle shadows, premium infographic layout, soft modern UI design.

MAIN TITLE: "Personal Style & Face Analysis"

ACCENT COLOR THEME: ${accent}

CREATE ONE UNIFIED INFOGRAPHIC BOARD combining:

SECTION 1 — FACE FEATURES ANALYSIS
Analyze the facial features. Detect and label: face shape, eyes, eyebrows, nose, cheeks, lips, jawline. Thin elegant arrows pointing to each feature. Rounded glassmorphism info cards. Each card: short title + 2-3 short bullet descriptions.

SECTION 2 — PERSONAL COLOR ANALYSIS
Side-by-side clothing color comparisons using the same portrait. 4 best colors + 4 unsuitable colors. Realistic outfit color variations. Small palette swatches. Short labels: "Best Match", "Soft Contrast", "Too Dull", "Brightens Skin".

SECTION 3 — HAIRSTYLE ANALYSIS
Realistic hairstyle comparisons using the same face. 3 suitable + 3 not suitable. Modern trendy hairstyles. Short labels: "Adds Balance", "Soft Volume", "Too Wide", "Sharp Structure".

SECTION 4 — SPECTACLES GUIDE
Realistic glasses try-on using same portrait. 4 suitable + 4 unsuitable frames. Short labels: "Best Fit", "Balances Face", "Too Heavy", "Softens Features".

DESIGN RULES:
- Portrait poster, ultra high quality, luxury editorial aesthetic
- Apple-style infographic, Pinterest premium beauty board, Korean luxury editorial style
- Clean modern typography, no clutter, no long paragraphs
- Realistic portrait preservation — face MUST remain 100% identical to input
- Person ethnicity: Indonesian/Asian, same age, same features
- DO NOT add brand text/logo/watermark (will be HTML-overlaid)
- Avoid any text that could be misspelled — use short clear labels only
- Soft neutral luxury color palette with subtle shadows

CRITICAL: Same person across ALL panels. Identity preservation 100%.`;
}

// ── Generate facecard ──
async function generateFacecard(inputPath, variant) {
  console.log('');
  console.log(`  ───────────────────────────────────────────────`);
  console.log(`  🎨 Generating ${variant.toUpperCase()} variant facecard`);
  console.log(`  ───────────────────────────────────────────────`);
  console.log(`  Input: ${path.relative(process.cwd(), inputPath)}`);

  const prompt = buildPrompt(variant);
  console.log(`  Prompt: ${prompt.length} chars`);

  // Read image as base64
  const imageBytes = fs.readFileSync(inputPath);
  const base64 = imageBytes.toString('base64');
  const ext = path.extname(inputPath).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.webp' ? 'image/webp' : 'image/png';

  console.log(`  ⚙️  Calling Nano Banana (gemini-2.5-flash-image)...`);
  const startTs = Date.now();

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        { inlineData: { mimeType, data: base64 } },
        { text: prompt }
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    });

    const elapsedSec = ((Date.now() - startTs) / 1000).toFixed(1);

    // Extract image from response
    const parts = result.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData?.data);

    if (!imgPart) {
      // Maybe text-only or no image
      const textPart = parts.find(p => p.text);
      console.log(`     ⚠️  No image. Text: ${textPart?.text?.slice(0, 150) || '(no text)'}`);
      return null;
    }

    const buf = Buffer.from(imgPart.inlineData.data, 'base64');
    const outFile = path.join(outDir, `facecard-nano-${variant}.png`);
    fs.writeFileSync(outFile, buf);

    console.log(`     ✅ SUCCESS in ${elapsedSec}s — ${(buf.length / 1024).toFixed(1)} KB`);
    console.log(`     📁 Saved: ${path.relative(process.cwd(), outFile)}`);
    return outFile;

  } catch (e) {
    const msg = (e.message || String(e)).slice(0, 300);
    console.error(`     ❌ FAILED: ${msg}`);
    return null;
  }
}

// ── MAIN ──
(async () => {
  const results = [];

  // 1. MAN variant
  const manInput = findPhoto('man');
  if (manInput) {
    console.log(`  📸 Found Man photo: ${path.relative(process.cwd(), manInput)}`);
    const result = await generateFacecard(manInput, 'man');
    if (result) results.push({ variant: 'man', file: result });
  } else {
    console.error(`  ❌ Man photo not found in test-output/`);
  }

  // 2. WOMAN variant
  const womanInput = findPhoto('woman');
  if (womanInput) {
    console.log('');
    console.log(`  📸 Found Woman photo: ${path.relative(process.cwd(), womanInput)}`);
    const result = await generateFacecard(womanInput, 'woman');
    if (result) results.push({ variant: 'woman', file: result });
  } else {
    console.log(`  ⚠️  No Woman photo found. Skipping Woman variant.`);
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
    console.log(`  ✅ ${results.length} facecard generated dengan Nano Banana:`);
    results.forEach(r => console.log(`     • ${r.variant}: ${path.relative(process.cwd(), r.file)}`));
    console.log('');
    console.log('  💡 Compare dengan facecard-medium.png (OpenAI) dari test sebelumnya');
    console.log('     untuk pick winner provider.');
  }

  const cost = results.length * 0.039;
  console.log('');
  console.log(`  💰 Cost run ini: ~$${cost.toFixed(3)} (~Rp ${Math.round(cost * 16000).toLocaleString('id-ID')})`);
  console.log('');
  process.exit(0);
})();
