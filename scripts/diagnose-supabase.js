#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Diagnose Supabase — Test URL + Key separately
// Usage: node scripts/diagnose-supabase.js
// ═══════════════════════════════════════════════════════

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   🔬 Supabase Diagnostic');
console.log('═══════════════════════════════════════════════════════');
console.log('');

// ── Check 1: URL format ──────────────────────────────
console.log('  1️⃣  URL Check');
console.log(`     URL: ${SUPABASE_URL}`);

if (!SUPABASE_URL) {
  console.error('     ❌ SUPABASE_URL kosong di .env');
  process.exit(1);
}

const match = SUPABASE_URL.match(/^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/);
if (!match) {
  console.error('     ❌ URL format salah. Harus: https://[20-char].supabase.co');
  process.exit(1);
}

const projectId = match[1];
console.log(`     Project ID: "${projectId}" (${projectId.length} chars)`);
if (projectId.length !== 20) {
  console.error(`     ⚠️  Project ID = ${projectId.length} chars. STANDARD = 20 chars.`);
  console.error('     Kemungkinan kepotong / kelebihan huruf pas copy-paste.');
} else {
  console.log('     ✅ Format URL valid (20 chars)');
}
console.log('');

// ── Check 2: Key format ──────────────────────────────
console.log('  2️⃣  Key Check');
if (!SUPABASE_KEY) {
  console.error('     ❌ SUPABASE_SERVICE_ROLE_KEY kosong');
  process.exit(1);
}
console.log(`     Key: ${SUPABASE_KEY.slice(0, 15)}...${SUPABASE_KEY.slice(-8)}`);
console.log(`     Length: ${SUPABASE_KEY.length} chars`);

if (SUPABASE_KEY.startsWith('sb_secret_')) {
  console.log('     Format: NEW (sb_secret_*)');
} else if (SUPABASE_KEY.startsWith('eyJ')) {
  console.log('     Format: LEGACY JWT (eyJ...)');
} else {
  console.error('     ⚠️  Format gak dikenal. Should be sb_secret_* or eyJ...');
}
console.log('');

// ── Check 3: DNS / network reachability ──────────────
console.log('  3️⃣  Network Reachability Test');
console.log(`     Trying: ${SUPABASE_URL}/rest/v1/`);
console.log('');

(async () => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log(`     ✅ Connected! Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`     Response: ${text.slice(0, 200)}`);
    console.log('');

    if (res.status === 401) {
      console.error('     💡 Status 401 = key invalid. Re-copy dari Supabase dashboard.');
    } else if (res.status === 404) {
      console.error('     💡 Status 404 = URL valid tapi endpoint gak ada. Project mungkin paused.');
    } else if (res.ok || res.status === 200) {
      console.log('     🎉 URL + Key VALID. Lo bisa lanjut: npm run setup-supabase');
    }
  } catch (err) {
    console.error('     ❌ FETCH FAILED');
    console.error(`     Error: ${err.message}`);
    console.error(`     Cause: ${err.cause?.message || err.cause?.code || 'unknown'}`);
    console.error('');

    if (err.cause?.code === 'ENOTFOUND') {
      console.error('     💡 DNS RESOLUTION FAILED');
      console.error(`        → Domain "${projectId}.supabase.co" gak ada.`);
      console.error('        → URL salah / kepotong. Buka Supabase dashboard, copy ulang Project URL.');
    } else if (err.cause?.code === 'ETIMEDOUT' || err.cause?.code === 'ECONNREFUSED') {
      console.error('     💡 NETWORK / FIREWALL ISSUE');
      console.error('        → Cek koneksi internet, atau VPN/firewall yang block.');
    } else {
      console.error('     💡 Unknown network error. Cek koneksi & VPN.');
    }
  }
  console.log('');
})();
