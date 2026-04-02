import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from '@/lib/password';
import { DatabaseService } from '@/lib/database';

// Explicitly use Node.js runtime
export const runtime = 'nodejs'

/**
 * Admin Account Creation API
 * Creates an admin user with the specified credentials
 * 
 * This is a one-time setup endpoint for creating the admin account
 */
export async function POST(request: NextRequest) {
  try {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    const fullName = process.env.BOOTSTRAP_ADMIN_FULL_NAME?.trim() || 'Admin';

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set to use this endpoint'
        },
        { status: 503 }
      );
    }

    const adminData = {
      fullName,
      email,
      username: process.env.BOOTSTRAP_ADMIN_LOGIN_ALIAS?.trim() || 'adminbuddy',
      password,
      role: 'admin' as const
    };

    console.log('🔧 Creating admin account:', {
      username: adminData.username,
      email: adminData.email,
      fullName: adminData.fullName
    })

    // Check if admin user already exists
    const existingUser = await DatabaseService.getUserByEmail(adminData.email)
    
    if (existingUser.success && existingUser.user) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        loginUrl: '/login/',
        user: {
          id: existingUser.user.id,
          fullName: existingUser.user.full_name,
          email: existingUser.user.email,
          emailVerified: existingUser.user.email_verified,
          createdAt: existingUser.user.created_at
        }
      })
    }

    // Hash the password
    const passwordResult = await hashPassword(adminData.password)
    
    if (!passwordResult.success || !passwordResult.hashedPassword) {
      console.error('❌ Failed to hash password:', passwordResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to hash password' 
        },
        { status: 500 }
      )
    }

    // Create the admin user
    const createResult = await DatabaseService.createUser({
      full_name: adminData.fullName,
      email: adminData.email,
      password_hash: passwordResult.hashedPassword,
      email_verified: true // Admin is automatically verified
    })

    if (!createResult.success) {
      console.error('❌ Failed to create admin user:', createResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: createResult.error || 'Failed to create admin user' 
        },
        { status: 400 }
      )
    }

    console.log('✅ Admin account created successfully!')

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully! Log in with BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD from your environment.',
      loginUrl: '/login/',
      user: {
        id: createResult.user?.id,
        fullName: createResult.user?.full_name,
        email: createResult.user?.email,
        emailVerified: createResult.user?.email_verified,
        createdAt: createResult.user?.created_at,
        role: 'admin'
      }
    })

  } catch (error) {
    console.error("💥 Admin creation error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Error creating admin account" 
      },
      { status: 500 }
    );
  }
} 