#!/usr/bin/env node

/**
 * Database Setup Script for CV Builder
 * Sets up the database with admin user
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  console.log('🔧 Setting up CV Builder database...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.log('SERVICE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Check if users table exists
    console.log('📋 Checking database schema...');
    const { data: tables, error: schemaError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Database schema error:', schemaError.message);
      console.log('💡 Make sure to run the database schema SQL in Supabase dashboard');
      process.exit(1);
    }
    
    console.log('✅ Database schema is ready');
    
    // Check if admin user already exists
    console.log('👤 Checking for admin user...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'okbuddy2025@gmail.com')
      .single();
    
    if (existingUser) {
      console.log('✅ Admin user already exists:', existingUser.email);
      console.log('🔑 User ID:', existingUser.id);
      console.log('📧 Email verified:', existingUser.email_verified);
      return;
    }
    
    // Create admin user
    console.log('🔨 Creating admin user...');
    const passwordHash = await bcrypt.hash('[REDACTED_PASSWORD]', 12);
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        full_name: 'Admin Buddy',
        email: 'okbuddy2025@gmail.com',
        password_hash: passwordHash,
        email_verified: true,
        signup_method: 'email'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create admin user:', createError.message);
      process.exit(1);
    }
    
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email:', newUser.email);
    console.log('🔑 User ID:', newUser.id);
    console.log('👤 Name:', newUser.full_name);
    console.log('✅ Email verified:', newUser.email_verified);
    
    console.log('\\n🔐 Admin Credentials:');
    console.log('Email: okbuddy2025@gmail.com');
    console.log('Password: [REDACTED_PASSWORD]');
    console.log('Username: adminbuddy (alias for email)');
    
  } catch (error) {
    console.error('💥 Setup error:', error);
    process.exit(1);
  }
}

setupDatabase();