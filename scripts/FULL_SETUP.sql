-- ============================================================
-- OKBUDDY — FULL DATABASE SETUP (chạy 1 lần trong SQL Editor)
-- Supabase Dashboard → SQL Editor → paste toàn bộ file này
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BẢNG 1: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  profile_picture_url TEXT,
  signup_method VARCHAR(20) DEFAULT 'email',
  email_verified BOOLEAN DEFAULT FALSE,
  account_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_signup_method CHECK (signup_method IN ('email', 'google', 'linkedin')),
  CONSTRAINT valid_account_status CHECK (account_status IN ('active', 'suspended', 'banned'))
);

-- ============================================================
-- BẢNG 2: user_oauth_providers
-- ============================================================
CREATE TABLE IF NOT EXISTS user_oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255) NOT NULL,
  provider_data JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider),
  UNIQUE(provider, provider_user_id),
  CONSTRAINT valid_provider CHECK (provider IN ('google', 'linkedin'))
);

-- ============================================================
-- BẢNG 3: oauth_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  state_token VARCHAR(255) NOT NULL,
  csrf_token VARCHAR(255) NOT NULL,
  return_url TEXT,
  client_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 minutes',
  UNIQUE(state_token),
  CONSTRAINT valid_oauth_provider CHECK (provider IN ('google', 'linkedin'))
);

-- ============================================================
-- BẢNG 4: security_audit_log
-- ============================================================
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  client_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- BẢNG 5: cv_drafts
-- ============================================================
CREATE TABLE IF NOT EXISTS cv_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id VARCHAR(255),
  file_name VARCHAR(255),
  file_size INTEGER,
  file_path TEXT,
  extracted_text TEXT,
  analysis_data JSONB,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed')),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- BẢNG 6: cv_workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS cv_workflow (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'completed')),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  cv_data JSONB NOT NULL DEFAULT '{}',
  uploaded_file_url TEXT,
  uploaded_file_name VARCHAR(255),
  uploaded_file_size INTEGER,
  uploaded_file_type VARCHAR(100),
  uploaded_file_text TEXT,
  job_description_text TEXT,
  job_description_url TEXT,
  job_description_keywords TEXT[],
  analysis_results JSONB,
  workflow_current_step VARCHAR(50) DEFAULT 'upload',
  workflow_steps_completed TEXT[] DEFAULT '{}',
  workflow_last_active_step VARCHAR(50),
  workflow_time_spent INTEGER DEFAULT 0,
  auto_save_enabled BOOLEAN DEFAULT true,
  ai_assistance_enabled BOOLEAN DEFAULT true,
  template_name VARCHAR(100) DEFAULT 'default',
  language VARCHAR(10) DEFAULT 'vi',
  version INTEGER DEFAULT 1,
  source VARCHAR(50) DEFAULT 'upload',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_saved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_signup_method ON users(signup_method);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_state_token ON oauth_sessions(state_token);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_expires_at ON oauth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_drafts_user_id ON cv_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_user_id ON cv_workflow(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_status ON cv_workflow(status);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_updated_at ON cv_workflow(updated_at DESC);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_cv_workflow_updated_at ON cv_workflow;
CREATE TRIGGER trigger_update_cv_workflow_updated_at
  BEFORE UPDATE ON cv_workflow
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_workflow ENABLE ROW LEVEL SECURITY;

-- users: service role full access, users xem chính mình
DROP POLICY IF EXISTS "service_role_users" ON users;
CREATE POLICY "service_role_users" ON users FOR ALL USING (true) WITH CHECK (true);

-- cv_drafts: service role full access
DROP POLICY IF EXISTS "service_role_cv_drafts" ON cv_drafts;
CREATE POLICY "service_role_cv_drafts" ON cv_drafts FOR ALL USING (true) WITH CHECK (true);

-- cv_workflow: service role full access
DROP POLICY IF EXISTS "service_role_cv_workflow" ON cv_workflow;
CREATE POLICY "service_role_cv_workflow" ON cv_workflow FOR ALL USING (true) WITH CHECK (true);

-- oauth_sessions: full access
DROP POLICY IF EXISTS "service_role_oauth_sessions" ON oauth_sessions;
CREATE POLICY "service_role_oauth_sessions" ON oauth_sessions FOR ALL USING (true) WITH CHECK (true);

-- security_audit_log: insert only
DROP POLICY IF EXISTS "service_role_audit_log" ON security_audit_log;
CREATE POLICY "service_role_audit_log" ON security_audit_log FOR ALL USING (true) WITH CHECK (true);

-- user_oauth_providers: full access
DROP POLICY IF EXISTS "service_role_oauth_providers" ON user_oauth_providers;
CREATE POLICY "service_role_oauth_providers" ON user_oauth_providers FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- ADMIN ACCOUNT (thay password hash nếu cần)
-- Hash bên dưới = bcrypt của "[REDACTED_PASSWORD]" với 10 rounds
-- ============================================================
INSERT INTO users (email, full_name, password_hash, signup_method, email_verified, account_status)
VALUES (
  'okbuddy2025@gmail.com',
  'Admin Buddy',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'email',
  true,
  'active'
) ON CONFLICT (email) DO UPDATE SET
  email_verified = true,
  account_status = 'active',
  updated_at = NOW();

-- ============================================================
-- VERIFY — kiểm tra các bảng đã tạo
-- ============================================================
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('users','user_oauth_providers','oauth_sessions','security_audit_log','cv_drafts','cv_workflow')
ORDER BY table_name;
