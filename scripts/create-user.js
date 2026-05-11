#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Create User CLI — bikin customer baru post-payment
// Usage:
//   npm run create-user
//   npm run create-user -- --name "Nina" --gender woman --phone +628123456789
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const readline = require('readline');
const { createUser, findUserByToken, updateUser } = require('../src/db');
const { generateToken } = require('../src/token-gen');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise(res => rl.question(q, ans => res(ans.trim())));

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   ✨ Maxlook — Create New User');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  const args = parseArgs();

  const name = args.name || await ask('Nama customer: ');
  if (!name) { console.error('❌ Nama wajib'); process.exit(1); }

  let gender = args.gender;
  while (!gender || !['man', 'woman'].includes(gender)) {
    gender = (await ask('Gender (man/woman): ')).toLowerCase();
  }

  const phone = args.phone || await ask('No HP / WhatsApp (optional, +62...): ');
  const email = args.email || await ask('Email (optional): ');

  const variant = gender === 'woman' ? 'maxlook_woman' : 'maxlook_man';

  // Generate unique token (check Supabase for collision)
  let token;
  let collision = true;
  while (collision) {
    token = generateToken();
    const existing = await findUserByToken(token);
    collision = !!existing;
  }

  const user = await createUser({
    token,
    name,
    phone: phone || null,
    email: email || null,
    gender,
    variant
  });

  const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  const accessLink = `${baseUrl}/?token=${token}`;

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   ✅ User berhasil dibuat');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`  ID:       ${user.id}`);
  console.log(`  Nama:     ${user.name}`);
  console.log(`  Gender:   ${user.gender}`);
  console.log(`  Variant:  ${user.variant}`);
  console.log(`  Token:    ${user.token}`);
  console.log('');
  console.log('  📲 KIRIM LINK INI VIA WHATSAPP:');
  console.log('  ───────────────────────────────────────────────────────');
  console.log(`  ${accessLink}`);
  console.log('  ───────────────────────────────────────────────────────');
  console.log('');
  console.log('  📝 Template WhatsApp message:');
  console.log('  ───────────────────────────────────────────────────────');
  console.log(`  Halo ${name}! ✨

Selamat — akses Maxlook ${gender === 'woman' ? 'Woman' : 'Man'} udah aktif.

🔗 Klik link di bawah buat mulai scan wajah:
${accessLink}

📋 Yang ${gender === 'woman' ? 'kamu' : 'lo'} dapet:
• AI Glow Up Scanner (5-dimensi · 30 detik)
• 30-Day Personalized Roadmap (auto-generated)
• Glow Up Bible (long-form guide)
• Action Workbook (daily checklist)
• Re-scan tiap minggu (lifetime)

⏱️ Re-scan tersedia 7 hari sekali — konsisten ${gender === 'woman' ? 'kamu' : 'lo'} ikutin protokol dulu.

Ada pertanyaan? Reply WhatsApp ini langsung. 24/7.

— Tim Maxlook 💖`);
  console.log('  ───────────────────────────────────────────────────────');
  console.log('');

  rl.close();
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
