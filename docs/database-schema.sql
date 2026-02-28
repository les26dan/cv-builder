-- ====================
-- OKBUDDY SUPABASE DATABASE SCHEMA
-- Production Ready Schema for CV Management Platform
-- ====================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ====================
-- USERS TABLE
-- ====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    email_verified BOOLEAN DEFAULT FALSE,
    oauth_provider VARCHAR(50), -- 'google', 'linkedin', or NULL for email/password
    oauth_id VARCHAR(255), -- OAuth provider's user ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_oauth CHECK (
        (oauth_provider IS NULL AND oauth_id IS NULL AND password_hash IS NOT NULL) OR
        (oauth_provider IS NOT NULL AND oauth_id IS NOT NULL)
    )
);

-- ====================
-- CV DRAFTS TABLE
-- ====================
CREATE TABLE cv_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id VARCHAR(255), -- Unique identifier for uploaded file
    file_name VARCHAR(255),
    file_size INTEGER,
    file_path TEXT, -- Path to stored file
    extracted_text TEXT, -- Text extracted from PDF/DOCX
    analysis_data JSONB, -- Structured analysis results
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed')),
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================
-- CVS TABLE (Main CV Records)
-- ====================
CREATE TABLE cvs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed')),
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    content JSONB, -- Structured CV content
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================
-- CV WORKFLOW TABLE (Enhanced CV Records with Full Workflow Support)
-- ====================
CREATE TABLE cv_workflow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'completed')),
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    cv_data JSONB NOT NULL, -- Full WorkflowCVData structure
    
    -- File Upload Information
    uploaded_file_url TEXT,
    uploaded_file_name VARCHAR(255),
    uploaded_file_size INTEGER,
    uploaded_file_type VARCHAR(100),
    uploaded_file_text TEXT, -- Extracted text from uploaded file
    
    -- Job Description Information
    job_description_text TEXT,
    job_description_url TEXT,
    job_description_keywords TEXT[], -- Array of keywords
    
    -- Analysis Results
    analysis_results JSONB, -- AI analysis results
    
    -- Workflow State
    workflow_current_step VARCHAR(50) DEFAULT 'upload',
    workflow_steps_completed TEXT[] DEFAULT '{}', -- Array of completed steps
    workflow_last_active_step VARCHAR(50),
    workflow_time_spent INTEGER DEFAULT 0, -- Time spent in seconds
    
    -- Settings
    auto_save_enabled BOOLEAN DEFAULT true,
    ai_assistance_enabled BOOLEAN DEFAULT true,
    template_name VARCHAR(100) DEFAULT 'default',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Metadata
    version INTEGER DEFAULT 1,
    source VARCHAR(50) DEFAULT 'upload',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_saved_at TIMESTAMP WITH TIME ZONE
);

-- ====================
-- USER SESSIONS TABLE
-- ====================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Automatic cleanup of expired sessions
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- ====================
-- AUDIT LOG TABLE
-- ====================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================
-- INDEXES FOR PERFORMANCE
-- ====================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);

-- CV drafts table indexes
CREATE INDEX idx_cv_drafts_user_id ON cv_drafts(user_id);
CREATE INDEX idx_cv_drafts_file_id ON cv_drafts(file_id);
CREATE INDEX idx_cv_drafts_status ON cv_drafts(status);
CREATE INDEX idx_cv_drafts_updated_at ON cv_drafts(updated_at DESC);

-- CVs table indexes
CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_cvs_status ON cvs(status);
CREATE INDEX idx_cvs_last_updated ON cvs(last_updated DESC);

-- CV Workflow table indexes
CREATE INDEX idx_cv_workflow_user_id ON cv_workflow(user_id);
CREATE INDEX idx_cv_workflow_status ON cv_workflow(status);
CREATE INDEX idx_cv_workflow_updated_at ON cv_workflow(updated_at DESC);
CREATE INDEX idx_cv_workflow_workflow_step ON cv_workflow(workflow_current_step);

-- Sessions table indexes
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ====================
-- ROW LEVEL SECURITY (RLS)
-- ====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY users_own_data ON users
    FOR ALL
    USING (auth.uid()::text = id::text);

-- Users can only access their own CV drafts
CREATE POLICY cv_drafts_own_data ON cv_drafts
    FOR ALL
    USING (auth.uid()::text = user_id::text);

-- Users can only access their own CVs
CREATE POLICY cvs_own_data ON cvs
    FOR ALL
    USING (auth.uid()::text = user_id::text);

-- Users can only access their own CV workflow data
CREATE POLICY cv_workflow_own_data ON cv_workflow
    FOR ALL
    USING (auth.uid()::text = user_id::text);

-- Users can only access their own sessions
CREATE POLICY sessions_own_data ON user_sessions
    FOR ALL
    USING (auth.uid()::text = user_id::text);

-- Users can only view their own audit logs
CREATE POLICY audit_logs_own_data ON audit_logs
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- ====================
-- FUNCTIONS & TRIGGERS
-- ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cv_drafts_updated_at
    BEFORE UPDATE ON cv_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cv_workflow_updated_at
    BEFORE UPDATE ON cv_workflow
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to log user actions
CREATE OR REPLACE FUNCTION log_user_action(
    p_user_id UUID,
    p_action VARCHAR(50),
    p_resource_type VARCHAR(50),
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id,
        p_details, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ====================
-- STORAGE BUCKETS (for file uploads)
-- ====================

-- Create storage bucket for CV files
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', false);

-- RLS policy for CV uploads bucket
CREATE POLICY "Users can upload their own CV files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'cv-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own CV files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'cv-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own CV files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'cv-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own CV files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'cv-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ====================
-- SAMPLE DATA (for testing)
-- ====================

-- Insert sample test user (remove in production)
INSERT INTO users (id, full_name, email, password_hash, email_verified) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Test User',
    'test@okbuddy.com',
    '$2b$10$rQJ9F8T8qWYgLZlKZnJ9OeH3p4W8m5s2M1q1x3o8vPaE2w7z6n5v9', -- bcrypt hash of 'testpassword123'
    true
) ON CONFLICT (email) DO NOTHING; 