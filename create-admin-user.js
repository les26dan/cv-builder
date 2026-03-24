#!/usr/bin/env node

/**
 * Create Admin User Script for OkBuddy
 * Creates the admin user in the production Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Supabase configuration
const SUPABASE_URL = 'https://REDACTED_SUPABASE_PROJECT_ID.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dWJhbGxkY2JpYnlzb21oZGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU4NzM5MCwiZXhwIjoyMDY5MTYzMzkwfQ.REDACTED_SUPABASE_SERVICE_JWT';

// Admin user configuration
const ADMIN_USER = {
  full_name: 'Admin Buddy',
  email: 'admin@example.com',
  password: '[REDACTED_PASSWORD]',
  email_verified: true
};

async function createAdminUser() {
  console.log('🚀 Starting admin user creation...');
  
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('🔍 Testing database connection...');
    
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check if admin user already exists
    console.log('🔍 Checking if admin user already exists...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', ADMIN_USER.email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking for existing user:', checkError.message);
      return;
    }
    
    if (existingUser) {
      console.log('✅ Admin user already exists:', existingUser.email);
      console.log('📊 User details:', {
        id: existingUser.id,
        fullName: existingUser.full_name,
        email: existingUser.email,
        emailVerified: existingUser.email_verified,
        createdAt: existingUser.created_at
      });
      return;
    }
    
    // Hash the password
    console.log('🔒 Hashing password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(ADMIN_USER.password, saltRounds);
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        full_name: ADMIN_USER.full_name,
        email: ADMIN_USER.email,
        password_hash: passwordHash,
        email_verified: ADMIN_USER.email_verified
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create admin user:', createError.message);
      return;
    }
    
    console.log('🎉 Admin user created successfully!');
    console.log('📊 User details:', {
      id: newUser.id,
      fullName: newUser.full_name,
      email: newUser.email,
      emailVerified: newUser.email_verified,
      createdAt: newUser.created_at
    });
    
    console.log('');
    console.log('✅ Setup complete! You can now log in with:');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: [REDACTED_PASSWORD]');
    console.log('');
    console.log('🌐 Login URL: http://localhost:3000/login');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Check if required tables exist
async function checkTables() {
  console.log('🔍 Checking database schema...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "users" does not exist')) {
        console.log('❌ Users table does not exist!');
        console.log('📋 Please run the database schema setup first:');
        console.log('   1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/REDACTED_SUPABASE_PROJECT_ID');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Run the schema from: docs/database-schema.sql');
        return false;
      } else {
        console.error('❌ Database error:', error.message);
        return false;
      }
    }
    
    console.log('✅ Database schema is ready');
    return true;
  } catch (err) {
    console.error('💥 Error checking tables:', err.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║       OkBuddy Admin User Setup       ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');
  
  // Check if tables exist
  const tablesExist = await checkTables();
  if (!tablesExist) {
    return;
  }
  
  // Create admin user
  await createAdminUser();
}

// Run the script
main().catch(console.error);
