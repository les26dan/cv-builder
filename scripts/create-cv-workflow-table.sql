-- CV Workflow Table Creation Script
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/REDACTED_SUPABASE_PROJECT_ID/sql

-- CV Workflow Table
CREATE TABLE IF NOT EXISTS cv_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_cv_workflow_user_id ON cv_workflow(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_status ON cv_workflow(status);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_updated_at ON cv_workflow(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_workflow_step ON cv_workflow(workflow_current_step);

-- JSONB indexes for structured queries
CREATE INDEX IF NOT EXISTS idx_cv_workflow_cv_data_gin ON cv_workflow USING GIN (cv_data);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_analysis_gin ON cv_workflow USING GIN (analysis_results);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_cv_workflow_text_search ON cv_workflow USING GIN (to_tsvector('english', uploaded_file_text));

-- Enable RLS
ALTER TABLE cv_workflow ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Users can only access their own data
DROP POLICY IF EXISTS "Users can access own CVs" ON cv_workflow;
CREATE POLICY "Users can access own CVs" ON cv_workflow
  FOR ALL USING (auth.uid() = user_id);

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
  
-- Verification query
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cv_workflow' 
ORDER BY ordinal_position;