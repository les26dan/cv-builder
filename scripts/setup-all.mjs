/**
 * SETUP SCRIPT - Chạy một lần để setup toàn bộ database + admin account
 * node scripts/setup-all.mjs
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || 'okbuddy2025@gmail.com';
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || '[REDACTED_PASSWORD]';
const ADMIN_NAME = process.env.BOOTSTRAP_ADMIN_NAME || 'Admin Buddy';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}

async function sql(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  // Fallback: exec_sql RPC may not exist, use pg directly via REST
  return res;
}

async function query(table, method = 'GET', body = null, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params}`;
  const res = await fetch(url, {
    method,
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function runSQL(sqlText, label) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql_void`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql: sqlText }),
  });
  if (res.ok) {
    console.log(`  ✅ ${label}`);
    return true;
  }
  // Try pg REST endpoint
  const pgRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/sql',
    },
    body: sqlText,
  });
  console.log(`  ⚠️  ${label} (status ${pgRes.status} — có thể cần chạy SQL thủ công)`);
  return false;
}

console.log('\n🚀 OkBuddy — Setup Database & Admin Account');
console.log('===========================================');
console.log(`📡 Supabase: ${SUPABASE_URL}`);
console.log(`👤 Admin:    ${ADMIN_EMAIL}\n`);

// Step 1: Test connection
console.log('1️⃣  Kiểm tra kết nối Supabase...');
try {
  const probe = await query('users?limit=1');
  if (probe.status === 200 || probe.status === 406) {
    console.log('  ✅ Kết nối thành công\n');
  } else if (probe.status === 404) {
    console.log('  ⚠️  Bảng "users" chưa tồn tại — cần chạy SQL setup\n');
  } else {
    console.log(`  ⚠️  Status: ${probe.status}\n`);
  }
} catch (e) {
  console.error('  ❌ Không thể kết nối:', e.message);
  console.error('\n💡 Kiểm tra:\n  - Có kết nối internet không?\n  - NEXT_PUBLIC_SUPABASE_URL đúng chưa?\n');
  process.exit(1);
}

// Step 2: Check tables
console.log('2️⃣  Kiểm tra bảng database...');
const tables = ['users', 'cv_drafts', 'cv_workflow'];
const missing = [];
for (const t of tables) {
  const r = await query(`${t}?limit=1`);
  if (r.status === 200 || r.status === 406) {
    console.log(`  ✅ ${t}`);
  } else {
    console.log(`  ❌ ${t} — chưa tồn tại`);
    missing.push(t);
  }
}

if (missing.length > 0) {
  console.log('\n⚠️  Các bảng sau chưa tồn tại:', missing.join(', '));
  console.log('\n📋 Chạy SQL sau trong Supabase Dashboard > SQL Editor:\n');
  console.log('━'.repeat(60));
  console.log(readFileSync('./supabase-user-credentials-schema.sql', 'utf-8').substring(0, 200) + '...');
  console.log('\n[Xem file: supabase-user-credentials-schema.sql]');
  console.log('[Xem file: create-cv-tables.sql]');
  console.log('━'.repeat(60));
  console.log('\n👉 Sau khi chạy SQL, chạy lại script này.\n');
} else {
  console.log('  ✅ Tất cả bảng đã tồn tại\n');
}

// Step 3: Setup admin account
console.log('3️⃣  Setup admin account...');
const checkUser = await query(`users?email=eq.${encodeURIComponent(ADMIN_EMAIL)}&select=id,email`);

if (checkUser.status === 200 && Array.isArray(checkUser.data) && checkUser.data.length > 0) {
  console.log(`  ✅ Admin đã tồn tại: ${checkUser.data[0].email} (${checkUser.data[0].id})\n`);
} else {
  // Hash password using bcrypt via node
  let bcrypt;
  try {
    bcrypt = require('./node_modules/bcryptjs');
  } catch {
    console.log('  ⚠️  bcryptjs không load được, dùng placeholder hash');
    bcrypt = null;
  }

  let passwordHash;
  if (bcrypt) {
    passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  } else {
    console.error('  ❌ Không thể hash password. Cài bcryptjs: npm install bcryptjs');
    process.exit(1);
  }

  const createResult = await query('users', 'POST', {
    email: ADMIN_EMAIL,
    full_name: ADMIN_NAME,
    password_hash: passwordHash,
    email_verified: true,
    signup_method: 'email',
    account_status: 'active',
  });

  if (createResult.status === 201 || createResult.status === 200) {
    const user = Array.isArray(createResult.data) ? createResult.data[0] : createResult.data;
    console.log(`  ✅ Admin tạo thành công: ${user.email} (${user.id})\n`);
  } else if (createResult.status === 409 || (typeof createResult.data === 'object' && createResult.data?.code === '23505')) {
    console.log(`  ✅ Admin đã tồn tại (conflict)\n`);
  } else {
    console.log(`  ⚠️  Tạo admin thất bại (${createResult.status}):`, JSON.stringify(createResult.data).substring(0, 100));
    console.log('  💡 Có thể bảng users chưa tồn tại — chạy SQL trước\n');
  }
}

// Step 4: Verify RLS policies allow service role
console.log('4️⃣  Kiểm tra service role access...');
const rlsCheck = await query('users?select=count');
if (rlsCheck.status === 200) {
  console.log('  ✅ Service role có thể đọc bảng users\n');
} else {
  console.log(`  ⚠️  RLS có thể chặn truy cập (${rlsCheck.status}) — kiểm tra policy\n`);
}

// Summary
console.log('━'.repeat(60));
console.log('✅ SETUP HOÀN TẤT\n');
console.log('🔑 Thông tin đăng nhập admin:');
console.log(`   Username: adminbuddy`);
console.log(`   Email:    ${ADMIN_EMAIL}`);
console.log(`   Password: ${ADMIN_PASSWORD}`);
console.log('\n🌐 Chạy app: npm run dev');
console.log('   Mở: http://localhost:3000\n');

if (missing.length > 0) {
  console.log('⚠️  LƯU Ý: Vẫn còn bảng chưa được tạo!');
  console.log('   Chạy SQL trong Supabase Dashboard trước khi dùng app.\n');
}
