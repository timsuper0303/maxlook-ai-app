#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Test Image Generation API — Google Imagen + OpenAI fallback
// Try multiple providers, report which works dengan API key lo
// Usage: npm run test-imagen
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
const openaiKey = process.env.KIE_API_KEY;

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   🎨 Test Image Generation — Google + OpenAI');
console.log('═══════════════════════════════════════════════════════');
console.log('');

if (!apiKey && !openaiKey) {
  console.error('❌ GEMINI_API_KEY dan KIE_API_KEY belum di-set di .env');
  process.exit(1);
}
console.log(`  Gemini Key:  ${apiKey ? apiKey.slice(0, 10) + '...' + apiKey.slice(-6) : '(none)'}`);
console.log(`  OpenAI Key:  ${openaiKey ? openaiKey.slice(0, 10) + '...' + openaiKey.slice(-6) : '(none)'}`);
console.log('');

// Output directory for test images
const outDir = path.join(__dirname, '..', 'test-output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Test prompt — Maxlook-style facecard
const testPrompt = `Premium aesthetic clinic-style portrait card. Photo of a young Indonesian man, age 25, frontal view, looking confident. Dark cinematic background with subtle red gradient. Editorial magazine quality. Sharp jawline, clear skin. Style: modern luxe, sophisticated, masculine.`;

const allResults = [];

// ═══ APPROACH 1: New @google/genai SDK (Imagen direct) ═══
async function testNewGoogleGenAI() {
  console.log('  ─── Approach 1: @google/genai SDK (Imagen direct) ───');
  let GoogleGenAI;
  try {
    GoogleGenAI = require('@google/genai').GoogleGenAI;
  } catch (e) {
    console.log('  ⚠️  @google/genai not installed. Run: npm install @google/genai');
    return;
  }

  if (!apiKey) { console.log('  ⚠️  No GEMINI_API_KEY'); return; }

  const ai = new GoogleGenAI({ apiKey });
  const models = [
    'imagen-3.0-generate-002',
    'imagen-3.0-fast-generate-001',
    'imagen-4.0-generate-preview-05-06',
    'imagen-4.0-fast-generate-preview-05-06'
  ];

  for (const m of models) {
    console.log(`  Trying: ${m}...`);
    try {
      const result = await ai.models.generateImages({
        model: m,
        prompt: testPrompt,
        config: { numberOfImages: 1, aspectRatio: '1:1' }
      });
      const img = result.generatedImages?.[0];
      if (img?.image?.imageBytes) {
        const buf = Buffer.from(img.image.imageBytes, 'base64');
        const file = path.join(outDir, `imagen-${m.replace(/[^a-z0-9]/gi, '_')}.png`);
        fs.writeFileSync(file, buf);
        console.log(`     ✅ SUCCESS — ${(buf.length / 1024).toFixed(1)} KB → ${path.relative(process.cwd(), file)}`);
        allResults.push({ provider: 'google-imagen', model: m, ok: true, file });
        return; // stop on first success
      }
      console.log(`     ⚠️  No image returned`);
    } catch (e) {
      let msg = (e.message || String(e)).slice(0, 180);
      console.log(`     ❌ ${msg}`);
      allResults.push({ provider: 'google-imagen', model: m, ok: false, error: msg });
    }
  }
}

// ═══ APPROACH 2: New @google/genai SDK (Gemini multimodal — "Nano Banana") ═══
async function testGeminiMultimodal() {
  console.log('');
  console.log('  ─── Approach 2: @google/genai SDK (Gemini Multimodal — Nano Banana) ───');
  let GoogleGenAI;
  try { GoogleGenAI = require('@google/genai').GoogleGenAI; } catch (e) { return; }
  if (!apiKey) return;

  const ai = new GoogleGenAI({ apiKey });
  const models = [
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash-exp-image-generation',
    'gemini-2.0-flash-exp'
  ];

  for (const m of models) {
    console.log(`  Trying: ${m}...`);
    try {
      const result = await ai.models.generateContent({
        model: m,
        contents: testPrompt,
        config: { responseModalities: ['IMAGE', 'TEXT'] }
      });
      const parts = result.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find(p => p.inlineData?.data);
      if (imgPart) {
        const buf = Buffer.from(imgPart.inlineData.data, 'base64');
        const file = path.join(outDir, `nano-banana-${m.replace(/[^a-z0-9]/gi, '_')}.png`);
        fs.writeFileSync(file, buf);
        console.log(`     ✅ SUCCESS — ${(buf.length / 1024).toFixed(1)} KB → ${path.relative(process.cwd(), file)}`);
        allResults.push({ provider: 'google-nano-banana', model: m, ok: true, file });
        return;
      }
      console.log(`     ⚠️  No image (text-only response)`);
    } catch (e) {
      let msg = (e.message || String(e)).slice(0, 180);
      console.log(`     ❌ ${msg}`);
      allResults.push({ provider: 'google-nano-banana', model: m, ok: false, error: msg });
    }
  }
}

// ═══ APPROACH 3: OpenAI gpt-image-1 ═══
async function testOpenAIImage() {
  console.log('');
  console.log('  ─── Approach 3: OpenAI gpt-image-1 ───');
  if (!openaiKey) { console.log('  ⚠️  No KIE_API_KEY (OpenAI)'); return; }

  let OpenAI;
  try { OpenAI = require('openai').OpenAI; } catch (e) {
    console.log('  ⚠️  openai SDK not installed');
    return;
  }

  const client = new OpenAI({
    apiKey: openaiKey,
    baseURL: process.env.KIE_API_BASE_URL || 'https://api.openai.com/v1'
  });

  console.log(`  Trying: gpt-image-1 (low quality)...`);
  try {
    const result = await client.images.generate({
      model: 'gpt-image-1',
      prompt: testPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'low'
    });
    const b64 = result.data?.[0]?.b64_json;
    const url = result.data?.[0]?.url;
    if (b64) {
      const buf = Buffer.from(b64, 'base64');
      const file = path.join(outDir, 'gpt-image-1-low.png');
      fs.writeFileSync(file, buf);
      console.log(`     ✅ SUCCESS — ${(buf.length / 1024).toFixed(1)} KB → ${path.relative(process.cwd(), file)}`);
      allResults.push({ provider: 'openai', model: 'gpt-image-1', ok: true, file });
    } else if (url) {
      console.log(`     ✅ SUCCESS — URL: ${url}`);
      console.log('     (URL-based response, download manually or write fetcher)');
      allResults.push({ provider: 'openai', model: 'gpt-image-1', ok: true, url });
    } else {
      console.log(`     ⚠️  No image in response`);
    }
    return;
  } catch (e) {
    let msg = (e.message || String(e)).slice(0, 180);
    console.log(`     ❌ ${msg}`);
    allResults.push({ provider: 'openai', model: 'gpt-image-1', ok: false, error: msg });
  }

  // Fallback: try DALL-E 3
  console.log(`  Trying: dall-e-3 (fallback)...`);
  try {
    const result = await client.images.generate({
      model: 'dall-e-3',
      prompt: testPrompt,
      n: 1,
      size: '1024x1024'
    });
    const url = result.data?.[0]?.url;
    if (url) {
      console.log(`     ✅ SUCCESS — URL: ${url.slice(0, 80)}...`);
      allResults.push({ provider: 'openai', model: 'dall-e-3', ok: true, url });
    }
  } catch (e) {
    let msg = (e.message || String(e)).slice(0, 180);
    console.log(`     ❌ ${msg}`);
    allResults.push({ provider: 'openai', model: 'dall-e-3', ok: false, error: msg });
  }
}

(async () => {
  console.log('  Test prompt: Maxlook-style portrait card untuk Indonesian male');
  console.log('');

  await testNewGoogleGenAI();
  await testGeminiMultimodal();
  await testOpenAIImage();

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  const successes = allResults.filter(r => r.ok);
  if (successes.length > 0) {
    console.log(`  ✅ ${successes.length} provider/model accessible:`);
    successes.forEach(r => {
      console.log(`     • ${r.provider} / ${r.model}`);
      if (r.file) console.log(`       → ${path.relative(process.cwd(), r.file)}`);
      if (r.url) console.log(`       → ${r.url.slice(0, 80)}...`);
    });
    console.log('');
    console.log('  💡 Buka file PNG di test-output/ buat liat quality.');
    console.log('  📁 Pick best result, gue integrate ke production.');
  } else {
    console.log('  ❌ NO provider berhasil generate image.');
    console.log('');
    console.log('  Common reasons:');
    console.log('  1. Google Imagen butuh Vertex AI billing setup di Google Cloud');
    console.log('  2. OpenAI gpt-image-1 butuh organization verification');
    console.log('  3. Free tier sangat limited (~10-50 req/day)');
    console.log('');
    console.log('  Errors detail:');
    allResults.filter(r => !r.ok).forEach(r => {
      console.log(`     • ${r.provider}/${r.model}: ${r.error.slice(0, 100)}`);
    });
  }
  console.log('');
  process.exit(0);
})();
