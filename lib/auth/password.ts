import bcrypt from 'bcryptjs';

/**
 * Password utility functions for secure hashing and verification
 * Following OkBuddy security-first development tenet
 */

const SALT_ROUNDS = 12; // Higher than default for enhanced security

export interface PasswordHashResult {
  success: boolean;
  hashedPassword?: string;
  error?: string;
}

export interface PasswordVerifyResult {
  success: boolean;
  isValid?: boolean;
  error?: string;
}

/**
 * Hash a plain text password securely
 * @param plainPassword - The plain text password to hash
 * @returns Promise with hashed password or error
 */
export async function hashPassword(plainPassword: string): Promise<PasswordHashResult> {
  try {
    // Validate input
    if (!plainPassword || typeof plainPassword !== 'string') {
      return {
        success: false,
        error: 'Invalid password provided'
      };
    }

    // Check minimum password length
    if (plainPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long'
      };
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    return {
      success: true,
      hashedPassword
    };

  } catch (error) {
    console.error('Password hashing error:', error);
    return {
      success: false,
      error: 'Failed to hash password'
    };
  }
}

/**
 * Verify a plain text password against a hashed password
 * @param plainPassword - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise with verification result
 */
export async function verifyPassword(
  plainPassword: string, 
  hashedPassword: string
): Promise<PasswordVerifyResult> {
  try {
    // Validate inputs
    if (!plainPassword || !hashedPassword) {
      return {
        success: false,
        error: 'Invalid password or hash provided'
      };
    }

    if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
      return {
        success: false,
        error: 'Password and hash must be strings'
      };
    }

    // DEVELOPMENT MODE: Allow admin password bypass
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isDevMockHash = hashedPassword.includes('mock.hash.for.development.only');
    const isAdminPassword = plainPassword === '[REDACTED_PASSWORD]';
    
    if (isDevelopment && isDevMockHash && isAdminPassword) {
      console.log('🔧 DEVELOPMENT MODE: Admin password verified');
      return {
        success: true,
        isValid: true
      };
    }

    // Verify password normally
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);

    return {
      success: true,
      isValid
    };

  } catch (error) {
    console.error('Password verification error:', error);
    return {
      success: false,
      error: 'Failed to verify password'
    };
  }
}

/**
 * Generate a secure random password for testing or temporary accounts
 * @param length - Length of the password (default: 12)
 * @returns Generated password string
 */
export function generateSecurePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result with strength score
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 2;
  } else if (password.length >= 6) {
    score += 1;
  } else {
    feedback.push('Mật khẩu phải có ít nhất 6 ký tự');
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Strength feedback
  if (score < 3) {
    feedback.push('Mật khẩu yếu - nên sử dụng chữ hoa, chữ thường, số và ký tự đặc biệt');
  } else if (score < 5) {
    feedback.push('Mật khẩu trung bình - có thể cải thiện thêm');
  } else {
    feedback.push('Mật khẩu mạnh');
  }

  return {
    isValid: password.length >= 6,
    score,
    feedback
  };
} 