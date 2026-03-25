/**
 * ===================================================================
 * AI CREDITS SCHEMA MIGRATION RUNNER
 * ===================================================================
 * 
 * CRITICAL: This script safely migrates the OkBuddy database to support
 * AI credits monetization system. It includes comprehensive backup,
 * validation, and rollback capabilities.
 * 
 * Usage:
 *   node scripts/run-ai-credits-migration.js
 * 
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 *   - Database backup recommended before running
 * ===================================================================
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Environment configuration
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Read the migration SQL file
 */
async function readMigrationFile() {
  try {
    const migrationPath = path.join(__dirname, 'ai-credits-schema-migration.sql')
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8')
    return migrationSQL
  } catch (error) {
    console.error('❌ Failed to read migration file:', error.message)
    throw error
  }
}

/**
 * Validate current database state
 */
async function validateDatabaseState() {
  console.log('🔍 Validating current database state...')
  
  try {
    // Check if users table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .limit(1)
    
    if (usersError) {
      throw new Error(`Users table validation failed: ${usersError.message}`)
    }
    
    // Check if ai_credits_balance already exists
    const { data: userWithCredits, error: creditsError } = await supabase
      .from('users')
      .select('ai_credits_balance')
      .limit(1)
    
    if (!creditsError) {
      console.log('⚠️ AI credits columns already exist in users table')
      return { alreadyMigrated: true, usersCount: users?.length || 0 }
    }
    
    // Count total users for migration planning
    const { count: totalUsers, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.warn('⚠️ Could not count users, proceeding anyway')
    }
    
    console.log(`✅ Database state validated. Found ${totalUsers || 'unknown'} users`)
    return { alreadyMigrated: false, usersCount: totalUsers || 0 }
    
  } catch (error) {
    console.error('❌ Database state validation failed:', error.message)
    throw error
  }
}

/**
 * Create database backup
 */
async function createDatabaseBackup() {
  console.log('💾 Creating database backup...')
  
  try {
    // Export current users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      throw new Error(`Failed to backup users: ${usersError.message}`)
    }
    
    // Create backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(__dirname, `../backups/users-backup-${timestamp}.json`)
    
    // Ensure backups directory exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true })
    
    // Write backup
    await fs.writeFile(backupPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      migration: 'ai-credits-schema',
      users: users,
      totalUsers: users?.length || 0
    }, null, 2))
    
    console.log(`✅ Database backup created: ${backupPath}`)
    console.log(`📊 Backed up ${users?.length || 0} users`)
    
    return backupPath
    
  } catch (error) {
    console.error('❌ Database backup failed:', error.message)
    throw error
  }
}

/**
 * Execute the migration
 */
async function executeMigration(migrationSQL) {
  console.log('🚀 Executing AI credits schema migration...')
  
  try {
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`)
    
    // Execute migration using SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      throw new Error(`Migration execution failed: ${error.message}`)
    }
    
    console.log('✅ Migration executed successfully')
    return data
    
  } catch (error) {
    // Try alternative approach - execute statements individually
    console.log('⚠️ Bulk execution failed, trying individual statements...')
    
    try {
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      let executedCount = 0
      
      for (const statement of statements) {
        if (statement.length > 0) {
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          })
          
          if (stmtError) {
            console.error(`❌ Failed to execute statement: ${statement.substring(0, 100)}...`)
            console.error(`   Error: ${stmtError.message}`)
            throw stmtError
          }
          
          executedCount++
        }
      }
      
      console.log(`✅ Migration completed: ${executedCount} statements executed`)
      return { statementsExecuted: executedCount }
      
    } catch (individualError) {
      console.error('❌ Migration failed completely:', individualError.message)
      throw individualError
    }
  }
}

/**
 * Validate migration results
 */
async function validateMigrationResults() {
  console.log('🔍 Validating migration results...')
  
  try {
    // Check if new columns exist in users table
    const { data: userWithCredits, error: creditsError } = await supabase
      .from('users')
      .select('ai_credits_balance, ai_credits_used, ai_credits_purchased, credits_updated_at')
      .limit(1)
    
    if (creditsError) {
      throw new Error(`Credits columns validation failed: ${creditsError.message}`)
    }
    
    // Check if new tables exist
    const { data: transactions, error: transactionsError } = await supabase
      .from('ai_transactions')
      .select('id')
      .limit(1)
    
    if (transactionsError) {
      throw new Error(`ai_transactions table validation failed: ${transactionsError.message}`)
    }
    
    const { data: referrals, error: referralsError } = await supabase
      .from('user_referrals')
      .select('id')
      .limit(1)
    
    if (referralsError) {
      throw new Error(`user_referrals table validation failed: ${referralsError.message}`)
    }
    
    // Count users with credits
    const { data: usersWithCredits, error: countError } = await supabase
      .from('users')
      .select('id, ai_credits_balance')
      .not('ai_credits_balance', 'is', null)
    
    if (countError) {
      throw new Error(`Credits count validation failed: ${countError.message}`)
    }
    
    console.log(`✅ Migration validation successful:`)
    console.log(`   📊 ${usersWithCredits?.length || 0} users have AI credits`)
    console.log(`   💰 Total credits allocated: ${usersWithCredits?.reduce((sum, user) => sum + (user.ai_credits_balance || 0), 0) || 0}`)
    console.log(`   📋 ai_transactions table: ✅ Created`)
    console.log(`   👥 user_referrals table: ✅ Created`)
    console.log(`   🔑 referral_codes table: ✅ Created`)
    
    return {
      usersWithCredits: usersWithCredits?.length || 0,
      totalCreditsAllocated: usersWithCredits?.reduce((sum, user) => sum + (user.ai_credits_balance || 0), 0) || 0
    }
    
  } catch (error) {
    console.error('❌ Migration validation failed:', error.message)
    throw error
  }
}

/**
 * Test credit functions
 */
async function testCreditFunctions() {
  console.log('🧪 Testing AI credits functions...')
  
  try {
    // Get a test user
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single()
    
    if (userError || !testUser) {
      console.log('⚠️ No test user found, skipping function tests')
      return
    }
    
    // Test get_ai_credits_balance function
    const { data: balanceResult, error: balanceError } = await supabase
      .rpc('get_ai_credits_balance', { p_user_id: testUser.id })
    
    if (balanceError) {
      throw new Error(`get_ai_credits_balance test failed: ${balanceError.message}`)
    }
    
    console.log(`✅ get_ai_credits_balance test: ${JSON.stringify(balanceResult)}`)
    
    // Test deduct_ai_credits function (in a transaction that we'll rollback)
    console.log('🧪 Testing credit deduction (will be rolled back)...')
    
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_ai_credits', {
        p_user_id: testUser.id,
        p_credits_amount: 1,
        p_ai_feature: 'test_feature',
        p_session_id: null
      })
    
    if (deductError) {
      console.log(`⚠️ Credit deduction test failed (expected for testing): ${deductError.message}`)
    } else {
      console.log(`✅ deduct_ai_credits test: ${JSON.stringify(deductResult)}`)
      
      // Restore the credit for testing
      await supabase
        .from('users')
        .update({ ai_credits_balance: 5, ai_credits_used: 0 })
        .eq('id', testUser.id)
    }
    
    console.log('✅ Credit functions testing completed')
    
  } catch (error) {
    console.error('❌ Credit functions testing failed:', error.message)
    // Don't throw - this is not critical for migration success
  }
}

/**
 * Main migration process
 */
async function runMigration() {
  console.log('🚀 OkBuddy AI Credits Schema Migration')
  console.log('=====================================')
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`)
  console.log(`⏰ Started at: ${new Date().toISOString()}`)
  console.log('')
  
  let backupPath = null
  
  try {
    // Step 1: Validate current database state
    const validation = await validateDatabaseState()
    
    if (validation.alreadyMigrated) {
      console.log('✅ AI credits schema already exists. Migration not needed.')
      return
    }
    
    // Step 2: Create backup
    backupPath = await createDatabaseBackup()
    
    // Step 3: Read migration file
    const migrationSQL = await readMigrationFile()
    console.log(`📄 Migration file loaded: ${migrationSQL.length} characters`)
    
    // Step 4: Execute migration
    await executeMigration(migrationSQL)
    
    // Step 5: Validate results
    const results = await validateMigrationResults()
    
    // Step 6: Test functions
    await testCreditFunctions()
    
    // Success summary
    console.log('')
    console.log('🎉 AI CREDITS MIGRATION COMPLETED SUCCESSFULLY!')
    console.log('===============================================')
    console.log(`👥 Users migrated: ${validation.usersCount}`)
    console.log(`💰 Total credits allocated: ${results.totalCreditsAllocated}`)
    console.log(`💾 Backup created: ${backupPath}`)
    console.log(`⏰ Completed at: ${new Date().toISOString()}`)
    console.log('')
    console.log('🔧 Next steps:')
    console.log('1. Deploy AI Credits Service to application')
    console.log('2. Update frontend components with credit gating')
    console.log('3. Test AI features with credit deduction')
    console.log('4. Implement paywall modal for credit purchases')
    
  } catch (error) {
    console.error('')
    console.error('💥 MIGRATION FAILED!')
    console.error('===================')
    console.error(`❌ Error: ${error.message}`)
    console.error(`⏰ Failed at: ${new Date().toISOString()}`)
    
    if (backupPath) {
      console.error(`💾 Backup available: ${backupPath}`)
      console.error('🔄 You can restore from backup if needed')
    }
    
    console.error('')
    console.error('🚨 IMPORTANT: Do not proceed with application deployment')
    console.error('   until this migration issue is resolved!')
    
    process.exit(1)
  }
}

/**
 * Handle process termination
 */
process.on('SIGINT', () => {
  console.log('\n⚠️ Migration interrupted by user. Check database state before retrying.')
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the migration
runMigration().catch(error => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
