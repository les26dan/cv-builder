#!/usr/bin/env tsx

/**
 * Admin Account Creation Script
 * Creates an admin user with full access permissions
 * 
 * Usage: npx tsx scripts/create-admin.ts
 */

import { hashPassword } from '../lib/password'
import { DatabaseService } from '../lib/database'

async function createAdminAccount() {
  console.log('🔧 Creating admin account...')

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim()
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD

  if (!email || !password) {
    console.error('❌ Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (e.g. in .env.local)')
    process.exit(1)
  }

  const adminData = {
    fullName: process.env.BOOTSTRAP_ADMIN_FULL_NAME?.trim() || 'Admin User',
    email,
    password,
    tosAccepted: true,
    role: 'admin' // Admin role
  }

  try {
    // Hash the password
    console.log('🔐 Hashing password...')
    const passwordResult = await hashPassword(adminData.password)
    
    if (!passwordResult.success || !passwordResult.hashedPassword) {
      console.error('❌ Failed to hash password:', passwordResult.error)
      return
    }

    // Check if admin user already exists
    console.log('🔍 Checking if admin user already exists...')
    const existingUser = await DatabaseService.getUserByEmail(adminData.email)
    
    if (existingUser.success && existingUser.user) {
      console.log('⚠️  Admin user already exists!')
      console.log('📧 Email:', existingUser.user.email)
      console.log('👤 Name:', existingUser.user.full_name)
      console.log('📅 Created:', existingUser.user.created_at)
      return
    }

    // Create the admin user
    console.log('👤 Creating admin user...')
    const createResult = await DatabaseService.createUser({
      full_name: adminData.fullName,
      email: adminData.email,
      password_hash: passwordResult.hashedPassword,
      email_verified: true // Admin is automatically verified
    })

    if (!createResult.success) {
      console.error('❌ Failed to create admin user:', createResult.error)
      return
    }

    console.log('✅ Admin account created successfully!')
    console.log('')
    console.log('📋 Admin Account Details:')
    console.log('  👤 Name:', adminData.fullName)
    console.log('  📧 Email:', adminData.email)
    console.log('  🆔 User ID:', createResult.user?.id)
    console.log('  🔑 Password:', adminData.password)
    console.log('  ✅ Email Verified:', true)
    console.log('  👑 Role: Admin (Full Access)')
    console.log('')
    console.log('🔐 Login credentials:')
    console.log(`  ID: ${adminData.email}`)
    console.log(`  PW: ${adminData.password}`)
    console.log('')
    console.log('🌐 You can now login at: http://localhost:3000/login/')

  } catch (error) {
    console.error('💥 Error creating admin account:', error)
  }
}

// Run the script
createAdminAccount().catch(console.error) 