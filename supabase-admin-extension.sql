-- ═══════════════════════════════════════════════════════
-- Maxlook Admin Panel — Schema Extension
-- ═══════════════════════════════════════════════════════
-- Cara pakai:
-- 1. Buka Supabase Dashboard → SQL Editor → New query
-- 2. Copy-paste SEMUA isi file ini → Run
-- 3. Lihat "Success" — DONE
-- ═══════════════════════════════════════════════════════
-- Tambah fields buat: license status state machine,
-- device binding (1-device limit), webhook tracking, audit fields
-- ═══════════════════════════════════════════════════════

-- ── Extend maxlook_users ──────────────────────────────────
ALTER TABLE maxlook_users
  ADD COLUMN IF NOT EXISTS status TEXT
    CHECK(status IN ('pending','activated','active','suspended','expired'))
    DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS device_bound_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS device_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT
    CHECK(source IN ('admin','webhook','manual','cli'))
    DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS order_payload JSONB,
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_status TEXT
    CHECK(email_status IN ('pending','sent','failed','bounced'))
    DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS email_message_id TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Backfill: existing users (created via CLI sebelum ada admin panel) jadi 'active'
UPDATE maxlook_users
  SET status = 'active', source = 'cli'
  WHERE status IS NULL OR status = 'pending';

-- Backfill: existing users yang udah pernah scan = activated
UPDATE maxlook_users
  SET activated_at = COALESCE(activated_at, last_scan_at, created_at)
  WHERE total_scans > 0 AND activated_at IS NULL;

-- Indexes untuk admin panel queries
CREATE INDEX IF NOT EXISTS idx_maxlook_users_status ON maxlook_users(status);
CREATE INDEX IF NOT EXISTS idx_maxlook_users_email ON maxlook_users(email);
CREATE INDEX IF NOT EXISTS idx_maxlook_users_order_id ON maxlook_users(order_id);
CREATE INDEX IF NOT EXISTS idx_maxlook_users_source ON maxlook_users(source);

-- ── Audit log table ───────────────────────────────────────
-- Track admin actions buat troubleshooting
CREATE TABLE IF NOT EXISTS maxlook_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES maxlook_users(id) ON DELETE SET NULL,
  actor TEXT NOT NULL,           -- 'admin' atau 'webhook' atau 'system'
  action TEXT NOT NULL,          -- 'create' | 'suspend' | 'unsuspend' | 'reset_device' | 'resend_email' | 'delete' | 'login'
  details JSONB,                 -- arbitrary metadata
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maxlook_audit_user_id ON maxlook_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_maxlook_audit_action ON maxlook_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_maxlook_audit_created_at ON maxlook_audit_log(created_at DESC);

-- ── RLS for audit log ─────────────────────────────────────
ALTER TABLE maxlook_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access audit" ON maxlook_audit_log;
CREATE POLICY "Service role full access audit" ON maxlook_audit_log
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ═══════════════════════════════════════════════════════
-- DONE! Schema ready buat admin panel.
-- ═══════════════════════════════════════════════════════
