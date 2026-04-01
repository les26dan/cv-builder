-- Create Missing CV Tables
-- Run this in Supabase SQL Editor

-- CV DRAFTS TABLE
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

-- CV WORKFLOW TABLE
CREATE TABLE IF NOT EXISTS cv_workflow (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'completed')),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  cv_data JSONB NOT NULL,

  -- File Upload Information
  uploaded_file_url TEXT,
  uploaded_file_name VARCHAR(255),
  uploaded_file_size INTEGER,
  uploaded_file_type VARCHAR(100),
  uploaded_file_text TEXT,

  -- Job Description Information
  job_description_text TEXT,
  job_description_url TEXT,
  job_description_keywords TEXT[],

  -- Analysis Results
  analysis_results JSONB,

  -- Workflow State
  workflow_current_step VARCHAR(50) DEFAULT 'upload',
  workflow_steps_completed TEXT[] DEFAULT '{}',
  workflow_last_active_step VARCHAR(50),
  workflow_time_spent INTEGER DEFAULT 0,

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cv_drafts_user_id ON cv_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_user_id ON cv_workflow(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_status ON cv_workflow(status);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_updated_at ON cv_workflow(updated_at DESC);

-- JSONB indexes
CREATE INDEX IF NOT EXISTS idx_cv_workflow_cv_data_gin ON cv_workflow USING GIN (cv_data);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_analysis_gin ON cv_workflow USING GIN (analysis_results);

-- Enable RLS
ALTER TABLE cv_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_workflow ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cv_drafts
DROP POLICY IF EXISTS "Users can access own cv_drafts" ON cv_drafts;
CREATE POLICY "Users can access own cv_drafts" ON cv_drafts
  FOR ALL USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for cv_workflow
DROP POLICY IF EXISTS "Users can access own cv_workflow" ON cv_workflow;
CREATE POLICY "Users can access own cv_workflow" ON cv_workflow
  FOR ALL USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cv_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cv_workflow_updated_at ON cv_workflow;
CREATE TRIGGER trigger_update_cv_workflow_updated_at
  BEFORE UPDATE ON cv_workflow
  FOR EACH ROW
  EXECUTE FUNCTION update_cv_workflow_updated_at();

-- Verify tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('cv_drafts', 'cv_workflow');
