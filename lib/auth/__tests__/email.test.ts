import { sendConfirmationEmail } from '../email';

// Mock console.log to capture output
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Email Service', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockConsoleLog.mockClear();
    // Mock NODE_ENV for testing
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true
    });
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    // Restore original NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true
    });
  });

  it('should log email content in development mode', async () => {
    const testData = {
      fullName: 'Nguyễn Văn Test',
      email: 'test@example.com',
      password: 'testpassword123'
    };

    const result = await sendConfirmationEmail(testData);

    // Should return success in development mode
    expect(result.success).toBe(true);
    expect(result.message).toBe('Email logged successfully in development mode');
    expect(result.messageId).toMatch(/^dev-\d+$/);

    // Should log email details
    expect(mockConsoleLog).toHaveBeenCalledWith('\n🔔 EMAIL WOULD BE SENT (Development Mode)');
    expect(mockConsoleLog).toHaveBeenCalledWith('=====================================');
    expect(mockConsoleLog).toHaveBeenCalledWith(`To: ${testData.email}`);
    expect(mockConsoleLog).toHaveBeenCalledWith(`Subject: Chào mừng đến với OkBuddy - Tài khoản của bạn đã được tạo!`);
    expect(mockConsoleLog).toHaveBeenCalledWith('\nEmail Content:');
    expect(mockConsoleLog).toHaveBeenCalledWith('📧 Account Details:');
    expect(mockConsoleLog).toHaveBeenCalledWith(`   Full Name: ${testData.fullName}`);
    expect(mockConsoleLog).toHaveBeenCalledWith(`   Email: ${testData.email}`);
    expect(mockConsoleLog).toHaveBeenCalledWith(`   Password: ${testData.password}`);
    expect(mockConsoleLog).toHaveBeenCalledWith('\n✅ Email logged successfully in development mode');
    expect(mockConsoleLog).toHaveBeenCalledWith('=====================================\n');
  });

  it('should handle Vietnamese characters correctly', async () => {
    const testData = {
      fullName: 'Trần Thị Hương',
      email: 'huong.tran@example.com',
      password: 'mậtkhẩu123'
    };

    const result = await sendConfirmationEmail(testData);

    expect(result.success).toBe(true);
    expect(mockConsoleLog).toHaveBeenCalledWith(`   Full Name: ${testData.fullName}`);
    expect(mockConsoleLog).toHaveBeenCalledWith(`   Email: ${testData.email}`);
    expect(mockConsoleLog).toHaveBeenCalledWith(`   Password: ${testData.password}`);
  });

  it('should generate unique message IDs', async () => {
    const testData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const result1 = await sendConfirmationEmail(testData);
    
    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result2 = await sendConfirmationEmail(testData);

    expect(result1.messageId).not.toBe(result2.messageId);
    expect(result1.messageId).toMatch(/^dev-\d+$/);
    expect(result2.messageId).toMatch(/^dev-\d+$/);
  });

  it('should handle empty or invalid data gracefully', async () => {
    const testData = {
      fullName: '',
      email: '',
      password: ''
    };

    const result = await sendConfirmationEmail(testData);

    // Should still succeed in development mode (just logging)
    expect(result.success).toBe(true);
    expect(result.message).toBe('Email logged successfully in development mode');
  });
}); 