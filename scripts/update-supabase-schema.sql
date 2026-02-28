-- ====================
-- SUPABASE SCHEMA UPDATES FOR SOFT LAUNCH
-- Run this in Supabase SQL Editor
-- ====================

-- Add missing columns to cvs table
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS blob_url TEXT;
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable Row Level Security
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_workflow ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow admin user access
CREATE POLICY "Admin can access all CVs" ON cvs
FOR ALL USING (user_id = 'b5787d9c-6cf7-422e-bce9-66cd284ec036'::uuid);

CREATE POLICY "Admin can access all workflows" ON cv_workflow  
FOR ALL USING (user_id = 'b5787d9c-6cf7-422e-bce9-66cd284ec036'::uuid);

-- Create policies for users to access their own data
CREATE POLICY "Users can access own CVs" ON cvs
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own workflows" ON cv_workflow
FOR ALL USING (auth.uid() = user_id);

-- Update existing cv_workflow records to fix data type issues
-- Fix possibility_score array to integer
UPDATE cv_workflow 
SET score = CASE 
  WHEN cv_data->>'possibility_score' LIKE '[%]' 
  THEN (cv_data->>'possibility_score')::jsonb->0
  ELSE (cv_data->>'possibility_score')::integer
END
WHERE cv_data->>'possibility_score' IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_created_at ON cvs(created_at);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_user_id ON cv_workflow(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_status ON cv_workflow(status);
CREATE INDEX IF NOT EXISTS idx_cv_workflow_created_at ON cv_workflow(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_cvs_updated_at ON cvs;
CREATE TRIGGER update_cvs_updated_at 
    BEFORE UPDATE ON cvs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cv_workflow_updated_at ON cv_workflow;
CREATE TRIGGER update_cv_workflow_updated_at 
    BEFORE UPDATE ON cv_workflow 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify tables exist and are accessible
SELECT 'CVs table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cvs' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'CV Workflow table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cv_workflow' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Current CV count:' as info, COUNT(*) FROM cvs;
SELECT 'Current workflow count:' as info, COUNT(*) FROM cv_workflow;