// Email service for sending confirmation emails
// Following OkBuddy tenets: modular, swappable, no vendor lock-in

export interface EmailData {
  fullName: string;
  email: string;
  password: string; // For MVP - in production use password reset link
}

export interface EmailResult {
  success: boolean;
  message?: string;
  messageId?: string;
  error?: string;
}

/**
 * Send confirmation email to new user
 * For MVP: Simple console logging (production: integrate with email service)
 */
export async function sendConfirmationEmail(data: EmailData): Promise<EmailResult> {
  try {
    // Validate input data
    if (!data.fullName || !data.email || !data.password) {
      return {
        success: false,
        error: 'Thiếu thông tin cần thiết để gửi email'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        error: 'Địa chỉ email không hợp lệ'
      };
    }

    // For MVP: Log email content (in production, integrate with email service)
    const emailContent = {
      to: data.email,
      subject: 'Chào mừng đến với OkBuddy - Xác nhận tài khoản',
      body: `
        Xin chào ${data.fullName},

        Cảm ơn bạn đã đăng ký tài khoản OkBuddy!

        Thông tin đăng nhập của bạn:
        Email: ${data.email}
        Mật khẩu: ${data.password}

        Vui lòng đăng nhập vào hệ thống để bắt đầu sử dụng dịch vụ.

        Trân trọng,
        Đội ngũ OkBuddy
      `
    };

    // Generate a mock message ID
    const messageId = `okbuddy_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    console.log('📧 Email Content (MVP Mode):', emailContent);
    console.log('📧 Message ID:', messageId);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // For production: Replace with actual email service integration
    // Examples: SendGrid, AWS SES, Nodemailer with SMTP, etc.
    /*
    if (process.env.NODE_ENV === 'production') {
      // Production email service integration
      // const emailService = new YourEmailService();
      // const result = await emailService.send(emailContent);
      // return result;
    }
    */

    return {
      success: true,
      message: 'Email xác nhận đã được gửi thành công (MVP mode)',
      messageId
    };

  } catch (error) {
    console.error('❌ Email sending error:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi gửi email xác nhận'
    };
  }
}

/**
 * Send password reset email (for future implementation)
 */
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<EmailResult> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Địa chỉ email không hợp lệ'
      };
    }

    // For MVP: Log reset email content
    const emailContent = {
      to: email,
      subject: 'OkBuddy - Đặt lại mật khẩu',
      body: `
        Xin chào,

        Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản OkBuddy.

        Mã đặt lại mật khẩu: ${resetToken}

        Vui lòng sử dụng mã này để đặt lại mật khẩu.

        Trân trọng,
        Đội ngũ OkBuddy
      `
    };

    const messageId = `reset_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    console.log('📧 Password Reset Email (MVP Mode):', emailContent);
    console.log('📧 Message ID:', messageId);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      message: 'Email đặt lại mật khẩu đã được gửi thành công (MVP mode)',
      messageId
    };

  } catch (error) {
    console.error('❌ Password reset email error:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi gửi email đặt lại mật khẩu'
    };
  }
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate email verification token (for future implementation)
 */
export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
} 