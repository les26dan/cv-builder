-- ===============================================
-- MIGRATION SCRIPT: Current Schema → Enhanced User Credentials Schema
-- Safely migrates existing CV Builder database to new multi-auth structure
-- ===============================================

-- ⚠️ IMPORTANT: Run this migration during maintenance window
-- ⚠️ BACKUP your database before running this migration!

-- ===============================================
-- 1. BACKUP EXISTING DATA (CREATE BACKUP TABLES)
-- ===============================================

-- Backup current users table
CREATE TABLE users_backup AS TABLE users;

-- ===============================================
-- 2. CREATE NEW TABLES (if they don't exist)
-- ===============================================

-- OAuth providers table
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

-- OAuth sessions table
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
  
  UNIQUE(state_token)
);

-- Security audit log
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  client_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account linking attempts
CREATE TABLE IF NOT EXISTS account_linking_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_user_id VARCHAR(255),
  attempt_type VARCHAR(20) NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  security_flags JSONB DEFAULT '[]',
  client_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 3. MODIFY EXISTING USERS TABLE
-- ===============================================

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add profile_picture_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'profile_picture_url') THEN
        ALTER TABLE users ADD COLUMN profile_picture_url TEXT;
    END IF;
    
    -- Add signup_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'signup_method') THEN
        ALTER TABLE users ADD COLUMN signup_method VARCHAR(20) DEFAULT 'email';
    END IF;
    
    -- Add account_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'account_status') THEN
        ALTER TABLE users ADD COLUMN account_status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- Update signup_method based on existing oauth_provider column
UPDATE users 
SET signup_method = 
    CASE 
        WHEN oauth_provider IS NOT NULL THEN oauth_provider
        ELSE 'email'
    END
WHERE signup_method IS NULL OR signup_method = 'email';

-- ===============================================
-- 4. MIGRATE OAUTH DATA TO NEW STRUCTURE
-- ===============================================

-- Migrate existing OAuth users to the new providers table
INSERT INTO user_oauth_providers (
    user_id, 
    provider, 
    provider_user_id, 
    provider_email, 
    provider_data,
    is_primary,
    enabled,
    linked_at,
    last_used_at
)
SELECT 
    u.id,
    u.oauth_provider,
    u.oauth_id,
    u.email,
    jsonb_build_object(
        'name', u.full_name,
        'email', u.email,
        'picture', u.profile_picture_url
    ),
    true, -- Mark as primary authentication method
    true, -- Enabled
    u.created_at,
    u.updated_at
FROM users u
WHERE u.oauth_provider IS NOT NULL 
  AND u.oauth_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM user_oauth_providers 
      WHERE user_id = u.id AND provider = u.oauth_provider
  );

-- ===============================================
-- 5. ADD CONSTRAINTS TO USERS TABLE
-- ===============================================

-- Add constraints for new columns
ALTER TABLE users 
    ADD CONSTRAINT IF NOT EXISTS valid_signup_method 
    CHECK (signup_method IN ('email', 'google', 'linkedin'));

ALTER TABLE users 
    ADD CONSTRAINT IF NOT EXISTS valid_account_status 
    CHECK (account_status IN ('active', 'suspended', 'banned'));

-- ===============================================
-- 6. CREATE INDEXES FOR NEW TABLES
-- ===============================================

-- OAuth providers indexes
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider ON user_oauth_providers(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider_user_id ON user_oauth_providers(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider_email ON user_oauth_providers(provider_email);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_is_primary ON user_oauth_providers(user_id, is_primary);

-- OAuth sessions indexes
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_session_id ON oauth_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_state_token ON oauth_sessions(state_token);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_expires_at ON oauth_sessions(expires_at);

-- Security audit indexes
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit_log(created_at);

-- ===============================================
-- 7. CREATE FUNCTIONS & TRIGGERS
-- ===============================================

-- Function to ensure only one primary provider per user
CREATE OR REPLACE FUNCTION ensure_single_primary_provider()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE user_oauth_providers 
    SET is_primary = FALSE 
    WHERE user_id = NEW.user_id AND provider != NEW.provider;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for primary provider constraint
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_provider ON user_oauth_providers;
CREATE TRIGGER trigger_ensure_single_primary_provider
  BEFORE INSERT OR UPDATE ON user_oauth_providers
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_provider();

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM oauth_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 8. SETUP ROW LEVEL SECURITY FOR NEW TABLES
-- ===============================================

-- Enable RLS
ALTER TABLE user_oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_linking_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for OAuth providers
CREATE POLICY "Users can view their own OAuth providers" ON user_oauth_providers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own OAuth providers" ON user_oauth_providers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can create OAuth providers" ON user_oauth_providers
  FOR INSERT WITH CHECK (true);

-- RLS policies for OAuth sessions
CREATE POLICY "Users can view their own OAuth sessions" ON oauth_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage OAuth sessions" ON oauth_sessions
  FOR ALL WITH CHECK (true);

-- RLS policies for security audit log
CREATE POLICY "Users can view their own security audit log" ON security_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can log security events" ON security_audit_log
  FOR INSERT WITH CHECK (true);

-- RLS policies for account linking attempts
CREATE POLICY "Service role can log linking attempts" ON account_linking_attempts
  FOR INSERT WITH CHECK (true);

-- ===============================================
-- 9. VERIFICATION QUERIES
-- ===============================================

-- Verify migration success
DO $$
DECLARE
    original_user_count INTEGER;
    migrated_oauth_count INTEGER;
    users_with_providers INTEGER;
BEGIN
    -- Count original users
    SELECT COUNT(*) INTO original_user_count FROM users_backup;
    
    -- Count migrated OAuth providers
    SELECT COUNT(*) INTO migrated_oauth_count FROM user_oauth_providers;
    
    -- Count users with OAuth providers
    SELECT COUNT(DISTINCT user_id) INTO users_with_providers FROM user_oauth_providers;
    
    -- Log migration statistics
    RAISE NOTICE 'Migration Statistics:';
    RAISE NOTICE '- Original users: %', original_user_count;
    RAISE NOTICE '- OAuth providers migrated: %', migrated_oauth_count;
    RAISE NOTICE '- Users with OAuth providers: %', users_with_providers;
    
    -- Verify no data loss
    IF EXISTS (
        SELECT 1 FROM users_backup b 
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = b.email)
    ) THEN
        RAISE EXCEPTION 'DATA LOSS DETECTED: Some users were not migrated properly!';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully! ✅';
END $$;

-- ===============================================
-- 10. CLEANUP (Optional - Run after verification)
-- ===============================================

-- Uncomment the following lines after verifying migration success:

-- -- Remove old OAuth columns from users table
-- -- ALTER TABLE users DROP COLUMN IF EXISTS oauth_provider;
-- -- ALTER TABLE users DROP COLUMN IF EXISTS oauth_id;

-- -- Drop backup table
-- -- DROP TABLE users_backup;

-- ===============================================
-- MIGRATION COMPLETE
-- ===============================================