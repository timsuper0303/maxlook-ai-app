-- ═══════════════════════════════════════════════════════
-- Maxlook AI — Supabase Schema Setup
-- ═══════════════════════════════════════════════════════
-- Cara pakai:
-- 1. Login ke supabase.com/dashboard
-- 2. Pilih project lo (URL: https://ynsyboxoxjmluiuupbne.supabase.co)
-- 3. Sidebar kiri → SQL Editor → New query
-- 4. Copy-paste SEMUA isi file ini
-- 5. Klik "Run" (atau Ctrl+Enter)
-- 6. Lihat "Success. No rows returned" — DONE!
-- ═══════════════════════════════════════════════════════

-- ── TABLE: maxlook_users ──────────────────────────────
CREATE TABLE IF NOT EXISTS maxlook_users (
  id BIGSERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  gender TEXT NOT NULL CHECK(gender IN ('man','woman')),
  variant TEXT NOT NULL DEFAULT 'maxlook',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_scan_at TIMESTAMPTZ,
  total_scans INTEGER DEFAULT 0,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_maxlook_users_token ON maxlook_users(token);
CREATE INDEX IF NOT EXISTS idx_maxlook_users_created_at ON maxlook_users(created_at DESC);

-- ── TABLE: maxlook_scans ──────────────────────────────
CREATE TABLE IF NOT EXISTS maxlook_scans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES maxlook_users(id) ON DELETE CASCADE,
  scan_number INTEGER NOT NULL,

  -- Score data (dari AI vision) — NUMERIC(3,1) supaya support decimal (7.9, 8.5)
  overall_score NUMERIC(3,1),
  potential_score NUMERIC(3,1),
  skin_glow NUMERIC(3,1),
  symmetry NUMERIC(3,1),
  jawline NUMERIC(3,1),
  eye_area NUMERIC(3,1),
  harmony NUMERIC(3,1),

  -- Skin & color profile
  skin_type TEXT,
  undertone TEXT,
  season TEXT,

  -- Raw AI result (full JSON)
  raw_result JSONB,

  -- Generated images (URLs ke Supabase Storage)
  color_analysis_image_url TEXT,
  skin_analysis_image_url TEXT,
  glowup_potential_image_url TEXT,

  -- Matched templates dari library (dari analisa AI + template matching)
  matched_hairstyles JSONB,  -- array of {template_id, image_url, reasoning}
  matched_outfits JSONB,
  matched_hijabs JSONB,

  -- Generation status (untuk async UX)
  vision_status TEXT DEFAULT 'pending' CHECK(vision_status IN ('pending','processing','done','failed')),
  image_gen_status TEXT DEFAULT 'pending' CHECK(image_gen_status IN ('pending','processing','done','failed')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maxlook_scans_user_id ON maxlook_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_maxlook_scans_created_at ON maxlook_scans(created_at DESC);

-- ── TABLE: maxlook_templates (image library) ──────────
-- Simpan metadata dari hairstyle/outfit/hijab template yang di-upload ke Storage
CREATE TABLE IF NOT EXISTS maxlook_templates (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK(category IN ('hairstyle','outfit','hijab')),
  gender TEXT NOT NULL CHECK(gender IN ('man','woman')),

  -- Image
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,

  -- Tags untuk matching
  face_shape TEXT[],  -- ['oval','round','square','heart','long']
  season TEXT[],      -- ['soft_summer','cool_winter','warm_spring','etc']
  occasion TEXT[],    -- ['kerja','casual','date','formal','gym','weekend','brunch']
  vibe TEXT[],        -- ['minimal','elegant','sporty','edgy','feminine']

  -- Metadata
  name TEXT,
  description TEXT,
  reasoning_template TEXT, -- Template reasoning yang di-fill AI per user

  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maxlook_templates_category ON maxlook_templates(category);
CREATE INDEX IF NOT EXISTS idx_maxlook_templates_gender ON maxlook_templates(gender);
CREATE INDEX IF NOT EXISTS idx_maxlook_templates_face_shape ON maxlook_templates USING GIN(face_shape);
CREATE INDEX IF NOT EXISTS idx_maxlook_templates_season ON maxlook_templates USING GIN(season);
CREATE INDEX IF NOT EXISTS idx_maxlook_templates_active ON maxlook_templates(active) WHERE active = TRUE;

-- ── Auto-update updated_at trigger ────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_maxlook_scans_updated_at ON maxlook_scans;
CREATE TRIGGER update_maxlook_scans_updated_at
  BEFORE UPDATE ON maxlook_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ── RLS Policies ──────────────────────────────────────
-- Enable RLS biar public tidak bisa akses langsung
ALTER TABLE maxlook_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE maxlook_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE maxlook_templates ENABLE ROW LEVEL SECURITY;

-- Service role bisa do anything (kita pakai server-side)
DROP POLICY IF EXISTS "Service role full access users" ON maxlook_users;
CREATE POLICY "Service role full access users" ON maxlook_users
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access scans" ON maxlook_scans;
CREATE POLICY "Service role full access scans" ON maxlook_scans
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access templates" ON maxlook_templates;
CREATE POLICY "Service role full access templates" ON maxlook_templates
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Public bisa READ templates (buat client-side rendering kalau mau)
DROP POLICY IF EXISTS "Public read templates" ON maxlook_templates;
CREATE POLICY "Public read templates" ON maxlook_templates
  FOR SELECT TO anon USING (active = TRUE);

-- ═══════════════════════════════════════════════════════
-- DONE! Schema ready.
-- ═══════════════════════════════════════════════════════
