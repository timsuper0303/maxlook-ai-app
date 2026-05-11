-- ═══════════════════════════════════════════════════════
-- Phase 0 — Schema Extension untuk Enhanced Scan Output
-- ═══════════════════════════════════════════════════════
-- Cara pakai:
-- 1. Buka Supabase Dashboard → SQL Editor → New query
-- 2. Copy-paste isi file ini → Run
-- 3. "Success" — DONE
-- ═══════════════════════════════════════════════════════

ALTER TABLE maxlook_scans
  -- Face structure
  ADD COLUMN IF NOT EXISTS face_shape TEXT,
  ADD COLUMN IF NOT EXISTS face_landmarks JSONB,        -- 68 facial landmarks dari face-api.js {x, y} per index
  ADD COLUMN IF NOT EXISTS face_thirds JSONB,           -- proporsi upper/middle/lower
  ADD COLUMN IF NOT EXISTS golden_ratio_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS asymmetry_score NUMERIC(5,2),

  -- Detailed analysis (semua 50+ concerns)
  ADD COLUMN IF NOT EXISTS detailed_concerns JSONB,     -- array of {id, category, name, severity, zone, coords_normalized, issue, protocol, duration_days}
  ADD COLUMN IF NOT EXISTS top_concerns JSONB,          -- subset top 7 from detailed_concerns

  -- Annotated face zones (untuk twibbon overlay)
  ADD COLUMN IF NOT EXISTS annotation_zones JSONB,      -- array of {label, coords_normalized, severity, color}

  -- Lifestyle indicators
  ADD COLUMN IF NOT EXISTS lifestyle_indicators JSONB,  -- forward head posture, mouth breathing, etc.

  -- Photo handling
  ADD COLUMN IF NOT EXISTS photo_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_auto_deleted BOOLEAN DEFAULT TRUE;

-- Index for face_shape (akan di-query untuk template matching)
CREATE INDEX IF NOT EXISTS idx_maxlook_scans_face_shape ON maxlook_scans(face_shape);

-- ═══════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════
