/**
 * Database Service for CV Workflow Integration
 * Handles Supabase operations, migrations, and data management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { 
  WorkflowCVData, 
  CVWorkflowTable, 
  DatabaseResult, 
  WorkflowStatus,
  WorkflowStep,
  CVSource,
  SupportedLanguage
} from '../types/workflow'
import { environmentConfig, shouldUseMockMode } from '../../config/environment'

/**
 * Database configuration and client setup
 */
class DatabaseService {
  private static instance: DatabaseService
  private supabase: SupabaseClient | null = null
  private isInitialized = false

  /**
   * Singleton pattern for consistent database instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  /**
   * Initialize Supabase client with lazy loading
   */
  private async initializeClient(): Promise<SupabaseClient | null> {
    if (this.isInitialized) {
      return this.supabase
    }

    try {
      // Use environment configuration
      const { supabaseUrl, supabaseAnonKey } = environmentConfig.database

      if (!supabaseUrl || !supabaseAnonKey || shouldUseMockMode) {
        console.warn('Supabase credentials not configured or mock mode enabled, using mock mode')
        this.isInitialized = true
        return null
      }

      this.supabase = createClient(supabaseUrl, supabaseAnonKey)
      this.isInitialized = true
      
      // Test connection
      await this.testConnection()
      
      return this.supabase
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error)
      this.isInitialized = true
      return null
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<boolean> {
    if (!this.supabase) return false

    try {
      const { data, error } = await this.supabase
        .from('cv_workflow')
        .select('count')
        .limit(1)

      if (error) {
        console.warn('Database connection test failed:', error.message)
        return false
      }

      return true
    } catch (error) {
      console.warn('Database connection test error:', error)
      return false
    }
  }

  /**
   * Get Supabase client instance
   */
  public async getClient(): Promise<SupabaseClient | null> {
    return await this.initializeClient()
  }

  /**
   * Run database migrations
   * Creates necessary tables and indexes for workflow integration
   */
  public async runMigrations(): Promise<DatabaseResult<boolean>> {
    const client = await this.getClient()
    if (!client) {
      return {
        success: false,
        error: 'Database client not available'
      }
    }

    try {
      // Check if cv_workflow table exists
      const { data: tableExists } = await client
        .from('cv_workflow')
        .select('id')
        .limit(1)

      if (tableExists !== null) {
        console.log('CV workflow table already exists')
        return { success: true, data: true }
      }
    } catch (error) {
      // Table doesn't exist, proceed with migration
      console.log('Creating cv_workflow table...')
    }

    try {
      // Create cv_workflow table using SQL
      const migrationSQL = `
        -- CV Workflow Integration Table
        CREATE TABLE IF NOT EXISTS cv_workflow (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'completed')),
          score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
          
          -- CV Data (JSON field for flexible structure)
          cv_data JSONB NOT NULL DEFAULT '{}',
          
          -- File Upload Information
          uploaded_file_url TEXT,
          uploaded_file_name TEXT,
          uploaded_file_size INTEGER,
          uploaded_file_type TEXT,
          uploaded_file_text TEXT,
          
          -- Job Description Information
          job_description_text TEXT,
          job_description_url TEXT,
          job_description_keywords TEXT[],
          
          -- Analysis Results (JSON field)
          analysis_results JSONB,
          
          -- Workflow Tracking
          workflow_current_step TEXT NOT NULL DEFAULT 'upload' CHECK (workflow_current_step IN ('upload', 'analysis', 'editing', 'completed')),
          workflow_steps_completed TEXT[] NOT NULL DEFAULT '{}',
          workflow_last_active_step TEXT NOT NULL DEFAULT 'upload',
          workflow_time_spent INTEGER NOT NULL DEFAULT 0,
          
          -- Settings
          auto_save_enabled BOOLEAN NOT NULL DEFAULT true,
          ai_assistance_enabled BOOLEAN NOT NULL DEFAULT true,
          template_name TEXT NOT NULL DEFAULT 'dennis-schroder',
          language TEXT NOT NULL DEFAULT 'vi' CHECK (language IN ('vi', 'en')),
          
          -- Metadata
          version INTEGER NOT NULL DEFAULT 1,
          source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'template', 'scratch')),
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          last_saved_at TIMESTAMP WITH TIME ZONE
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_cv_workflow_user_id ON cv_workflow(user_id);
        CREATE INDEX IF NOT EXISTS idx_cv_workflow_status ON cv_workflow(status);
        CREATE INDEX IF NOT EXISTS idx_cv_workflow_updated_at ON cv_workflow(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_cv_workflow_user_status ON cv_workflow(user_id, status);

        -- RLS (Row Level Security) policies
        ALTER TABLE cv_workflow ENABLE ROW LEVEL SECURITY;

        -- Policy: Users can only access their own CVs
        CREATE POLICY IF NOT EXISTS "Users can access own CVs" ON cv_workflow
          FOR ALL USING (auth.uid()::text = user_id);

        -- Trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_cv_workflow_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER IF NOT EXISTS trigger_update_cv_workflow_updated_at
          BEFORE UPDATE ON cv_workflow
          FOR EACH ROW
          EXECUTE FUNCTION update_cv_workflow_updated_at();
      `

      const { error } = await client.rpc('exec_sql', { sql: migrationSQL })

      if (error) {
        console.error('Migration failed:', error)
        return {
          success: false,
          error: `Migration failed: ${error.message}`,
          code: error.code
        }
      }

      console.log('CV workflow table migration completed successfully')
      return { success: true, data: true }

    } catch (error) {
      console.error('Migration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      }
    }
  }

  /**
   * Create backup of existing data before migration
   */
  public async createBackup(): Promise<DatabaseResult<any[]>> {
    const client = await this.getClient()
    if (!client) {
      return {
        success: false,
        error: 'Database client not available'
      }
    }

    try {
      // Backup existing CVs table if it exists
      const { data: existingCVs, error } = await client
        .from('cvs')
        .select('*')

      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
        return {
          success: false,
          error: `Backup failed: ${error.message}`,
          code: error.code
        }
      }

      // Store backup with timestamp
      const backupData = {
        timestamp: new Date().toISOString(),
        data: existingCVs || [],
        table: 'cvs'
      }

      // You could store this in a backup table or external storage
      console.log('Backup created:', backupData)

      return {
        success: true,
        data: existingCVs || []
      }
    } catch (error) {
      console.error('Backup error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup failed'
      }
    }
  }

  /**
   * Migrate existing CV data to new workflow structure
   */
  public async migrateExistingData(): Promise<DatabaseResult<number>> {
    const client = await this.getClient()
    if (!client) {
      return {
        success: false,
        error: 'Database client not available'
      }
    }

    try {
      // Get existing CVs from old table
      const { data: existingCVs, error: fetchError } = await client
        .from('cvs')
        .select('*')

      if (fetchError && fetchError.code !== 'PGRST116') {
        return {
          success: false,
          error: `Failed to fetch existing data: ${fetchError.message}`,
          code: fetchError.code
        }
      }

      if (!existingCVs || existingCVs.length === 0) {
        console.log('No existing data to migrate')
        return { success: true, data: 0 }
      }

      let migratedCount = 0

      // Migrate each CV to new structure
      for (const cv of existingCVs) {
        try {
          const workflowCV: Partial<CVWorkflowTable> = {
            id: cv.id,
            user_id: cv.user_id,
            title: cv.title || 'Migrated CV',
            status: this.mapLegacyStatus(cv.status),
            score: cv.score || 0,
            cv_data: this.mapLegacyCVData(cv.content),
            job_description_text: cv.job_description,
            workflow_current_step: cv.status === 'completed' ? 'completed' : 'editing',
            workflow_steps_completed: cv.status === 'completed' ? ['upload', 'analysis', 'editing'] : ['upload'],
            workflow_last_active_step: cv.status === 'completed' ? 'completed' : 'editing',
            source: 'upload',
            created_at: cv.created_at || new Date().toISOString(),
            updated_at: cv.updated_at || new Date().toISOString()
          }

          const { error: insertError } = await client
            .from('cv_workflow')
            .insert([workflowCV])

          if (insertError) {
            console.error(`Failed to migrate CV ${cv.id}:`, insertError)
          } else {
            migratedCount++
          }
        } catch (error) {
          console.error(`Error migrating CV ${cv.id}:`, error)
        }
      }

      console.log(`Successfully migrated ${migratedCount} CVs`)
      return { success: true, data: migratedCount }

    } catch (error) {
      console.error('Data migration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data migration failed'
      }
    }
  }

  /**
   * Map legacy CV status to new workflow status
   */
  private mapLegacyStatus(legacyStatus: string): WorkflowStatus {
    switch (legacyStatus) {
      case 'completed':
        return 'completed'
      case 'in_progress':
        return 'draft'
      case 'new':
        return 'draft'
      default:
        return 'draft'
    }
  }

  /**
   * Map legacy CV content to new WorkflowCVData structure
   */
  private mapLegacyCVData(content: any): any {
    if (!content) {
      return {
        contact: { fullName: '', email: '', phone: '', location: '' },
        summary: { content: '' },
        experience: { items: [] },
        skills: { items: [] },
        education: { items: [] }
      }
    }

    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content
      return parsed
    } catch (error) {
      console.warn('Failed to parse legacy CV content:', error)
      return {
        contact: { fullName: '', email: '', phone: '', location: '' },
        summary: { content: '' },
        experience: { items: [] },
        skills: { items: [] },
        education: { items: [] }
      }
    }
  }

  /**
   * Validate database schema
   */
  public async validateSchema(): Promise<DatabaseResult<boolean>> {
    const client = await this.getClient()
    if (!client) {
      return {
        success: false,
        error: 'Database client not available'
      }
    }

    try {
      // Check if all required columns exist
      const { data, error } = await client
        .from('cv_workflow')
        .select('id, user_id, title, status, cv_data')
        .limit(1)

      if (error) {
        return {
          success: false,
          error: `Schema validation failed: ${error.message}`,
          code: error.code
        }
      }

      console.log('Database schema validation passed')
      return { success: true, data: true }

    } catch (error) {
      console.error('Schema validation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Schema validation failed'
      }
    }
  }
}

/**
 * Export singleton instance
 */
export const databaseService = DatabaseService.getInstance()

/**
 * Migration utilities for easy execution
 */
export class MigrationRunner {
  /**
   * Run complete migration process
   */
  public static async runFullMigration(): Promise<DatabaseResult<any>> {
    console.log('Starting CV workflow database migration...')

    try {
      // Step 1: Create backup
      console.log('Step 1: Creating backup...')
      const backupResult = await databaseService.createBackup()
      if (!backupResult.success) {
        console.error('Backup failed:', backupResult.error)
        // Continue anyway for new installations
      }

      // Step 2: Run schema migrations
      console.log('Step 2: Running schema migrations...')
      const migrationResult = await databaseService.runMigrations()
      if (!migrationResult.success) {
        return migrationResult
      }

      // Step 3: Migrate existing data
      console.log('Step 3: Migrating existing data...')
      const dataResult = await databaseService.migrateExistingData()
      if (!dataResult.success) {
        console.error('Data migration failed:', dataResult.error)
        // Continue anyway as schema is created
      }

      // Step 4: Validate schema
      console.log('Step 4: Validating schema...')
      const validationResult = await databaseService.validateSchema()
      if (!validationResult.success) {
        return validationResult
      }

      console.log('Migration completed successfully!')
      return {
        success: true,
        data: {
          backupCreated: backupResult.success,
          schemaCreated: migrationResult.success,
          dataMigrated: dataResult.success,
          recordsMigrated: dataResult.data || 0,
          schemaValidated: validationResult.success
        }
      }

    } catch (error) {
      console.error('Migration process failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration process failed'
      }
    }
  }
} 