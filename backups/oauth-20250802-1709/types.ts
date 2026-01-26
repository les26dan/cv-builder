// OAuth Provider Configuration
export interface OAuthProvider {
  name: 'google' | 'linkedin';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

// OAuth User Profile (normalized across providers)
export interface OAuthUserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  provider: 'google' | 'linkedin';
  providerData: Record<string, any>;
}

// OAuth Authentication Result
export interface OAuthResult {
  success: boolean;
  action: 'login' | 'register' | 'link';
  user?: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
    signupMethod: string;
    linkedProviders: string[];
  };
  isNewAccount: boolean;
  error?: OAuthError;
}

// OAuth Error Types
export interface OAuthError {
  code: string;
  message: string;
  provider: string;
  userMessage: string;
  retryable: boolean;
}

// OAuth Token Response
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

// OAuth State Data
export interface StateData {
  timestamp: number;
  userId?: string;
  provider: string;
  returnUrl?: string;
  csrfToken: string;
}

// Account Linking Result
export interface AccountLinkingResult {
  action: 'login' | 'register' | 'link';
  user: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
    signupMethod: string;
    linkedProviders: string[];
  };
  isNewAccount: boolean;
  linkedProviders: string[];
}

// OAuth Provider Interface
export interface IOAuthProvider {
  name: string;
  buildAuthUrl(state: string): Promise<string>;
  exchangeCode(code: string): Promise<TokenResponse>;
  fetchUserProfile(accessToken: string): Promise<OAuthUserProfile>;
  validateToken(token: string): Promise<boolean>;
}

// Google-specific types
export interface GoogleTokenResponse extends TokenResponse {
  id_token: string;
}

export interface GoogleUserProfile {
  sub?: string;           // From ID token
  id?: string;            // From userinfo API  
  email: string;
  email_verified?: boolean;    // From userinfo API
  verified_email?: boolean;    // Alternative field name
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale?: string;
}

// LinkedIn-specific types
export interface LinkedInTokenResponse extends TokenResponse {
  // LinkedIn doesn't provide ID token
}

export interface LinkedInProfile {
  id: string;
  firstName: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  lastName: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  profilePicture?: {
    displayImage: string;
  };
}

export interface LinkedInEmailResponse {
  elements: Array<{
    handle: string;
    'handle~': {
      emailAddress: string;
    };
  }>;
}

// Database types for OAuth provider linking
export interface UserOAuthProvider {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  providerEmail: string;
  providerData: Record<string, any>;
  linkedAt: Date;
  lastUsedAt: Date;
}

// OAuth Session data
export interface OAuthSession {
  id: string;
  userId?: string;
  provider: string;
  stateToken: string;
  csrfToken: string;
  returnUrl?: string;
  createdAt: Date;
  expiresAt: Date;
} 