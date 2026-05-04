import { hashPassword } from '@/lib/password';
import { DatabaseService } from '@/lib/database';

// Test account configurations
export interface TestAccount {
  id?: string;
  email: string;
  password: string;
  fullName: string;
  loginUrl: string;
  created?: boolean;
  error?: string;
}

export interface TestAccountResult {
  success: boolean;
  message: string;
  accounts: TestAccount[];
}

// Pre-defined test accounts
const TEST_ACCOUNTS: Omit<TestAccount, 'id' | 'created' | 'error' | 'loginUrl'>[] = [
  {
    email: 'masteradmin@okbuddy.com',
    password: 'okbuddy25!',
    fullName: 'Master Admin - Full Access'
  },
  {
    email: 'okbuddy.test.user@gmail.com',
    password: 'OkBuddy2025!',
    fullName: 'OkBuddy Test User'
  },
  {
    email: 'user1@okbuddy.com',
    password: 'test123',
    fullName: 'Test User 1'
  },
  {
    email: 'user2@okbuddy.com',
    password: 'test123',
    fullName: 'Test User 2'
  },
  {
    email: 'demo@okbuddy.com',
    password: 'demo123',
    fullName: 'Demo User'
  }
];

/**
 * Create test accounts for development and testing
 */
export async function createTestAccounts(): Promise<TestAccountResult> {
  console.log('🔧 Creating test accounts...');
  
  const results: TestAccount[] = [];
  let successCount = 0;

  for (const accountData of TEST_ACCOUNTS) {
    try {
      // Check if account already exists
      const existingUser = await DatabaseService.getUserByEmail(accountData.email);
      
      if (existingUser.success && existingUser.user) {
        console.log(`✅ Account already exists: ${accountData.email}`);
        results.push({
          ...accountData,
          id: existingUser.user.id,
          loginUrl: `/login?email=${encodeURIComponent(accountData.email)}`,
          created: false,
          error: 'Account already exists'
        });
        continue;
      }

      // Hash password
      const passwordResult = await hashPassword(accountData.password);
      if (!passwordResult.success || !passwordResult.hashedPassword) {
        console.error(`❌ Failed to hash password for ${accountData.email}:`, passwordResult.error);
        results.push({
          ...accountData,
          loginUrl: `/login?email=${encodeURIComponent(accountData.email)}`,
          created: false,
          error: passwordResult.error || 'Password hashing failed'
        });
        continue;
      }

      // Create user in database
      const createResult = await DatabaseService.createUser({
        full_name: accountData.fullName,
        email: accountData.email,
        password_hash: passwordResult.hashedPassword,
        email_verified: true // Auto-verify test accounts
      });

      if (createResult.success && createResult.user) {
        console.log(`✅ Created test account: ${accountData.email}`);
        results.push({
          ...accountData,
          id: createResult.user.id,
          loginUrl: `/login?email=${encodeURIComponent(accountData.email)}`,
          created: true
        });
        successCount++;
      } else {
        console.error(`❌ Failed to create account ${accountData.email}:`, createResult.error);
        results.push({
          ...accountData,
          loginUrl: `/login?email=${encodeURIComponent(accountData.email)}`,
          created: false,
          error: createResult.error || 'Database creation failed'
        });
      }

    } catch (error) {
      console.error(`💥 Error creating account ${accountData.email}:`, error);
      results.push({
        ...accountData,
        loginUrl: `/login?email=${encodeURIComponent(accountData.email)}`,
        created: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  const message = `Test accounts processing complete. Created: ${successCount}/${TEST_ACCOUNTS.length}`;
  console.log(message);

  return {
    success: successCount > 0,
    message,
    accounts: results
  };
}

/**
 * Get information about test accounts
 */
export function getTestAccountInfo(): TestAccount[] {
  return TEST_ACCOUNTS.map(account => ({
    ...account,
    loginUrl: `/login?email=${encodeURIComponent(account.email)}`
  }));
}

/**
 * Verify if an email belongs to a test account
 */
export function verifyTestAccount(email: string): boolean {
  return TEST_ACCOUNTS.some(account => account.email === email);
}

/**
 * Get test account credentials for automated testing
 */
export function getTestAccountCredentials(): Array<{ email: string; password: string; fullName: string }> {
  return TEST_ACCOUNTS.map(account => ({
    email: account.email,
    password: account.password,
    fullName: account.fullName
  }));
}

/**
 * Clean up test accounts (for testing purposes)
 */
export async function cleanupTestAccounts(): Promise<{ success: boolean; message: string; cleaned: number }> {
  console.log('🧹 Cleaning up test accounts...');
  
  let cleanedCount = 0;
  
  for (const account of TEST_ACCOUNTS) {
    try {
      // Note: This would require a delete method in DatabaseService
      // For now, just log what would be deleted
      console.log(`🗑️ Would delete test account: ${account.email}`);
      cleanedCount++;
    } catch (error) {
      console.error(`❌ Error cleaning up ${account.email}:`, error);
    }
  }

  return {
    success: cleanedCount > 0,
    message: `Test account cleanup complete. Would clean: ${cleanedCount}/${TEST_ACCOUNTS.length}`,
    cleaned: cleanedCount
  };
}

/**
 * Get a specific test account by email
 */
export function getTestAccountByEmail(email: string): TestAccount | null {
  const account = TEST_ACCOUNTS.find(acc => acc.email === email);
  if (!account) return null;

  return {
    ...account,
    loginUrl: `/login?email=${encodeURIComponent(account.email)}`
  };
} 