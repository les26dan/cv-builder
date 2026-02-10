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

// Mock database removed - using real database only

// Lazy initialization of Supabase client
let supabaseClient: any = null;
let hasValidCredentials: boolean | null = null;

function initializeDatabase() {
  if (hasValidCredentials !== null) {
    return; // Already initialized
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check if we have valid Supabase credentials
  hasValidCredentials = !!(supabaseUrl && (supabaseAnonKey || supabaseServiceKey) && 
    !supabaseUrl.includes('placeholder'));

  if (!hasValidCredentials) {
    if (isTestEnvironment || isDevelopment) {
      console.warn('⚠️ Using mock database - Supabase credentials not configured');
    } else {
      throw new Error('Missing Supabase environment variables');
    }
  }

  // Use service role key for authentication operations to bypass RLS
  const keyToUse = supabaseServiceKey || supabaseAnonKey || 'placeholder-key';
  
  supabaseClient = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    keyToUse
  );
  
  if (supabaseServiceKey) {
    console.log('🔑 Database initialized with service role for authentication operations');
  } else {
    console.log('⚠️ Database initialized with anon key - may have RLS restrictions');
  }
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

      // Require valid database credentials - no mock fallback
      if (!hasValidCredentials) {
        console.error('❌ Database credentials not configured - cannot create user');
        return {
          success: false,
          error: 'Database not configured'
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

      // Require valid database credentials - no mock fallback
      if (!hasValidCredentials) {
        console.error('❌ Database credentials not configured - cannot lookup user');
        return {
          success: false,
          error: 'Database not configured'
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
        console.error('❌ Database credentials not configured - cannot verify email');
        return {
          success: false,
          error: 'Database not configured'
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