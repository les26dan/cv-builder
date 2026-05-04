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
    // Admin credentials as requested
    const adminData = {
      fullName: 'Admin Buddy',
      email: 'okbuddy2025@gmail.com', // Updated to Gmail address
      username: 'adminbuddy', // Custom username/ID as requested
      password: '[REDACTED_PASSWORD]',
      role: 'admin'
    }

    console.log('🔧 Creating admin account with credentials:', {
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
        credentials: {
          id: adminData.username,
          email: adminData.email,
          password: adminData.password
        },
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
      message: 'Admin account created successfully!',
      credentials: {
        id: adminData.username,
        email: adminData.email,
        password: adminData.password
      },
      loginUrl: '/login/',
      user: {
        id: createResult.user?.id,
        fullName: createResult.user?.full_name,
        email: createResult.user?.email,
        emailVerified: createResult.user?.email_verified,
        createdAt: createResult.user?.created_at,
        role: 'admin'
      },
      instructions: {
        loginAt: 'http://localhost:3000/login/',
        useEmail: adminData.email,
        usePassword: adminData.password,
        note: 'Admin has full access to all features and can manage all users'
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