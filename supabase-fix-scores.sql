-- ═══════════════════════════════════════════════════════
-- FIX: Score columns harus NUMERIC, bukan INTEGER
-- AI vision return decimal (7.9, 8.5) — INTEGER bikin error
-- ═══════════════════════════════════════════════════════
-- Cara pakai:
-- 1. Buka Supabase Dashboard → SQL Editor → New query
-- 2. Copy-paste semua isi file ini → Run
-- 3. Re-run: npm run test-db
-- ═══════════════════════════════════════════════════════

ALTER TABLE maxlook_scans
  ALTER COLUMN overall_score    TYPE NUMERIC(3,1) USING overall_score::NUMERIC,
  ALTER COLUMN potential_score  TYPE NUMERIC(3,1) USING potential_score::NUMERIC,
  ALTER COLUMN skin_glow        TYPE NUMERIC(3,1) USING skin_glow::NUMERIC,
  ALTER COLUMN symmetry         TYPE NUMERIC(3,1) USING symmetry::NUMERIC,
  ALTER COLUMN jawline          TYPE NUMERIC(3,1) USING jawline::NUMERIC,
  ALTER COLUMN eye_area         TYPE NUMERIC(3,1) USING eye_area::NUMERIC,
  ALTER COLUMN harmony          TYPE NUMERIC(3,1) USING harmony::NUMERIC;

-- ═══════════════════════════════════════════════════════
-- DONE. Sekarang skor bisa simpan 0.0 - 9.9
-- ═══════════════════════════════════════════════════════
