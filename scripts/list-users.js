#!/usr/bin/env node
// List all users (Supabase-backed)
require('dotenv').config();
const { listUsers } = require('../src/db');

async function main() {
  const users = await listUsers();
  console.log('');
  console.log(`═══ Maxlook Users (${users.length} total) ═══`);
  console.log('');
  if (users.length === 0) {
    console.log('  Belum ada user. Jalankan: npm run create-user');
  } else {
    users.forEach(u => {
      const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
      console.log(`  #${u.id} ${u.name} (${u.gender}) · token: ${u.token}`);
      console.log(`     Phone: ${u.phone || '-'} · Scans: ${u.total_scans || 0}`);
      console.log(`     Link:  ${baseUrl}/?token=${u.token}`);
      console.log(`     Created: ${u.created_at}`);
      console.log('');
    });
  }
  console.log('');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
