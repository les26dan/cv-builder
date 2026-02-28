-- Enhanced OAuth Database Schema for OkBuddy Account Creation & Login
-- This file documents the required database structure for the OAuth system

-- Users table (main user accounts)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255), -- Can be null for OAuth-only accounts
  profile_picture_url TEXT,
  signup_method VARCHAR(20) DEFAULT 'email', -- 'email', 'google', 'linkedin'
  email_verified BOOLEAN DEFAULT FALSE,
  account_status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'banned'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth providers table (links users to OAuth providers)
CREATE TABLE IF NOT EXISTS user_oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL, -- 'google', 'linkedin'
  provider_user_id VARCHAR(255) NOT NULL, -- OAuth provider's user ID
  provider_email VARCHAR(255) NOT NULL, -- Email from OAuth provider
  provider_data JSONB DEFAULT '{}', -- Additional provider data
  is_primary BOOLEAN DEFAULT FALSE, -- Primary authentication method
  priority INTEGER DEFAULT 0, -- Provider priority for authentication
  enabled BOOLEAN DEFAULT TRUE, -- Whether this provider is enabled
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, provider), -- One provider per user
  UNIQUE(provider, provider_user_id) -- One OAuth account per provider
);

-- OAuth sessions table (temporary session data during OAuth flow)
CREATE TABLE IF NOT EXISTS oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  state_token VARCHAR(255) NOT NULL,
  csrf_token VARCHAR(255) NOT NULL,
  return_url TEXT,
  client_ip VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 minutes',
  
  -- Constraints
  UNIQUE(state_token)
);

-- Security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  client_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account linking attempts table (for security monitoring)
CREATE TABLE IF NOT EXISTS account_linking_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_user_id VARCHAR(255),
  attempt_type VARCHAR(20) NOT NULL, -- 'link', 'create', 'login'
  success BOOLEAN NOT NULL,
  error_message TEXT,
  security_flags JSONB DEFAULT '[]',
  client_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_signup_method ON users(signup_method);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider ON user_oauth_providers(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider_user_id ON user_oauth_providers(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider_email ON user_oauth_providers(provider_email);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_is_primary ON user_oauth_providers(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_last_used ON user_oauth_providers(last_used_at);

CREATE INDEX IF NOT EXISTS idx_oauth_sessions_session_id ON oauth_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_state_token ON oauth_sessions(state_token);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_expires_at ON oauth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user_id ON oauth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_linking_attempts_email ON account_linking_attempts(email);
CREATE INDEX IF NOT EXISTS idx_linking_attempts_provider ON account_linking_attempts(provider);
CREATE INDEX IF NOT EXISTS idx_linking_attempts_created_at ON account_linking_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_linking_attempts_success ON account_linking_attempts(success);

-- Cleanup functions for expired sessions
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

-- Function to ensure only one primary provider per user
CREATE OR REPLACE FUNCTION ensure_single_primary_provider()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    -- Remove primary flag from other providers for this user
    UPDATE user_oauth_providers 
    SET is_primary = FALSE 
    WHERE user_id = NEW.user_id AND provider != NEW.provider;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain primary provider constraint
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_provider ON user_oauth_providers;
CREATE TRIGGER trigger_ensure_single_primary_provider
  BEFORE INSERT OR UPDATE ON user_oauth_providers
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_provider();

-- Function to update user's updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET updated_at = NOW() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user timestamp when OAuth providers change
DROP TRIGGER IF EXISTS trigger_update_user_timestamp ON user_oauth_providers;
CREATE TRIGGER trigger_update_user_timestamp
  AFTER INSERT OR UPDATE OR DELETE ON user_oauth_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_linking_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS policies for OAuth providers table
CREATE POLICY "Users can view their own OAuth providers" ON user_oauth_providers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own OAuth providers" ON user_oauth_providers
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for OAuth sessions table
CREATE POLICY "Users can view their own OAuth sessions" ON oauth_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own OAuth sessions" ON oauth_sessions
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for security audit log (read-only for users)
CREATE POLICY "Users can view their own security audit log" ON security_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- RLS policies for account linking attempts (read-only for users)
CREATE POLICY "Users can view their own linking attempts" ON account_linking_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = account_linking_attempts.email
    )
  );

-- Sample data for testing (remove in production)
-- INSERT INTO users (email, full_name, signup_method, email_verified) VALUES
-- ('test@example.com', 'Test User', 'email', true),
-- ('google@example.com', 'Google User', 'google', true),
-- ('linkedin@example.com', 'LinkedIn User', 'linkedin', true);

-- Comments for documentation
COMMENT ON TABLE users IS 'Main user accounts table with support for multiple authentication methods';
COMMENT ON TABLE user_oauth_providers IS 'Links users to OAuth providers (Google, LinkedIn, etc.)';
COMMENT ON TABLE oauth_sessions IS 'Temporary session data during OAuth authentication flow';
COMMENT ON TABLE security_audit_log IS 'Security events and audit trail for OAuth operations';
COMMENT ON TABLE account_linking_attempts IS 'Log of account linking attempts for security monitoring';

COMMENT ON COLUMN users.signup_method IS 'How the user originally signed up (email, google, linkedin)';
COMMENT ON COLUMN users.account_status IS 'Current account status (active, suspended, banned)';
COMMENT ON COLUMN user_oauth_providers.is_primary IS 'Whether this is the primary authentication method';
COMMENT ON COLUMN user_oauth_providers.priority IS 'Priority order for authentication attempts';
COMMENT ON COLUMN user_oauth_providers.enabled IS 'Whether this provider is enabled for authentication';
COMMENT ON COLUMN oauth_sessions.state_token IS 'CSRF protection token for OAuth flow';
COMMENT ON COLUMN oauth_sessions.csrf_token IS 'Additional CSRF token for security'; 