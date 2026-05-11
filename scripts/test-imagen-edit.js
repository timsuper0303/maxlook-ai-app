#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Test Image-to-Image — Face Identity Preservation
// Input user photo → output 4 variations (different shirts/hairstyles)
// Tests: gpt-image-1 edit endpoint + Nano Banana multimodal
// ═══════════════════════════════════════════════════════
//
// Usage:
//   npm run test-imagen-edit -- path/to/user-photo.jpg
//   atau pakai default sample (foto yang udah di-generate sebelumnya)
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { OpenAI, toFile } = require('openai');

const apiKey = process.env.GEMINI_API_KEY;
const openaiKey = process.env.KIE_API_KEY;

// Input photo: argv[2] atau default ke generated sample
const inputArg = process.argv[2];
const defaultSample = path.join(__dirname, '..', 'test-output', 'gpt-image-1-low.png');
const sampleSample = path.join(__dirname, '..', 'test-output', 'nano-banana-gemini_2_5_flash_image.png');

const inputPhoto = inputArg
  ? path.resolve(inputArg)
  : (fs.existsSync(defaultSample) ? defaultSample : sampleSample);

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   🎨 Test Image-to-Image — Face Preservation');
console.log('═══════════════════════════════════════════════════════');
console.log('');

if (!fs.existsSync(inputPhoto)) {
  console.error(`❌ Input photo not found: ${inputPhoto}`);
  console.error('   Run "npm run test-imagen" first to generate sample, atau provide your own:');
  console.error('   npm run test-imagen-edit -- C:\\path\\to\\your-selfie.jpg');
  process.exit(1);
}

console.log(`  Input photo: ${path.relative(process.cwd(), inputPhoto)}`);
console.log(`  Size:        ${(fs.statSync(inputPhoto).size / 1024).toFixed(1)} KB`);
console.log('');

const outDir = path.join(__dirname, '..', 'test-output', 'edits');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Test variations untuk simulate facecard bundle
const VARIATIONS = [
  {
    id: 'color-navy',
    prompt: 'Same person, exact same face, identical features, wearing a deep navy crew neck shirt. Premium editorial photo, soft studio lighting, neutral cream background. Keep face 100% identical to input photo.'
  },
  {
    id: 'color-maroon',
    prompt: 'Same person, exact same face, identical features, wearing a deep maroon/burgundy crew neck shirt. Premium editorial photo, dark moody studio lighting. Keep face 100% identical to input photo.'
  },
  {
    id: 'hair-textured',
    prompt: 'Same person, exact same face, identical features, but with modern textured top hairstyle, short sides. Professional headshot, studio lighting, neutral background. Keep face 100% identical to input photo.'
  },
  {
    id: 'glowup-day30',
    prompt: 'Same person, exact same face, slightly improved skin (clearer, brighter, glass-skin effect), slightly more defined jawline, more rested eyes. Subtle improvement only, keep identity 100%. Premium editorial photo.'
  }
];

const allResults = [];

// ═══ APPROACH 1: OpenAI gpt-image-1 edit endpoint ═══
async function testOpenAIEdit() {
  console.log('  ─── OpenAI gpt-image-1 (image edit) ───');
  if (!openaiKey) { console.log('  ⚠️  No KIE_API_KEY'); return; }

  const client = new OpenAI({
    apiKey: openaiKey,
    baseURL: process.env.KIE_API_BASE_URL || 'https://api.openai.com/v1'
  });

  for (const v of VARIATIONS) {
    console.log(`  ▶ ${v.id}: ${v.prompt.slice(0, 60)}...`);
    try {
      // Convert file to OpenAI format
      const imageFile = await toFile(fs.createReadStream(inputPhoto), 'input.png', { type: 'image/png' });
      const result = await client.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt: v.prompt,
        n: 1,
        size: '1024x1024',
        quality: 'low'
      });
      const b64 = result.data?.[0]?.b64_json;
      if (b64) {
        const buf = Buffer.from(b64, 'base64');
        const file = path.join(outDir, `gpt-edit-${v.id}.png`);
        fs.writeFileSync(file, buf);
        console.log(`     ✅ SUCCESS — ${(buf.length / 1024).toFixed(1)} KB → ${path.relative(process.cwd(), file)}`);
        allResults.push({ provider: 'openai', id: v.id, ok: true, file });
      } else {
        console.log(`     ⚠️  No image returned`);
      }
    } catch (e) {
      let msg = (e.message || String(e)).slice(0, 200);
      console.log(`     ❌ ${msg}`);
      allResults.push({ provider: 'openai', id: v.id, ok: false, error: msg });
    }
  }
}

// ═══ APPROACH 2: Google Nano Banana (Gemini 2.5 Flash Image) image-to-image ═══
async function testNanoBananaEdit() {
  console.log('');
  console.log('  ─── Google Nano Banana (Gemini 2.5 Flash Image) ───');
  if (!apiKey) { console.log('  ⚠️  No GEMINI_API_KEY'); return; }

  const ai = new GoogleGenAI({ apiKey });
  const imageBytes = fs.readFileSync(inputPhoto);
  const base64 = imageBytes.toString('base64');
  const mimeType = inputPhoto.toLowerCase().endsWith('.jpg') || inputPhoto.toLowerCase().endsWith('.jpeg')
    ? 'image/jpeg' : 'image/png';

  for (const v of VARIATIONS) {
    console.log(`  ▶ ${v.id}: ${v.prompt.slice(0, 60)}...`);
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [
          { inlineData: { mimeType, data: base64 } },
          { text: v.prompt }
        ],
        config: { responseModalities: ['IMAGE', 'TEXT'] }
      });
      const parts = result.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find(p => p.inlineData?.data);
      if (imgPart) {
        const buf = Buffer.from(imgPart.inlineData.data, 'base64');
        const file = path.join(outDir, `nano-edit-${v.id}.png`);
        fs.writeFileSync(file, buf);
        console.log(`     ✅ SUCCESS — ${(buf.length / 1024).toFixed(1)} KB → ${path.relative(process.cwd(), file)}`);
        allResults.push({ provider: 'nano-banana', id: v.id, ok: true, file });
      } else {
        const text = parts.find(p => p.text)?.text;
        console.log(`     ⚠️  Text only: ${text ? text.slice(0, 100) : 'no text'}`);
      }
    } catch (e) {
      let msg = (e.message || String(e)).slice(0, 200);
      console.log(`     ❌ ${msg}`);
      allResults.push({ provider: 'nano-banana', id: v.id, ok: false, error: msg });
    }
  }
}

(async () => {
  await testOpenAIEdit();
  await testNanoBananaEdit();

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  const byProvider = allResults.reduce((acc, r) => {
    acc[r.provider] = acc[r.provider] || { ok: 0, fail: 0 };
    acc[r.provider][r.ok ? 'ok' : 'fail']++;
    return acc;
  }, {});

  Object.entries(byProvider).forEach(([p, s]) => {
    console.log(`  ${p}: ${s.ok}/${s.ok + s.fail} success`);
  });

  console.log('');
  console.log('  📁 Buka folder: test-output/edits/');
  console.log('  🔍 Bandingin tiap output dengan input photo:');
  console.log('     • Wajah masih sama orang?');
  console.log('     • Detail prompt (shirt color, hair) berubah sesuai?');
  console.log('     • Quality OK?');
  console.log('');
  console.log('  Setelah review, balikkan ke chat — winner provider gue integrate.');
  console.log('');
  process.exit(0);
})();
