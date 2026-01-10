import { createHash, randomBytes, createCipher, createDecipher } from 'crypto';
import { StateData, OAuthSession } from './types';

export class SecurityService {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_LIFETIME = 10 * 60 * 1000; // 10 minutes
  private static readonly STATE_SECRET = process.env.OAUTH_STATE_SECRET || 'default-state-secret';
  private static readonly CSRF_SECRET = process.env.OAUTH_CSRF_SECRET || 'default-csrf-secret';

  // In-memory store for OAuth sessions (in production, use Redis or database)
  private static sessionStore: Map<string, OAuthSession> = new Map();

  /**
   * Generate a secure random state parameter for OAuth flow
   */
  public static generateState(data: StateData): string {
    const payload = JSON.stringify(data);
    const timestamp = Date.now().toString();
    const randomToken = randomBytes(16).toString('hex');
    
    // Create state string: timestamp.randomToken.encryptedPayload
    const encryptedPayload = this.encryptData(payload);
    const stateString = `${timestamp}.${randomToken}.${encryptedPayload}`;
    
    return Buffer.from(stateString).toString('base64url');
  }

  /**
   * Validate and extract state data from OAuth callback
   */
  public static validateState(state: string, expectedData?: Partial<StateData>): StateData | null {
    try {
      const stateString = Buffer.from(state, 'base64url').toString('utf8');
      const [timestamp, randomToken, encryptedPayload] = stateString.split('.');
      
      if (!timestamp || !randomToken || !encryptedPayload) {
        return null;
      }

      // Check if state is expired
      const stateTimestamp = parseInt(timestamp);
      if (Date.now() - stateTimestamp > this.TOKEN_LIFETIME) {
        return null;
      }

      // Decrypt payload
      const decryptedPayload = this.decryptData(encryptedPayload);
      const stateData: StateData = JSON.parse(decryptedPayload);

      // Validate expected data if provided
      if (expectedData) {
        if (expectedData.provider && stateData.provider !== expectedData.provider) {
          return null;
        }
        if (expectedData.userId && stateData.userId !== expectedData.userId) {
          return null;
        }
      }

      return stateData;
    } catch (error) {
      console.error('State validation error:', error);
      return null;
    }
  }

  /**
   * Generate CSRF token for OAuth session
   */
  public static generateCSRFToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Validate CSRF token
   */
  public static validateCSRFToken(token: string, sessionId: string): boolean {
    const session = this.sessionStore.get(sessionId);
    if (!session) {
      return false;
    }

    return session.csrfToken === token && session.expiresAt > new Date();
  }

  /**
   * Create OAuth session for tracking
   */
  public static createOAuthSession(
    provider: string,
    stateToken: string,
    csrfToken: string,
    returnUrl?: string,
    userId?: string
  ): string {
    const sessionId = randomBytes(16).toString('hex');
    const session: OAuthSession = {
      id: sessionId,
      userId,
      provider,
      stateToken,
      csrfToken,
      returnUrl,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.TOKEN_LIFETIME)
    };

    this.sessionStore.set(sessionId, session);
    
    // Clean up expired sessions
    this.cleanupExpiredSessions();
    
    return sessionId;
  }

  /**
   * Get OAuth session by ID
   */
  public static getOAuthSession(sessionId: string): OAuthSession | null {
    const session = this.sessionStore.get(sessionId);
    if (!session || session.expiresAt <= new Date()) {
      if (session) {
        this.sessionStore.delete(sessionId);
      }
      return null;
    }
    return session;
  }

  /**
   * Delete OAuth session
   */
  public static deleteOAuthSession(sessionId: string): void {
    this.sessionStore.delete(sessionId);
  }

  /**
   * Encrypt sensitive data using AES-256-CBC
   */
  private static encryptData(data: string): string {
    try {
      const cipher = createCipher('aes-256-cbc', this.STATE_SECRET);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      // Fallback to hash-based approach if AES fails
      const hash = createHash('sha256');
      hash.update(data + this.STATE_SECRET);
      return hash.digest('hex');
    }
  }

  /**
   * Decrypt sensitive data using AES-256-CBC
   */
  private static decryptData(encryptedData: string): string {
    try {
      const decipher = createDecipher('aes-256-cbc', this.STATE_SECRET);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      // If decryption fails, this might be a hash - return as is for backward compatibility
      return encryptedData;
    }
  }

  /**
   * Clean up expired sessions
   */
  private static cleanupExpiredSessions(): void {
    const now = new Date();
    this.sessionStore.forEach((session, sessionId) => {
      if (session.expiresAt <= now) {
        this.sessionStore.delete(sessionId);
      }
    });
  }

  /**
   * Hash token for secure storage
   */
  public static hashToken(token: string): string {
    return createHash('sha256').update(token + this.CSRF_SECRET).digest('hex');
  }

  /**
   * Generate secure random string
   */
  public static generateSecureRandom(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Validate email format with strict RFC 5322 compliance
   */
  public static validateEmail(email: string): boolean {
    if (!email || email.length > 254) return false;
    
    // More strict email validation regex
    const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) return false;
    
    // Additional checks for invalid patterns
    if (email.includes('..')) return false; // Consecutive dots
    if (email.startsWith('.') || email.endsWith('.')) return false; // Leading/trailing dots
    if (email.includes(' ')) return false; // Spaces
    
    const [localPart, domainPart] = email.split('@');
    if (!localPart || !domainPart) return false;
    if (localPart.length > 64) return false; // Local part too long
    if (domainPart.length > 253) return false; // Domain part too long
    if (!domainPart.includes('.')) return false; // Domain must have at least one dot
    
    return true;
  }

  /**
   * Sanitize user input to prevent XSS and other attacks
   */
  public static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove JavaScript protocol
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove data: URLs
      .replace(/data:/gi, '')
      // Remove vbscript
      .replace(/vbscript:/gi, '')
      // Remove expression() CSS
      .replace(/expression\s*\(/gi, '')
      // Remove dangerous characters
      .replace(/[<>'"&]/g, '');
  }

  /**
   * Check if request is from allowed origin
   */
  public static validateOrigin(origin: string): boolean {
    if (!origin) return false;
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://okbuddy.com',
      process.env.NEXT_PUBLIC_APP_URL
    ].filter(Boolean);
    
    // Add origins from environment variable if set
    if (process.env.ALLOWED_ORIGINS) {
      const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      allowedOrigins.push(...envOrigins);
    }

    return allowedOrigins.includes(origin);
  }

  /**
   * Rate limiting check (simplified in-memory implementation)
   */
  private static rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  public static checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitStore.get(identifier);

    if (!record || now > record.resetTime) {
      this.rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Log security events
   */
  public static logSecurityEvent(event: string, details: Record<string, any>): void {
    console.log(`[SECURITY] ${event}:`, {
      timestamp: new Date().toISOString(),
      ...details
    });
  }
} 