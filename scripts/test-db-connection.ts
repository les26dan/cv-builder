#!/usr/bin/env tsx

/**
 * Test Database Connection and Create cv_workflow Table
 * This script tests the Supabase connection and creates the cv_workflow table if needed
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testDatabaseConnection() {
  console.log('🔗 Testing Supabase Database Connection...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.log('Expected: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }
  
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test connection by checking existing tables
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful!')
    return true
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

async function checkCVWorkflowTable() {
  console.log('\n📋 Checking cv_workflow table...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Try to query the cv_workflow table
    const { data, error } = await supabase
      .from('cv_workflow')
      .select('id')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️ cv_workflow table does not exist')
        return false
      } else {
        console.error('❌ Error checking cv_workflow table:', error.message)
        return false
      }
    }
    
    console.log('✅ cv_workflow table exists!')
    return true
    
  } catch (error) {
    console.error('❌ Failed to check cv_workflow table:', error)
    return false
  }
}

async function createCVWorkflowTable() {
  console.log('\n🔨 Creating cv_workflow table...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY for table creation')
    return false
  }
  
  // Use service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const createTableSQL = `
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
  `
  
  const indexesSQL = `
    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_cv_workflow_user_id ON cv_workflow(user_id);
    CREATE INDEX IF NOT EXISTS idx_cv_workflow_status ON cv_workflow(status);
    CREATE INDEX IF NOT EXISTS idx_cv_workflow_updated_at ON cv_workflow(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_cv_workflow_workflow_step ON cv_workflow(workflow_current_step);
  `
  
  const rlsSQL = `
    -- Enable RLS
    ALTER TABLE cv_workflow ENABLE ROW LEVEL SECURITY;
    
    -- RLS Policy - Users can only access their own data
    DROP POLICY IF EXISTS "Users can access own CVs" ON cv_workflow;
    CREATE POLICY "Users can access own CVs" ON cv_workflow
      FOR ALL USING (auth.uid() = user_id);
  `
  
  const triggerSQL = `
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
  `
  
  try {
    console.log('⚠️ Note: Supabase direct SQL execution requires manual setup.')
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:')
    console.log('\n--- START SQL ---')
    console.log(createTableSQL)
    console.log(indexesSQL)
    console.log(rlsSQL)
    console.log(triggerSQL)
    console.log('--- END SQL ---\n')
    
    console.log('🌐 Visit: https://supabase.com/dashboard/project/wxuballdcbibysomhdgk/sql')
    console.log('💡 Copy and paste the SQL above into the SQL Editor and click "Run"')
    console.log('⏳ After running the SQL, re-run this script to verify the table creation.')
    
    return false // Return false so we can verify after manual creation
    
  } catch (error) {
    console.error('❌ Failed to create cv_workflow table:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Database Setup Script\n')
  
  // Test connection
  const connectionOk = await testDatabaseConnection()
  if (!connectionOk) {
    console.log('\n❌ Database connection failed. Exiting.')
    process.exit(1)
  }
  
  // Check if cv_workflow table exists
  const tableExists = await checkCVWorkflowTable()
  
  if (!tableExists) {
    // Create the table
    const createOk = await createCVWorkflowTable()
    if (!createOk) {
      console.log('\n❌ Failed to create cv_workflow table. Exiting.')
      process.exit(1)
    }
    
    // Verify table creation
    const verifyExists = await checkCVWorkflowTable()
    if (!verifyExists) {
      console.log('\n❌ Table creation verification failed. Exiting.')
      process.exit(1)
    }
  }
  
  console.log('\n🎉 Database setup complete!')
  console.log('✅ Connection: OK')
  console.log('✅ cv_workflow table: Ready')
  console.log('\nYou can now use the CVWorkflowDataService with real database persistence.')
}

// Run the script
main().catch(console.error)