import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SocialLoginButton from '../SocialLoginButton';

describe('SocialLoginButton', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Google Provider', () => {
    it('should render Google button with correct styling and text', () => {
      render(
        <SocialLoginButton 
          provider="google" 
          text="Tiếp tục với Google"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button', { name: /tiếp tục với google/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-white', 'border-gray-300', 'text-gray-700');
      
      // Check for Google icon (SVG)
      const googleIcon = button.querySelector('svg');
      expect(googleIcon).toBeInTheDocument();
      expect(googleIcon).toHaveClass('w-5', 'h-5');
    });

    it('should call onClick handler when clicked', () => {
      render(
        <SocialLoginButton 
          provider="google" 
          text="Tiếp tục với Google"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button', { name: /tiếp tục với google/i });
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when loading prop is true', () => {
      render(
        <SocialLoginButton 
          provider="google" 
          text="Tiếp tục với Google"
          onClick={mockOnClick}
          loading={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();
      
      // Should show loading spinner
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <SocialLoginButton 
          provider="google" 
          text="Tiếp tục với Google"
          onClick={mockOnClick}
          disabled={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  describe('LinkedIn Provider', () => {
    it('should render LinkedIn button with correct styling and text', () => {
      render(
        <SocialLoginButton 
          provider="linkedin" 
          text="Tiếp tục với LinkedIn"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button', { name: /tiếp tục với linkedin/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-[#0077B5]', 'text-white');
      
      // Check for LinkedIn icon (SVG)
      const linkedinIcon = button.querySelector('svg');
      expect(linkedinIcon).toBeInTheDocument();
      expect(linkedinIcon).toHaveClass('w-5', 'h-5');
    });

    it('should call onClick handler when clicked', () => {
      render(
        <SocialLoginButton 
          provider="linkedin" 
          text="Tiếp tục với LinkedIn"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button', { name: /tiếp tục với linkedin/i });
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle custom text prop', () => {
      const customText = 'Custom Button Text';
      render(
        <SocialLoginButton 
          provider="google" 
          text={customText}
          onClick={mockOnClick}
        />
      );
      
      expect(screen.getByText(customText)).toBeInTheDocument();
    });

    test('should handle transition classes', () => {
      render(
        <SocialLoginButton 
          provider="google" 
          text="Tiếp tục với Google"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all', 'duration-200', 'ease-in-out');
    });
  });
});
