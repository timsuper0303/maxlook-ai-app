#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Test Gemini API connection
// Usage: npm run test-gemini
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   🧪 Test Gemini API Connection');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log(`  API Key:  ${apiKey ? apiKey.slice(0, 10) + '...' + apiKey.slice(-6) : '❌ NOT SET'}`);
console.log(`  Model:    ${modelName}`);
console.log('');

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY belum di-set di .env');
  console.error('   Get key: https://aistudio.google.com/app/apikey');
  process.exit(1);
}

(async () => {
  console.log('  🔍 Test 1: Simple text request...');
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent('Say "Hello Maxlook" in 5 words or less.');
    const text = result.response.text();
    const usage = result.response.usageMetadata;

    console.log(`  ✅ SUCCESS!`);
    console.log(`  Response: "${text.trim()}"`);
    console.log(`  Tokens:   ${usage?.totalTokenCount || '?'} (${usage?.promptTokenCount || '?'} in + ${usage?.candidatesTokenCount || '?'} out)`);
    console.log('');

    console.log('  🔍 Test 2: JSON output mode...');
    const jsonModel = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' }
    });
    const jsonRes = await jsonModel.generateContent('Return JSON: {"greeting": "hello", "from": "maxlook"}');
    const jsonText = jsonRes.response.text();
    console.log(`  ✅ SUCCESS!`);
    console.log(`  Response: ${jsonText}`);
    try {
      const parsed = JSON.parse(jsonText);
      console.log(`  Parsed:   ${JSON.stringify(parsed)}`);
    } catch (e) {
      console.warn(`  ⚠️  Parse failed: ${e.message}`);
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('   🎉 Gemini ready! Lo bisa scan wajah sekarang.');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  } catch (err) {
    console.error('  ❌ FAILED:', err.message);
    console.error('');
    if (err.message?.includes('API key')) {
      console.error('  💡 DIAGNOSIS: API key invalid');
      console.error('     - Cek key di aistudio.google.com/app/apikey');
      console.error('     - Pastikan paste lengkap (gak terpotong)');
    } else if (err.message?.includes('quota') || err.message?.includes('rate')) {
      console.error('  💡 DIAGNOSIS: Rate limit / quota');
      console.error('     - Free tier: 15 req/min, 1500 req/hari');
      console.error('     - Tunggu 1 menit, coba lagi');
    } else if (err.message?.includes('not found') || err.message?.includes('404')) {
      console.error(`  💡 DIAGNOSIS: Model "${modelName}" gak found`);
      console.error('     - Coba ganti GEMINI_MODEL ke "gemini-1.5-flash"');
    } else {
      console.error('  💡 Unknown error. Cek connection internet.');
    }
    console.error('');
    process.exit(1);
  }
})();
