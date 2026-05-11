import nodemailer from 'nodemailer';

interface EmailData {
  fullName: string;
  email: string;
  password: string;
}

interface EmailResult {
  success: boolean;
  message: string;
  messageId?: string;
}

// Email template for account confirmation
const createEmailTemplate = (data: EmailData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Chào mừng đến với CV Builder!</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0288D1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .credentials { background: #E0F7FA; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    .button { display: inline-block; background: #0288D1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Chào mừng đến với CV Builder!</h1>
    </div>
    <div class="content">
      <h2>Xin chào ${data.fullName},</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản CV Builder! Chúng tôi rất vui mừng được đồng hành cùng bạn trong hành trình tìm kiếm việc làm.</p>
      
      <div class="credentials">
        <h3>📧 Thông tin tài khoản của bạn:</h3>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Mật khẩu:</strong> ${data.password}</p>
        <p><em>Vui lòng lưu giữ thông tin này an toàn và thay đổi mật khẩu sau khi đăng nhập lần đầu.</em></p>
      </div>

      <p>Với CV Builder, bạn có thể:</p>
      <ul>
        <li>🎯 Tối ưu hóa CV để vượt qua hệ thống ATS</li>
        <li>🔍 Tìm kiếm việc làm phù hợp với kỹ năng</li>
        <li>✍️ Tạo thư xin việc chuyên nghiệp</li>
        <li>📊 Phân tích và cải thiện hồ sơ ứng tuyển</li>
      </ul>

      <div style="text-align: center;">
        <a href="#" class="button">Bắt đầu sử dụng CV Builder</a>
      </div>

      <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi qua email này.</p>
      
      <p>Chúc bạn thành công!</p>
      <p><strong>Đội ngũ CV Builder</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 CV Builder. Tất cả quyền được bảo lưu.</p>
      <p>Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

// Create email transporter
const createTransporter = () => {
  // In development, use Ethereal Email for testing
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  // Production SMTP configuration (to be configured with environment variables)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function sendConfirmationEmail(data: EmailData): Promise<EmailResult> {
  try {
    // In development mode, just log the email content
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔔 EMAIL WOULD BE SENT (Development Mode)');
      console.log('=====================================');
      console.log(`To: ${data.email}`);
      console.log(`Subject: Chào mừng đến với CV Builder - Tài khoản của bạn đã được tạo!`);
      console.log('\nEmail Content:');
      console.log('📧 Account Details:');
      console.log(`   Full Name: ${data.fullName}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Password: ${data.password}`);
      console.log('\n✅ Email logged successfully in development mode');
      console.log('=====================================\n');

      return {
        success: true,
        message: 'Email logged successfully in development mode',
        messageId: `dev-${Date.now()}`
      };
    }

    // Production email sending
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || '"CV Builder" <noreply@okbuddy.io>',
      to: data.email,
      subject: 'Chào mừng đến với CV Builder - Tài khoản của bạn đã được tạo!',
      html: createEmailTemplate(data),
      text: `
Chào mừng đến với CV Builder!

Xin chào ${data.fullName},

Cảm ơn bạn đã đăng ký tài khoản CV Builder!

Thông tin tài khoản:
Email: ${data.email}
Mật khẩu: ${data.password}

Vui lòng lưu giữ thông tin này an toàn.

Trân trọng,
Đội ngũ CV Builder
      `.trim()
    };

    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Email sending error:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
} 