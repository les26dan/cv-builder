// Generate bcrypt hash for test user password
const bcrypt = require('bcryptjs');

const password = 'OkBuddy2025!';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  
  console.log('🔐 Password hash for production database:');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('');
  console.log('Use this hash in your SQL INSERT statement or API call');
});