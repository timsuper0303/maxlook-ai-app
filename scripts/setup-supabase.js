#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Setup Supabase — Auto-create storage buckets + verify connection
// Usage: npm run setup-supabase
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('   🗄️  Maxlook — Supabase Setup');
console.log('═══════════════════════════════════════════════════════');
console.log('');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials missing di .env');
  console.error('');
  console.error('   Tambahin baris berikut ke .env:');
  console.error('   SUPABASE_URL=https://ynsyboxoxjmluiuupbne.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...');
  console.error('');
  process.exit(1);
}

console.log(`  URL:  ${SUPABASE_URL}`);
console.log(`  Key:  ${SUPABASE_KEY.slice(0, 20)}...${SUPABASE_KEY.slice(-10)}`);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupStorageBuckets() {
  console.log('  📦 Setting up Storage Buckets...');

  const buckets = [
    {
      id: 'maxlook-templates',
      public: true,
      description: 'Pre-built hairstyle/outfit/hijab template library'
    },
    {
      id: 'maxlook-scans',
      public: false,
      description: 'Per-customer scan results (private)'
    }
  ];

  for (const b of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(b.id, {
        public: b.public,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`     ✓ Bucket "${b.id}" already exists (skip)`);
        } else {
          throw error;
        }
      } else {
        console.log(`     ✅ Bucket "${b.id}" created (${b.public ? 'public' : 'private'})`);
      }
    } catch (err) {
      console.error(`     ❌ Failed to create bucket "${b.id}":`, err.message);
    }
  }
  console.log('');
}

async function verifyTables() {
  console.log('  📋 Verifying Database Tables...');

  const tables = ['maxlook_users', 'maxlook_scans', 'maxlook_templates'];
  let allOk = true;

  for (const t of tables) {
    try {
      const { error } = await supabase.from(t).select('id').limit(1);
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.log(`     ❌ Table "${t}" NOT FOUND`);
          allOk = false;
        } else {
          console.log(`     ⚠️  Table "${t}" error: ${error.message}`);
        }
      } else {
        console.log(`     ✅ Table "${t}" exists`);
      }
    } catch (err) {
      console.log(`     ❌ Table "${t}" check failed: ${err.message}`);
      allOk = false;
    }
  }

  if (!allOk) {
    console.log('');
    console.log('  ⚠️  Beberapa table belum dibuat.');
    console.log('     Buka https://supabase.com/dashboard');
    console.log('     → Project lo → SQL Editor → New query');
    console.log('     → Copy-paste isi file: supabase-setup.sql');
    console.log('     → Klik Run');
    console.log('     → Run lagi: npm run setup-supabase');
  }
  console.log('');
  return allOk;
}

async function main() {
  await setupStorageBuckets();
  const tablesOk = await verifyTables();

  console.log('═══════════════════════════════════════════════════════');
  if (tablesOk) {
    console.log('   ✅ Supabase setup COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('   Lanjut: npm start');
    console.log('   Aplikasi siap pakai Supabase backend.');
  } else {
    console.log('   ⚠️  Supabase setup PARTIAL — ada table yang missing');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('   Lihat instruksi di atas. Setelah SQL di-run, jalankan ulang script ini.');
  }
  console.log('');
}

main().catch(err => {
  console.error('');
  console.error('❌ Fatal error:', err.message);
  console.error('');
  process.exit(1);
});
