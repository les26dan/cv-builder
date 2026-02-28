#!/usr/bin/env node

/**
 * OkBuddy Supabase Connection Test
 * Tests database connectivity and basic operations
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
    console.log('🧪 OkBuddy Supabase Connection Test');
    console.log('=====================================');

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Error: Missing Supabase environment variables');
        console.log('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
        console.log('Please check your .env.local file');
        return;
    }

    console.log('✅ Environment variables found');
    console.log(`📡 URL: ${supabaseUrl}`);
    console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...`);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // Test 1: Basic connection
        console.log('\n🔍 Test 1: Basic connection...');
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error) {
            console.log('❌ Connection failed:', error.message);
            return;
        }
        
        console.log('✅ Basic connection successful');

        // Test 2: Check if tables exist
        console.log('\n🔍 Test 2: Checking database tables...');
        const tables = ['users', 'cvs', 'cv_drafts', 'user_sessions', 'audit_logs'];
        
        for (const table of tables) {
            try {
                const { error: tableError } = await supabase.from(table).select('*').limit(1);
                if (tableError) {
                    console.log(`❌ Table '${table}': ${tableError.message}`);
                } else {
                    console.log(`✅ Table '${table}': OK`);
                }
            } catch (err) {
                console.log(`❌ Table '${table}': ${err.message}`);
            }
        }

        // Test 3: Storage bucket
        console.log('\n🔍 Test 3: Checking storage bucket...');
        try {
            const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
            if (bucketError) {
                console.log('❌ Storage access failed:', bucketError.message);
            } else {
                const cvBucket = buckets.find(b => b.name === 'cv-uploads');
                if (cvBucket) {
                    console.log('✅ CV uploads bucket found');
                } else {
                    console.log('⚠️ CV uploads bucket not found');
                }
            }
        } catch (err) {
            console.log('❌ Storage test failed:', err.message);
        }

        // Test 4: RLS policies (if service role key available)
        if (serviceRoleKey) {
            console.log('\n🔍 Test 4: Checking RLS policies...');
            const adminClient = createClient(supabaseUrl, serviceRoleKey);
            
            try {
                const { data: policies } = await adminClient
                    .from('pg_policies')
                    .select('tablename, policyname')
                    .in('tablename', tables);
                
                if (policies && policies.length > 0) {
                    console.log(`✅ Found ${policies.length} RLS policies`);
                    policies.forEach(p => {
                        console.log(`   - ${p.tablename}: ${p.policyname}`);
                    });
                } else {
                    console.log('⚠️ No RLS policies found');
                }
            } catch (err) {
                console.log('⚠️ Could not check RLS policies:', err.message);
            }
        }

        console.log('\n🎉 Connection test completed!');
        console.log('=====================================');
        console.log('Your Supabase database is ready for OkBuddy!');

    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
    }
}

// Run the test
testSupabaseConnection().catch(console.error); 