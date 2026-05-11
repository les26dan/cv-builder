#!/usr/bin/env node

/**
 * CV Builder Direct Schema Deployment
 * Uses service role key to deploy database schema directly
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function deploySchema() {
    console.log('🚀 CV Builder Database Schema Deployment');
    console.log('====================================');

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.log('❌ Error: Missing Supabase environment variables');
        console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
        return;
    }

    console.log('✅ Environment variables found');
    console.log(`📡 URL: ${supabaseUrl}`);

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        console.log('\n🗄️ Deploying database schema...');

        // Read the schema file
        const schemaPath = path.join(__dirname, '..', 'docs', 'database-schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split into individual statements
        const statements = schemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📋 Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            
            // Skip comments and empty statements
            if (statement.startsWith('--') || statement.trim() === ';') {
                continue;
            }

            try {
                console.log(`   ${i + 1}/${statements.length}: Executing...`);
                
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: statement
                });

                if (error) {
                    // Some errors are expected (like "already exists")
                    if (error.message.includes('already exists') || 
                        error.message.includes('does not exist')) {
                        console.log(`   ⚠️  ${error.message} (continuing...)`);
                    } else {
                        console.log(`   ❌ Error: ${error.message}`);
                    }
                } else {
                    console.log(`   ✅ Success`);
                }
            } catch (err) {
                console.log(`   ❌ Error executing statement: ${err.message}`);
            }
        }

        console.log('\n🔍 Verifying deployment...');
        
        // Check if core tables exist
        const tables = ['users', 'cvs', 'cv_drafts', 'user_sessions', 'audit_logs'];
        let tablesFound = 0;

        for (const table of tables) {
            try {
                const { error } = await supabase.from(table).select('*').limit(1);
                if (!error) {
                    console.log(`✅ Table '${table}': Found`);
                    tablesFound++;
                } else {
                    console.log(`❌ Table '${table}': ${error.message}`);
                }
            } catch (err) {
                console.log(`❌ Table '${table}': ${err.message}`);
            }
        }

        console.log('\n🎉 Schema deployment completed!');
        console.log(`✅ Tables created: ${tablesFound}/${tables.length}`);
        
        if (tablesFound === tables.length) {
            console.log('🎯 All tables successfully deployed!');
            console.log('\n📋 Next steps:');
            console.log('1. Run: npm run dev');
            console.log('2. Test user registration');
            console.log('3. Test CV creation and upload');
        } else {
            console.log('⚠️  Some tables may not have been created properly');
            console.log('You may need to run the SQL manually in Supabase dashboard');
        }

    } catch (error) {
        console.log('❌ Deployment failed:', error.message);
        console.log('\n🔧 Alternative: Manual deployment');
        console.log('1. Go to: https://supabase.com/dashboard/project/REDACTED_SUPABASE_PROJECT_ID/sql');
        console.log('2. Copy contents of docs/database-schema.sql');
        console.log('3. Paste and run in SQL editor');
    }
}

deploySchema().catch(console.error); 