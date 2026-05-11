#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Test Webhook locally — simulate OrderOnline POST
// Usage:
//   node scripts/test-webhook.js              (test with valid signature)
//   node scripts/test-webhook.js bad           (test with INVALID signature, should be rejected)
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const crypto = require('crypto');
const http = require('http');

const TOKEN = process.env.ORDERONLINE_PERSONAL_ACCESS_TOKEN || 'test-token-replace-me';
const PORT = process.env.PORT || 3000;
const mode = process.argv[2] || 'valid';

// Sample order payload (mimicking OrderOnline structure)
const body = {
  type: 'Order',
  action: 'create',
  payload: {
    id: 'TEST-ORDER-' + Date.now(),
    customer_name: 'Hans Tester',
    customer_email: 'hans.test@example.com',
    customer_phone: '+6281234567890',
    product_name: 'Maxlook Woman',
    items: [
      { name: 'Maxlook Woman', qty: 1, price: 99000 }
    ],
    total: 99000,
    status: 'paid',
    created_at: new Date().toISOString()
  }
};

// Compute HMAC sesuai spec OrderOnline
const payloadStr = JSON.stringify(body);
const hmac = crypto
  .createHmac('sha256', TOKEN)
  .update(payloadStr)
  .digest('base64');

const signature = mode === 'bad' ? 'INVALID-HMAC-VALUE' : hmac;

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   🧪 Test Webhook — Local Simulation');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log(`  Mode:      ${mode === 'bad' ? '❌ INVALID signature (should be rejected)' : '✅ VALID signature'}`);
console.log(`  Token:     ${TOKEN.slice(0, 12)}...${TOKEN.slice(-6)}`);
console.log(`  Endpoint:  http://localhost:${PORT}/webhook/orderonline`);
console.log(`  Order ID:  ${body.payload.id}`);
console.log(`  Email:     ${body.payload.customer_email}`);
console.log(`  Product:   ${body.payload.product_name}`);
console.log('');
console.log(`  HMAC:      ${signature}`);
console.log('');
console.log('  📤 Sending POST...');

const data = JSON.stringify(body);
const opts = {
  hostname: 'localhost',
  port: PORT,
  path: '/webhook/orderonline',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'x-orderonline-hmac-sha256': signature,
    'User-Agent': 'OrderOnline-Webhook-Tester/1.0'
  }
};

const req = http.request(opts, (res) => {
  let chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    console.log('');
    console.log(`  Response: ${res.statusCode} ${res.statusMessage}`);
    console.log('  Body:    ', body);
    console.log('');
    if (res.statusCode === 200) {
      console.log('  ✅ Webhook diterima dengan benar.');
      try {
        const json = JSON.parse(body);
        if (json.user_id) {
          console.log(`     User #${json.user_id} dibuat`);
          console.log(`     Token: ${json.token}`);
          console.log(`     Variant: ${json.variant}`);
          console.log(`     Email: ${json.email?.ok ? '✓ Sent' : '✗ Failed (' + (json.email?.error || 'unknown') + ')'}`);
        }
      } catch (e) {}
    } else if (res.statusCode === 401) {
      if (mode === 'bad') {
        console.log('  ✅ Server REJECTED invalid signature (correct behavior).');
      } else {
        console.log('  ❌ Server rejected valid signature. Cek ORDERONLINE_PERSONAL_ACCESS_TOKEN di .env');
      }
    }
    console.log('');
  });
});
req.on('error', (err) => {
  console.error('');
  console.error(`  ❌ Connection error: ${err.message}`);
  console.error(`     → Pastikan server jalan: npm start`);
  console.error('');
  process.exit(1);
});
req.write(data);
req.end();
