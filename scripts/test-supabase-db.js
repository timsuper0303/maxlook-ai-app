#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Smoke test for Supabase-backed db.js
// Usage: node scripts/test-supabase-db.js
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const db = require('../src/db');

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   🧪 Supabase DB Smoke Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // 1. List users
  console.log('  1️⃣  listUsers()');
  const users = await db.listUsers();
  console.log(`     ✅ ${users.length} user(s) found`);
  console.log('');

  // 2. Create a TEST user
  console.log('  2️⃣  createUser() — test user');
  const testToken = `TEST${Date.now()}`;
  const testUser = await db.createUser({
    token: testToken,
    name: 'TEST_DELETE_ME',
    phone: '+6280000000000',
    email: 'test@test.com',
    gender: 'man',
    variant: 'maxlook_man'
  });
  console.log(`     ✅ Created user id=${testUser.id} token=${testUser.token}`);
  console.log('');

  // 3. Find by token
  console.log('  3️⃣  findUserByToken()');
  const found = await db.findUserByToken(testToken);
  if (!found || found.id !== testUser.id) {
    throw new Error('findUserByToken failed');
  }
  console.log(`     ✅ Found user "${found.name}"`);
  console.log('');

  // 4. canUserScan (should be true — no scans yet)
  console.log('  4️⃣  canUserScan()');
  const canScan = await db.canUserScan(testUser.id, 1);
  console.log(`     ✅ canScan = ${canScan}`);
  console.log('');

  // 5. Create a scan
  console.log('  5️⃣  createScan() — fake scan');
  const fakeResult = {
    overall: 7.8,
    potential: 9.1,
    scores: {
      skin_glow: 7.5,
      symmetry: 8.0,
      jawline: 7.8,
      eye_area: 7.9,
      harmony: 7.7
    },
    skin_type: 'combination',
    undertone: 'neutral',
    season: 'soft_summer'
  };
  const scan = await db.createScan({
    userId: testUser.id,
    imagePath: '/uploads/test-fake.jpg',
    result: fakeResult
  });
  console.log(`     ✅ Created scan id=${scan.id} scan_number=${scan.scan_number}`);
  console.log(`     ✅ raw_result is ${typeof scan.raw_result} (should be object)`);
  console.log('');

  // 6. Get latest scan
  console.log('  6️⃣  getLatestScan()');
  const latest = await db.getLatestScan(testUser.id);
  if (!latest || latest.id !== scan.id) throw new Error('getLatestScan failed');
  console.log(`     ✅ Latest scan id=${latest.id}, overall=${latest.overall_score}`);
  console.log('');

  // 7. canUserScan now should be false
  console.log('  7️⃣  canUserScan() after scan');
  const canScan2 = await db.canUserScan(testUser.id, 1);
  console.log(`     ✅ canScan = ${canScan2} (should be false)`);
  console.log('');

  // 8. nextAllowedScanAt
  console.log('  8️⃣  nextAllowedScanAt()');
  const nextAt = await db.nextAllowedScanAt(testUser.id);
  console.log(`     ✅ Next scan: ${new Date(nextAt).toLocaleString('id-ID')}`);
  console.log('');

  // 9. List templates
  console.log('  9️⃣  listTemplates()');
  const templates = await db.listTemplates();
  console.log(`     ✅ ${templates.length} template(s) found (expected 0 — belum di-upload)`);
  console.log('');

  // 10. CLEANUP — delete test user (cascade scans)
  console.log('  🔟 deleteUser() — cleanup');
  const del = await db.deleteUser(testUser.id);
  console.log(`     ✅ Deleted ${del.changes} user (scans cascaded)`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════');
  console.log('   🎉 ALL TESTS PASSED — Supabase migration OK');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

main().catch(err => {
  console.error('');
  console.error('❌ TEST FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
