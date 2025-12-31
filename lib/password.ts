import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Configuration
const SALT_LENGTH = 32; // 32 bytes salt
const KEY_LENGTH = 64; // 64 bytes derived key

export interface PasswordResult {
  success: boolean;
  hashedPassword?: string;
  error?: string;
}

export interface VerificationResult {
  success: boolean;
  isValid?: boolean;
  error?: string;
}

/**
 * Hash a password using scrypt with a random salt
 */
export async function hashPassword(password: string): Promise<PasswordResult> {
  try {
    // Validate password
    if (!password || typeof password !== 'string') {
      return {
        success: false,
        error: 'Mật khẩu không hợp lệ'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự'
      };
    }

    if (password.length > 128) {
      return {
        success: false,
        error: 'Mật khẩu quá dài (tối đa 128 ký tự)'
      };
    }

    // Generate a random salt
    const salt = randomBytes(SALT_LENGTH);

    // Derive key using scrypt
    const derivedKey = await scryptAsync(
      password, 
      salt, 
      KEY_LENGTH
    ) as Buffer;

    // Combine salt and derived key
    const hashedPassword = Buffer.concat([salt, derivedKey]).toString('base64');

    return {
      success: true,
      hashedPassword
    };

  } catch (error) {
    console.error('❌ Password hashing error:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi mã hóa mật khẩu'
    };
  }
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<VerificationResult> {
  try {
    // Validate inputs
    if (!password || typeof password !== 'string') {
      return {
        success: false,
        error: 'Mật khẩu không hợp lệ'
      };
    }

    if (!hashedPassword || typeof hashedPassword !== 'string') {
      return {
        success: false,
        error: 'Hash mật khẩu không hợp lệ'
      };
    }

    // Decode the stored hash
    let storedBuffer: Buffer;
    try {
      storedBuffer = Buffer.from(hashedPassword, 'base64');
    } catch (error) {
      return {
        success: false,
        error: 'Định dạng hash mật khẩu không hợp lệ'
      };
    }

    // Check if the buffer has the correct length
    if (storedBuffer.length !== SALT_LENGTH + KEY_LENGTH) {
      return {
        success: false,
        error: 'Kích thước hash mật khẩu không hợp lệ'
      };
    }

    // Extract salt and stored key
    const salt = storedBuffer.subarray(0, SALT_LENGTH);
    const storedKey = storedBuffer.subarray(SALT_LENGTH);

    // Derive key from the provided password
    const derivedKey = await scryptAsync(
      password, 
      salt, 
      KEY_LENGTH
    ) as Buffer;

    // Compare keys using timing-safe comparison
    const isValid = timingSafeEqual(storedKey, derivedKey);

    return {
      success: true,
      isValid
    };

  } catch (error) {
    console.error('❌ Password verification error:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi xác thực mật khẩu'
    };
  }
}

/**
 * Validate password strength (for client-side checks)
 */
export function validatePasswordStrength(password: string): { 
  isValid: boolean; 
  errors: string[]; 
  strength: 'weak' | 'fair' | 'good' | 'strong' 
} {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Mật khẩu là bắt buộc');
    return { isValid: false, errors, strength: 'weak' };
  }

  if (password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  }

  if (password.length > 128) {
    errors.push('Mật khẩu quá dài (tối đa 128 ký tự)');
  }

  // Calculate strength
  let strengthScore = 0;
  
  if (password.length >= 8) strengthScore++;
  if (/[a-z]/.test(password)) strengthScore++;
  if (/[A-Z]/.test(password)) strengthScore++;
  if (/[0-9]/.test(password)) strengthScore++;
  if (/[^a-zA-Z0-9]/.test(password)) strengthScore++;

  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (strengthScore < 2) strength = 'weak';
  else if (strengthScore < 3) strength = 'fair';
  else if (strengthScore < 4) strength = 'good';
  else strength = 'strong';

  const isValid = errors.length === 0;

  return { isValid, errors, strength };
} 