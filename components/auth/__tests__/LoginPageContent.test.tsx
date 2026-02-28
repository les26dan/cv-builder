import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LoginPageContent from '../LoginPageContent';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null)
  }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  })
}));

// Mock the SocialLoginButton component
jest.mock('../SocialLoginButton', () => {
  return function MockSocialLoginButton({ provider, text, onClick }: any) {
    return (
      <button type="button" onClick={onClick}>
        {text}
      </button>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('LoginPageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Component Rendering', () => {
    it('should render login form with all required elements', () => {
      render(<LoginPageContent />);
      
      // Check main heading using role
      expect(screen.getByRole('heading', { name: /đăng nhập/i })).toBeInTheDocument();
      
      // Check form fields by placeholder
      expect(screen.getByPlaceholderText(/nhập email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/nhập mật khẩu/i)).toBeInTheDocument();
      
      // Check submit button using role and name
      expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
      
      // Check social login buttons
      expect(screen.getByText(/tiếp tục với google/i)).toBeInTheDocument();
      expect(screen.getByText(/tiếp tục với linkedin/i)).toBeInTheDocument();
      
      // Check register link
      expect(screen.getByText(/chưa có tài khoản/i)).toBeInTheDocument();
      expect(screen.getByText(/đăng ký ngay/i)).toBeInTheDocument();
    });

    it('should have proper responsive design classes', () => {
      render(<LoginPageContent />);
      
      const heading = screen.getByRole('heading', { name: /đăng nhập/i });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-2xl', 'sm:text-3xl', 'font-bold');
    });
  });

  describe('Form Validation', () => {
    it('should have required attributes on form fields', () => {
      render(<LoginPageContent />);
      
      const emailInput = screen.getByPlaceholderText(/nhập email/i);
      const passwordInput = screen.getByPlaceholderText(/nhập mật khẩu/i);
      
      // Check required attributes
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      
      // Check input types
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should accept valid email format', async () => {
      render(<LoginPageContent />);
      
      const emailInput = screen.getByPlaceholderText(/nhập email/i);
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      });
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should accept valid password', async () => {
      render(<LoginPageContent />);
      
      const passwordInput = screen.getByPlaceholderText(/nhập mật khẩu/i);
      
      await act(async () => {
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });
      
      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '1', email: 'test@example.com' } })
      });

      // Mock localStorage
      const localStorageMock = {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });

      // Mock window.location
      delete (window as any).location;
      window.location = { href: '', replace: jest.fn() } as any;

      render(<LoginPageContent />);
      
      const emailInput = screen.getByPlaceholderText(/nhập email/i);
      const passwordInput = screen.getByPlaceholderText(/nhập mật khẩu/i);
      const submitButton = screen.getByRole('button', { name: /đăng nhập/i });
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        });
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      });

      render(<LoginPageContent />);
      
      const emailInput = screen.getByPlaceholderText(/nhập email/i);
      const passwordInput = screen.getByPlaceholderText(/nhập mật khẩu/i);
      const submitButton = screen.getByRole('button', { name: /đăng nhập/i });
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Social Login', () => {
    it('should handle Google OAuth login', async () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(<LoginPageContent />);
      
      const googleButton = screen.getByText(/tiếp tục với google/i);
      
      await act(async () => {
        fireEvent.click(googleButton);
      });
      
      expect(window.location.href).toBe('/api/auth/google/signin');
    });

    it('should handle LinkedIn OAuth login', async () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(<LoginPageContent />);
      
      const linkedinButton = screen.getByText(/tiếp tục với linkedin/i);
      
      await act(async () => {
        fireEvent.click(linkedinButton);
      });
      
      expect(window.location.href).toBe('/api/auth/linkedin/signin');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form input attributes', () => {
      render(<LoginPageContent />);
      
      const emailInput = screen.getByPlaceholderText(/nhập email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('name', 'email');
      
      const passwordInput = screen.getByPlaceholderText(/nhập mật khẩu/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('name', 'password');
    });

    it('should have proper form labels', () => {
      render(<LoginPageContent />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
    });

    it('should have proper button types', () => {
      render(<LoginPageContent />);
      
      const submitButton = screen.getByRole('button', { name: /đăng nhập/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Loading States', () => {
    it('should disable submit button during form submission', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ user: { id: '1', email: 'test@example.com' } })
          }), 100)
        )
      );

      render(<LoginPageContent />);
      
      const emailInput = screen.getByPlaceholderText(/nhập email/i);
      const passwordInput = screen.getByPlaceholderText(/nhập mật khẩu/i);
      const submitButton = screen.getByRole('button', { name: /đăng nhập/i });
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });
      
      // Check that button is disabled during submission
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      });

      render(<LoginPageContent />);
      
      const emailInput = screen.getByPlaceholderText(/nhập email/i);
      const passwordInput = screen.getByPlaceholderText(/nhập mật khẩu/i);
      const submitButton = screen.getByRole('button', { name: /đăng nhập/i });
      
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });
});
