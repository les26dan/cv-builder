import { createClient } from '@supabase/supabase-js';

// User interface for database operations
export interface User {
  id?: string;
  full_name: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

// Mock database for development/testing
const mockDatabase = new Map<string, User>();
let mockIdCounter = 1;

// Lazy initialization of Supabase client
let supabaseClient: any = null;
let hasValidCredentials: boolean | null = null;

function initializeDatabase() {
  if (hasValidCredentials !== null) {
    return; // Already initialized
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check if we have valid Supabase credentials
  hasValidCredentials = !!(supabaseUrl && supabaseKey && 
    !supabaseUrl.includes('placeholder') && 
    !supabaseKey.includes('placeholder'));

  if (!hasValidCredentials) {
    if (isTestEnvironment || isDevelopment) {
      console.warn('⚠️ Using mock database - Supabase credentials not configured');
    } else {
      throw new Error('Missing Supabase environment variables');
    }
  }

  supabaseClient = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder-key'
  );
}

// Database service functions
export class DatabaseService {
  /**
   * Save a new user to the database
   */
  static async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      initializeDatabase();

      // If no valid credentials, use mock database
      if (!hasValidCredentials) {
        // Check for duplicate email in mock database
        for (const user of Array.from(mockDatabase.values())) {
          if (user.email === userData.email) {
            return {
              success: false,
              error: 'Email đã được sử dụng. Vui lòng sử dụng email khác.'
            };
          }
        }

        // Create mock user
        const mockUser: User = {
          id: `mock_${mockIdCounter++}`,
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        mockDatabase.set(mockUser.id!, mockUser);
        console.log('✅ Mock user created successfully:', { id: mockUser.id, email: mockUser.email });
        
        return {
          success: true,
          user: mockUser
        };
      }

      // Use real Supabase
      const { data, error } = await supabaseClient
        .from('users')
        .insert([{
          full_name: userData.full_name,
          email: userData.email,
          password_hash: userData.password_hash,
          email_verified: userData.email_verified,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error creating user:', error);
        
        // Handle duplicate email error
        if (error.code === '23505' && error.message.includes('email')) {
          return {
            success: false,
            error: 'Email đã được sử dụng. Vui lòng sử dụng email khác.'
          };
        }
        
        return {
          success: false,
          error: 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.'
        };
      }

      console.log('✅ User created successfully:', { id: data.id, email: data.email });
      
      return {
        success: true,
        user: data
      };
    } catch (error) {
      console.error('💥 Unexpected error creating user:', error);
      return {
        success: false,
        error: 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.'
      };
    }
  }

  /**
   * Find a user by email
   */
  static async getUserByEmail(email: string): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      initializeDatabase();

      // If no valid credentials, use mock database
      if (!hasValidCredentials) {
        for (const user of Array.from(mockDatabase.values())) {
          if (user.email === email) {
            return {
              success: true,
              user: user
            };
          }
        }
        
        return {
          success: false,
          error: 'Không tìm thấy tài khoản với email này.'
        };
      }

      // Use real Supabase
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No user found
          return {
            success: false,
            error: 'Không tìm thấy tài khoản với email này.'
          };
        }
        
        console.error('❌ Database error finding user:', error);
        return {
          success: false,
          error: 'Có lỗi xảy ra khi tìm kiếm tài khoản.'
        };
      }

      return {
        success: true,
        user: data
      };
    } catch (error) {
      console.error('💥 Unexpected error finding user:', error);
      return {
        success: false,
        error: 'Có lỗi xảy ra khi tìm kiếm tài khoản.'
      };
    }
  }

  /**
   * Update user email verification status
   */
  static async verifyUserEmail(email: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      initializeDatabase();

      // If no valid credentials, use mock database
      if (!hasValidCredentials) {
        for (const user of Array.from(mockDatabase.values())) {
          if (user.email === email) {
            user.email_verified = true;
            user.updated_at = new Date().toISOString();
            console.log('✅ Mock email verified successfully for:', email);
            return { success: true };
          }
        }
        
        return {
          success: false,
          error: 'Không tìm thấy tài khoản với email này.'
        };
      }

      // Use real Supabase
      const { error } = await supabaseClient
        .from('users')
        .update({ email_verified: true, updated_at: new Date().toISOString() })
        .eq('email', email);

      if (error) {
        console.error('❌ Database error verifying email:', error);
        return {
          success: false,
          error: 'Có lỗi xảy ra khi xác thực email.'
        };
      }

      console.log('✅ Email verified successfully for:', email);
      return { success: true };
    } catch (error) {
      console.error('💥 Unexpected error verifying email:', error);
      return {
        success: false,
        error: 'Có lỗi xảy ra khi xác thực email.'
      };
    }
  }

  /**
   * Check if database connection is working
   */
  static async healthCheck(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      initializeDatabase();

      // If no valid credentials, return mock success
      if (!hasValidCredentials) {
        console.log('✅ Mock database health check passed');
        return { success: true };
      }

      // Use real Supabase
      const { error } = await supabaseClient
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Database health check failed:', error);
        return {
          success: false,
          error: 'Database connection failed'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('💥 Database health check error:', error);
      return {
        success: false,
        error: 'Database connection error'
      };
    }
  }
} 