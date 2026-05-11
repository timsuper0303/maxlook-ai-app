#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Test OpenAI API connection
// Usage: npm run test-openai
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const { OpenAI } = require('openai');

const apiKey = process.env.KIE_API_KEY;
const baseURL = process.env.KIE_API_BASE_URL;
const model = process.env.AI_VISION_MODEL;

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   🧪 Test OpenAI API Connection');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log(`  API Key:     ${apiKey ? apiKey.slice(0, 10) + '...' + apiKey.slice(-6) : '❌ NOT SET'}`);
console.log(`  Base URL:    ${baseURL || '❌ NOT SET'}`);
console.log(`  Model:       ${model || '❌ NOT SET'}`);
console.log('');

if (!apiKey || !baseURL || !model) {
  console.error('❌ .env file ngga lengkap. Cek lagi.');
  process.exit(1);
}

const client = new OpenAI({ apiKey, baseURL });

async function test() {
  console.log('  🔍 Testing simple text request (no vision)...');
  console.log('');
  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: 'Say "Hello Maxlook" in 5 words or less.' }],
      max_tokens: 50
    });

    console.log('  ✅ SUCCESS! API responding normally.');
    console.log(`  Response: "${completion.choices[0].message.content}"`);
    console.log(`  Usage: ${completion.usage?.total_tokens || '?'} tokens`);
    console.log('');
    console.log('  🎉 Lo bisa lanjut scan wajah sekarang!');
    console.log('');
  } catch (err) {
    console.error('  ❌ FAILED. Error details:');
    console.error('');
    console.error('  Status:    ', err.status);
    console.error('  Code:      ', err.code);
    console.error('  Type:      ', err.type);
    console.error('  Message:   ', err.message);
    console.error('');

    // Diagnose
    if (err.status === 401) {
      console.error('  💡 DIAGNOSIS: API key invalid');
      console.error('     - Cek .env file, key bener?');
      console.error('     - Buka platform.openai.com/api-keys, pastikan key aktif');
    } else if (err.status === 429) {
      console.error('  💡 DIAGNOSIS: Rate limit / no balance');
      console.error('     - Cek balance di platform.openai.com/settings/organization/billing');
      console.error('     - Tambah payment method + top-up min $5');
    } else if (err.status === 404) {
      console.error(`  💡 DIAGNOSIS: Model "${model}" gak ditemukan`);
      console.error('     - Cek model name di .env');
      console.error('     - Coba ganti ke gpt-4o-mini atau gpt-4o');
      console.error('     - Atau account belum verified — verifikasi phone di platform.openai.com');
    } else if (err.status === 403) {
      console.error('  💡 DIAGNOSIS: Forbidden / no access');
      console.error('     - Account perlu payment method dulu');
      console.error('     - Buka platform.openai.com/settings/organization/billing');
      console.error('     - Add credit card, top-up min $5');
    } else {
      console.error('  💡 DIAGNOSIS: Unknown error. Screenshot output ini & kirim ke Hans/admin.');
    }
    console.error('');
    process.exit(1);
  }
}

test();
