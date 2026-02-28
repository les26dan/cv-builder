import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
/**
 * Database Service Tests
 * Comprehensive test suite for CV workflow database operations
 * Tests migrations, connections, error handling, and data integrity
 */

import { databaseService, MigrationRunner } from '../database'
import { createClient } from '@supabase/supabase-js'

// Mock environment configuration first
vi.mock('../../../config/environment', () => ({
  environmentConfig: {
    database: {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-key',
      enableMockMode: false
    }
  },
  shouldUseMockMode: false
}))

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}))

describe('DatabaseService', () => {
  let mockClient: any
  const mockCreateClient = createClient as vi.MockedFunction<typeof createClient>

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create mock Supabase client
    mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue({ error: null })
    }

    mockCreateClient.mockReturnValue(mockClient as any)
    
    // Reset the singleton instance
    const service = databaseService as any
    service.isInitialized = false
    service.supabase = null
  })

  describe('Client Initialization', () => {
    it('should initialize Supabase client successfully', async () => {
      // Mock successful connection test
      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
      
      const client = await databaseService.getClient()
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key'
      )
      expect(client).toBeTruthy()
    })

    it('should return null when credentials are missing', async () => {
      // Reset singleton and mock missing credentials
      const service = databaseService as any
      service.isInitialized = false
      service.supabase = null
      
      // Mock shouldUseMockMode to return true
      vi.doMock('../../../config/environment', () => ({
        environmentConfig: {
          database: {
            supabaseUrl: null,
            supabaseAnonKey: null,
            enableMockMode: true
          }
        },
        shouldUseMockMode: true
      }))

      const client = await databaseService.getClient()
      expect(client).toBeNull()
    })

    it('should handle client initialization errors', async () => {
      mockCreateClient.mockImplementationOnce(() => {
        throw new Error('Connection failed')
      })

      const client = await databaseService.getClient()
      expect(client).toBeNull()
    })
  })

  describe('Database Migrations', () => {
    it('should run migrations successfully', async () => {
      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
      
      // Mock table doesn't exist (will trigger migration)
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } // Table doesn't exist
          })
        })
      })

      // Mock successful migration
      mockClient.rpc.mockResolvedValue({ error: null })

      const result = await databaseService.runMigrations()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockClient.rpc).toHaveBeenCalledWith('exec_sql', {
        sql: expect.stringContaining('CREATE TABLE IF NOT EXISTS cv_workflow')
      })
    })

    it('should skip migration if table already exists', async () => {
      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
      
      // Mock table exists
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [{ id: 'test' }],
            error: null
          })
        })
      })

      const result = await databaseService.runMigrations()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockClient.rpc).not.toHaveBeenCalled()
    })

    it('should handle migration failures', async () => {
      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
      
      // Mock table doesn't exist
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        })
      })

      // Mock migration failure
      mockClient.rpc.mockResolvedValue({
        error: { message: 'SQL error', code: 'SQL001' }
      })

      const result = await databaseService.runMigrations()
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Migration failed: SQL error')
      expect(result.code).toBe('SQL001')
    })

    it('should handle migration exceptions', async () => {
      // Mock connection test success first
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
      
      // Then mock the error for the table check
      mockClient.from.mockImplementationOnce(() => {
        throw new Error('Database connection lost')
      })

      const result = await databaseService.runMigrations()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection lost')
    })
  })

  describe('Data Backup', () => {
    it('should create backup successfully', async () => {
      const mockCVs = [
        { id: 'cv-1', title: 'Test CV', user_id: 'user-1' },
        { id: 'cv-2', title: 'Another CV', user_id: 'user-1' }
      ]

      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
          data: mockCVs,
          error: null
        })
      })

      const result = await databaseService.createBackup()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCVs)
    })

    it('should handle backup when table does not exist', async () => {
      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' } // Table doesn't exist
        })
      })

      const result = await databaseService.createBackup()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should handle backup errors', async () => {
      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Access denied', code: 'AUTH001' }
        })
      })

      const result = await databaseService.createBackup()
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Backup failed: Access denied')
      expect(result.code).toBe('AUTH001')
    })
  })

  describe('Data Migration', () => {
    it('should migrate existing data successfully', async () => {
      const mockLegacyCVs = [
        {
          id: 'legacy-1',
          user_id: 'user-1',
          title: 'Legacy CV',
          status: 'completed',
          score: 85,
          content: '{"contact":{"fullName":"Test User"}}',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      // Mock fetch existing CVs
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
          data: mockLegacyCVs,
          error: null
        })
      })

      // Mock successful insert
      mockClient.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          error: null
        })
      })

      const result = await databaseService.migrateExistingData()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(1) // 1 record migrated
    })

    it('should handle no existing data to migrate', async () => {
      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      const result = await databaseService.migrateExistingData()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(0)
    })

    it('should handle migration errors for individual records', async () => {
      const mockLegacyCVs = [
        { id: 'legacy-1', user_id: 'user-1', title: 'CV 1' },
        { id: 'legacy-2', user_id: 'user-2', title: 'CV 2' }
      ]

      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      // Mock fetch existing CVs
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
          data: mockLegacyCVs,
          error: null
        })
      })

      // Mock insert - first succeeds, second fails
      mockClient.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      }).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Duplicate key', code: 'UNIQUE_VIOLATION' }
        })
      })

      const result = await databaseService.migrateExistingData()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(1) // Only 1 successful migration
    })
  })

  describe('Schema Validation', () => {
    it('should validate schema successfully', async () => {
      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [{ id: 'test' }],
            error: null
          })
        })
      })

      const result = await databaseService.validateSchema()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })

    it('should handle schema validation failures', async () => {
      // Mock connection test success
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Column not found', code: 'COLUMN_NOT_FOUND' }
          })
        })
      })

      const result = await databaseService.validateSchema()
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Schema validation failed: Column not found')
      expect(result.code).toBe('COLUMN_NOT_FOUND')
    })
  })

  describe('Legacy Status Mapping', () => {
    it('should map legacy statuses correctly', () => {
      // Access private method through type assertion
      const service = databaseService as any
      
      expect(service.mapLegacyStatus('completed')).toBe('completed')
      expect(service.mapLegacyStatus('in_progress')).toBe('draft')
      expect(service.mapLegacyStatus('new')).toBe('draft')
      expect(service.mapLegacyStatus('unknown')).toBe('draft')
    })
  })

  describe('Legacy CV Data Mapping', () => {
    it('should parse valid JSON content', () => {
      const service = databaseService as any
      const validContent = '{"contact":{"fullName":"Test"},"summary":{"content":"Test summary"}}'
      
      const result = service.mapLegacyCVData(validContent)
      
      expect(result.contact.fullName).toBe('Test')
      expect(result.summary.content).toBe('Test summary')
    })

    it('should handle invalid JSON content', () => {
      const service = databaseService as any
      const invalidContent = 'invalid json'
      
      const result = service.mapLegacyCVData(invalidContent)
      
      expect(result.contact.fullName).toBe('')
      expect(result.summary.content).toBe('')
      expect(result.experience.items).toEqual([])
    })

    it('should handle null/undefined content', () => {
      const service = databaseService as any
      
      const result1 = service.mapLegacyCVData(null)
      const result2 = service.mapLegacyCVData(undefined)
      
      expect(result1.contact.fullName).toBe('')
      expect(result2.contact.fullName).toBe('')
    })

    it('should handle object content', () => {
      const service = databaseService as any
      const objectContent = {
        contact: { fullName: 'Object Test' },
        summary: { content: 'Object summary' }
      }
      
      const result = service.mapLegacyCVData(objectContent)
      
      expect(result.contact.fullName).toBe('Object Test')
      expect(result.summary.content).toBe('Object summary')
    })
  })
})

describe('MigrationRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should run full migration process successfully', async () => {
    // Mock all migration steps to succeed
    vi.spyOn(databaseService, 'createBackup').mockResolvedValue({
      success: true,
      data: []
    })
    
    vi.spyOn(databaseService, 'runMigrations').mockResolvedValue({
      success: true,
      data: true
    })
    
    vi.spyOn(databaseService, 'migrateExistingData').mockResolvedValue({
      success: true,
      data: 5
    })
    
    vi.spyOn(databaseService, 'validateSchema').mockResolvedValue({
      success: true,
      data: true
    })

    const result = await MigrationRunner.runFullMigration()
    
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      backupCreated: true,
      schemaCreated: true,
      dataMigrated: true,
      recordsMigrated: 5,
      schemaValidated: true
    })
  })

  it('should continue migration even if backup fails', async () => {
    vi.spyOn(databaseService, 'createBackup').mockResolvedValue({
      success: false,
      error: 'Backup failed'
    })
    
    vi.spyOn(databaseService, 'runMigrations').mockResolvedValue({
      success: true,
      data: true
    })
    
    vi.spyOn(databaseService, 'migrateExistingData').mockResolvedValue({
      success: true,
      data: 0
    })
    
    vi.spyOn(databaseService, 'validateSchema').mockResolvedValue({
      success: true,
      data: true
    })

    const result = await MigrationRunner.runFullMigration()
    
    expect(result.success).toBe(true)
    expect(result.data.backupCreated).toBe(false)
    expect(result.data.schemaCreated).toBe(true)
  })

  it('should fail if schema migration fails', async () => {
    vi.spyOn(databaseService, 'createBackup').mockResolvedValue({
      success: true,
      data: []
    })
    
    vi.spyOn(databaseService, 'runMigrations').mockResolvedValue({
      success: false,
      error: 'Schema creation failed'
    })

    const result = await MigrationRunner.runFullMigration()
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Schema creation failed')
  })

  it('should continue even if data migration fails', async () => {
    vi.spyOn(databaseService, 'createBackup').mockResolvedValue({
      success: true,
      data: []
    })
    
    vi.spyOn(databaseService, 'runMigrations').mockResolvedValue({
      success: true,
      data: true
    })
    
    vi.spyOn(databaseService, 'migrateExistingData').mockResolvedValue({
      success: false,
      error: 'Data migration failed'
    })
    
    vi.spyOn(databaseService, 'validateSchema').mockResolvedValue({
      success: true,
      data: true
    })

    const result = await MigrationRunner.runFullMigration()
    
    expect(result.success).toBe(true)
    expect(result.data.dataMigrated).toBe(false)
    expect(result.data.schemaValidated).toBe(true)
  })

  it('should fail if schema validation fails', async () => {
    vi.spyOn(databaseService, 'createBackup').mockResolvedValue({
      success: true,
      data: []
    })
    
    vi.spyOn(databaseService, 'runMigrations').mockResolvedValue({
      success: true,
      data: true
    })
    
    vi.spyOn(databaseService, 'migrateExistingData').mockResolvedValue({
      success: true,
      data: 0
    })
    
    vi.spyOn(databaseService, 'validateSchema').mockResolvedValue({
      success: false,
      error: 'Schema validation failed'
    })

    const result = await MigrationRunner.runFullMigration()
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Schema validation failed')
  })

  it('should handle migration process exceptions', async () => {
    vi.spyOn(databaseService, 'createBackup').mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    const result = await MigrationRunner.runFullMigration()
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unexpected error')
  })
})

describe('Database Service Integration', () => {
  it('should handle null client gracefully', async () => {
    // Mock getClient to return null
    const getClientSpy = vi.spyOn(databaseService, 'getClient').mockResolvedValue(null)

    const migrationResult = await databaseService.runMigrations()
    expect(migrationResult.success).toBe(false)
    expect(migrationResult.error).toBe('Database client not available')

    const backupResult = await databaseService.createBackup()
    expect(backupResult.success).toBe(false)
    expect(backupResult.error).toBe('Database client not available')

    const validationResult = await databaseService.validateSchema()
    expect(validationResult.success).toBe(false)
    expect(validationResult.error).toBe('Database client not available')
    
    // Restore the spy
    getClientSpy.mockRestore()
  })

  it('should maintain singleton pattern', () => {
    const instance1 = databaseService
    const instance2 = databaseService
    
    expect(instance1).toBe(instance2)
  })
}) 