import { NextRequest, NextResponse } from "next/server";
import { createTestAccounts, getTestAccountInfo, verifyTestAccount } from '@/utils/createTestAccounts';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with special header
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasTestHeader = request.headers.get('x-test-mode') === 'true';
    
    if (!isDevelopment && !hasTestHeader) {
      return NextResponse.json(
        { error: "Test account creation only allowed in development mode" },
        { status: 403 }
      );
    }

    console.log('🔧 Creating test accounts via API...');
    const result = await createTestAccounts();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      accounts: result.accounts.map(account => ({
        id: account.id,
        email: account.email,
        password: account.password,
        loginUrl: account.loginUrl,
        created: account.created,
        error: account.error
      }))
    });

  } catch (error) {
    console.error("💥 Test account creation error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tạo tài khoản test" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Only allow in development or with special header
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasTestHeader = request.headers.get('x-test-mode') === 'true';
    
    if (!isDevelopment && !hasTestHeader) {
      return NextResponse.json(
        { error: "Test account info only available in development mode" },
        { status: 403 }
      );
    }

    const accounts = getTestAccountInfo();

    return NextResponse.json({
      success: true,
      message: "Test account information",
      accounts: accounts
    });

  } catch (error) {
    console.error("💥 Test account info error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy thông tin tài khoản test" },
      { status: 500 }
    );
  }
} 