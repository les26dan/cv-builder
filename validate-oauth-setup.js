#!/usr/bin/env node

// OAuth Setup Validation Script for OkBuddy
console.log('🔍 Validating OAuth Setup...\n');

const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'OAUTH_STATE_SECRET',
  'OAUTH_CSRF_SECRET'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = value && !value.includes('SETUP_REQUIRED') && !value.includes('your-');
  
  console.log(`${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'SET' : 'MISSING OR PLACEHOLDER'}`);
  
  if (!isSet) allGood = false;
});

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🚀 ALL OAUTH CREDENTIALS CONFIGURED!');
  console.log('✅ You can now test OAuth flows at: http://localhost:3000/login');
} else {
  console.log('⚠️  OAUTH SETUP INCOMPLETE');
  console.log('📋 Follow instructions in: OAUTH_SETUP_INSTRUCTIONS.md');
  console.log('🔗 Google Setup: https://console.cloud.google.com/');
  console.log('🔗 LinkedIn Setup: https://www.linkedin.com/developers/apps');
}

console.log('\n🔄 After updating .env.local, restart server with: ./stop-server && ./start-server');