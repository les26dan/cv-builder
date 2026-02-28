import { 
  hashPassword, 
  verifyPassword, 
  generateSecurePassword, 
  validatePasswordStrength 
} from '../password';

describe('Password Service', () => {
  describe('hashPassword', () => {
    it('should hash a valid password successfully', async () => {
      const plainPassword = 'testpassword123';
      const result = await hashPassword(plainPassword);

      expect(result.success).toBe(true);
      expect(result.hashedPassword).toBeDefined();
      expect(result.hashedPassword).not.toBe(plainPassword);
      expect(result.hashedPassword?.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
      expect(result.error).toBeUndefined();
    });

    it('should reject passwords shorter than 6 characters', async () => {
      const shortPassword = '12345';
      const result = await hashPassword(shortPassword);

      expect(result.success).toBe(false);
      expect(result.hashedPassword).toBeUndefined();
      expect(result.error).toBe('Password must be at least 6 characters long');
    });

    it('should reject empty or null passwords', async () => {
      const emptyResult = await hashPassword('');
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toBe('Invalid password provided');

      // @ts-ignore - Testing runtime behavior
      const nullResult = await hashPassword(null);
      expect(nullResult.success).toBe(false);
      expect(nullResult.error).toBe('Invalid password provided');
    });

    it('should reject non-string passwords', async () => {
      // @ts-ignore - Testing runtime behavior
      const numberResult = await hashPassword(123456);
      expect(numberResult.success).toBe(false);
      expect(numberResult.error).toBe('Invalid password provided');
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'samepassword123';
      const result1 = await hashPassword(password);
      const result2 = await hashPassword(password);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.hashedPassword).not.toBe(result2.hashedPassword);
    });

    it('should handle Vietnamese characters in passwords', async () => {
      const vietnamesePassword = 'mậtkhẩu123';
      const result = await hashPassword(vietnamesePassword);

      expect(result.success).toBe(true);
      expect(result.hashedPassword).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password successfully', async () => {
      const plainPassword = 'testpassword123';
      const hashResult = await hashPassword(plainPassword);
      
      expect(hashResult.success).toBe(true);
      
      const verifyResult = await verifyPassword(plainPassword, hashResult.hashedPassword!);
      
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.isValid).toBe(true);
      expect(verifyResult.error).toBeUndefined();
    });

    it('should reject incorrect password', async () => {
      const correctPassword = 'correctpassword123';
      const wrongPassword = 'wrongpassword123';
      
      const hashResult = await hashPassword(correctPassword);
      expect(hashResult.success).toBe(true);
      
      const verifyResult = await verifyPassword(wrongPassword, hashResult.hashedPassword!);
      
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.isValid).toBe(false);
    });

    it('should handle empty or invalid inputs', async () => {
      const validHash = '$2a$12$example.hash.string.here';
      
      const emptyPasswordResult = await verifyPassword('', validHash);
      expect(emptyPasswordResult.success).toBe(false);
      expect(emptyPasswordResult.error).toBe('Invalid password or hash provided');

      const emptyHashResult = await verifyPassword('password', '');
      expect(emptyHashResult.success).toBe(false);
      expect(emptyHashResult.error).toBe('Invalid password or hash provided');
    });

    it('should handle non-string inputs', async () => {
      const validHash = '$2a$12$example.hash.string.here';
      
      // @ts-ignore - Testing runtime behavior
      const numberPasswordResult = await verifyPassword(123, validHash);
      expect(numberPasswordResult.success).toBe(false);
      expect(numberPasswordResult.error).toBe('Password and hash must be strings');
    });

    it('should verify Vietnamese password correctly', async () => {
      const vietnamesePassword = 'mậtkhẩu123';
      const hashResult = await hashPassword(vietnamesePassword);
      
      expect(hashResult.success).toBe(true);
      
      const verifyResult = await verifyPassword(vietnamesePassword, hashResult.hashedPassword!);
      
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.isValid).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password with default length', () => {
      const password = generateSecurePassword();
      
      expect(password).toBeDefined();
      expect(password.length).toBe(12);
      expect(typeof password).toBe('string');
    });

    it('should generate password with custom length', () => {
      const customLength = 16;
      const password = generateSecurePassword(customLength);
      
      expect(password.length).toBe(customLength);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      
      expect(password1).not.toBe(password2);
    });

    it('should contain variety of characters', () => {
      const password = generateSecurePassword(50); // Longer password for better testing
      
      expect(/[a-z]/.test(password)).toBe(true); // lowercase
      expect(/[A-Z]/.test(password)).toBe(true); // uppercase
      expect(/[0-9]/.test(password)).toBe(true); // numbers
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const strongPassword = 'StrongP@ssw0rd123';
      const result = validatePasswordStrength(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(5);
      expect(result.feedback).toContain('Mật khẩu mạnh');
    });

    it('should identify weak password', () => {
      const weakPassword = 'weak';
      const result = validatePasswordStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(3);
      expect(result.feedback).toContain('Mật khẩu phải có ít nhất 6 ký tự');
    });

    it('should validate medium strength password', () => {
      const mediumPassword = 'password123';
      const result = validatePasswordStrength(mediumPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.score).toBeLessThan(5);
    });

    it('should handle minimum valid password', () => {
      const minPassword = '123456';
      const result = validatePasswordStrength(minPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should provide helpful feedback', () => {
      const simplePassword = 'simple';
      const result = validatePasswordStrength(simplePassword);
      
      expect(result.feedback.length).toBeGreaterThan(0);
      expect(result.feedback.some(f => f.includes('ký tự'))).toBe(true);
    });
  });
}); 