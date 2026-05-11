#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Test Resend email — kirim sample activation email
// Usage:
//   node scripts/test-email.js your@email.com
//   node scripts/test-email.js your@email.com woman   (test woman variant)
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const { sendActivationEmail, isConfigured } = require('../src/email');
const { generateToken } = require('../src/token-gen');

const to = process.argv[2];
const gender = process.argv[3] === 'woman' ? 'woman' : 'man';

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   📧 Test Resend Email');
console.log('═══════════════════════════════════════════════════════');
console.log('');

if (!to) {
  console.error('❌ Usage: node scripts/test-email.js your@email.com [man|woman]');
  process.exit(1);
}

if (!isConfigured()) {
  console.error('❌ RESEND_API_KEY belum di-set di .env');
  console.error('   Sign up di https://resend.com → Settings → API Keys → copy key → paste di .env');
  process.exit(1);
}

const token = generateToken();
const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;

console.log(`  To:      ${to}`);
console.log(`  Variant: maxlook_${gender}`);
console.log(`  Token:   ${token}`);
console.log(`  From:    ${process.env.EMAIL_FROM || 'Maxlook <onboarding@resend.dev>'}`);
console.log('');

(async () => {
  console.log('  📤 Sending...');
  const result = await sendActivationEmail({
    to,
    name: 'Test User',
    token,
    gender,
    baseUrl
  });

  if (result.ok) {
    console.log(`  ✅ Email sent! Message ID: ${result.messageId}`);
    console.log('');
    console.log('  ⚠️  PENTING: Token di email ini FAKE (cuma buat test delivery).');
    console.log('     Token GAK ke-save ke DB, jadi gak bisa dipake login.');
    console.log('     Buat create user beneran: buka admin panel di /admin/login');
    console.log('     atau jalanin: npm run create-user');
    console.log('');
    console.log('  Cek inbox lo. Kalau gak ada di Inbox, cek folder Spam.');
    console.log('  Kalau email yang dikirim mendarat di spam, lo perlu verify domain di Resend dashboard');
    console.log('  (https://resend.com/domains) supaya deliverability bagus.');
  } else {
    console.error(`  ❌ FAILED: ${result.error}`);
    console.error('');
    console.error('  Cek:');
    console.error('  1. RESEND_API_KEY di .env bener? (format: re_XXXXXXXXX)');
    console.error('  2. Email "to" valid? (gak typo)');
    console.error('  3. EMAIL_FROM bener? Default "onboarding@resend.dev" works tanpa domain verify');
    process.exit(1);
  }
  console.log('');
})().catch(err => {
  console.error('❌ Exception:', err.message);
  process.exit(1);
});
