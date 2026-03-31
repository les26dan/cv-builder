#!/usr/bin/env node

/**
 * Admin Credits Fix Script
 * Runs the SQL fix to ensure all admin accounts have AI credits initialized
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function runAdminCreditsFix() {
  console.log('🔧 Running Admin Credits Fix...\n')

  // Load environment variables
  require('dotenv').config({ path: '.env.local' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Read the SQL fix file
    const sqlPath = path.join(__dirname, 'fix-admin-credits.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 Loaded SQL fix from:', sqlPath)
    console.log('📊 SQL content length:', sqlContent.length, 'characters\n')

    // Note: Supabase client doesn't support running raw SQL with multiple statements
    // We'll need to run the key parts manually

    console.log('🔍 Step 1: Checking current users without AI credits...')
    
    const { data: usersWithoutCredits, error: checkError } = await supabase
      .from('users')
      .select('id, email, full_name, ai_credits_balance, ai_credits_used, ai_credits_purchased')
      .or('ai_credits_balance.is.null,ai_credits_used.is.null,ai_credits_purchased.is.null')

    if (checkError) {
      console.error('❌ Error checking users:', checkError.message)
      process.exit(1)
    }

    console.log(`📊 Found ${usersWithoutCredits?.length || 0} users without proper AI credits`)

    if (usersWithoutCredits && usersWithoutCredits.length > 0) {
      console.log('\n👥 Users needing credits fix:')
      usersWithoutCredits.forEach(user => {
        console.log(`   - ${user.email} (${user.full_name})`)
        console.log(`     Balance: ${user.ai_credits_balance}, Used: ${user.ai_credits_used}, Purchased: ${user.ai_credits_purchased}`)
      })

      console.log('\n🔧 Step 2: Fixing users without AI credits...')
      
      // Update users without proper AI credits
      const { data: updateResult, error: updateError } = await supabase
        .from('users')
        .update({
          ai_credits_balance: 5,
          ai_credits_used: 0,
          ai_credits_purchased: 0,
          credits_updated_at: new Date().toISOString()
        })
        .or('ai_credits_balance.is.null,ai_credits_used.is.null,ai_credits_purchased.is.null')
        .select()

      if (updateError) {
        console.error('❌ Error updating users:', updateError.message)
        process.exit(1)
      }

      console.log(`✅ Updated ${updateResult?.length || 0} users with AI credits`)
    } else {
      console.log('✅ All users already have AI credits initialized')
    }

    console.log('\n🔍 Step 3: Verifying admin users specifically...')
    
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, full_name, ai_credits_balance, ai_credits_used, ai_credits_purchased, created_at')
      .or('email.ilike.%admin%,email.ilike.%okbuddy%')
      .order('created_at', { ascending: false })

    if (adminError) {
      console.error('❌ Error checking admin users:', adminError.message)
      process.exit(1)
    }

    console.log(`\n👑 Admin Users Status (${adminUsers?.length || 0} found):`)
    if (adminUsers && adminUsers.length > 0) {
      adminUsers.forEach(user => {
        console.log(`   📧 ${user.email}`)
        console.log(`      Name: ${user.full_name}`)
        console.log(`      Credits: ${user.ai_credits_balance} (Used: ${user.ai_credits_used}, Purchased: ${user.ai_credits_purchased})`)
        console.log(`      Created: ${new Date(user.created_at).toLocaleString()}`)
        console.log('')
      })
    } else {
      console.log('   No admin users found')
    }

    console.log('🎉 Admin Credits Fix Complete!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Test login with admin account')
    console.log('   2. Verify credits counter shows proper balance')
    console.log('   3. Test AI features work correctly')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  }
}

// Run the fix
runAdminCreditsFix().catch(console.error)
