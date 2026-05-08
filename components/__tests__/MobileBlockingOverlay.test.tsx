import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { MobileBlockingOverlay } from '../MobileBlockingOverlay';
import { MobileDetectionResult } from '../../utils/useMobileDetection';

describe('MobileBlockingOverlay', () => {
  const mockOnBackToWorkspace = vi.fn();
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMobileDetection = (overrides: Partial<MobileDetectionResult> = {}): MobileDetectionResult => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    viewportWidth: 375,
    shouldBlockEditor: true,
    ...overrides
  });

  describe('Mobile Device Blocking', () => {
    it('should render mobile blocking overlay for mobile devices', () => {
      const detection = createMobileDetection({ isMobile: true, viewportWidth: 375 });
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText(/Trải nghiệm tốt hơn trên máy tính/)).toBeInTheDocument();
      expect(screen.getByText(/Công cụ chỉnh sửa CV của chúng tôi hoạt động tốt nhất/)).toBeInTheDocument();
    });

    it('should display mobile-specific messaging', () => {
      const detection = createMobileDetection({ isMobile: true, viewportWidth: 375 });
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText(/để có trải nghiệm chính xác và hiệu quả nhất/)).toBeInTheDocument();
    });
  });

  describe('Tablet Device Blocking', () => {
    it('should render tablet blocking overlay for small tablets', () => {
      const detection = createMobileDetection({ 
        isMobile: false, 
        isTablet: true, 
        viewportWidth: 800 
      });
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText(/Trải nghiệm tốt hơn trên máy tính/)).toBeInTheDocument();
    });

    it('should display tablet-specific recommendations', () => {
      const detection = createMobileDetection({ 
        isMobile: false, 
        isTablet: true, 
        viewportWidth: 800 
      });
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText(/Công cụ chỉnh sửa CV của chúng tôi hoạt động tốt nhất/)).toBeInTheDocument();
    });
  });

  describe('Navigation Actions', () => {
    it('should handle back to workspace navigation', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      const backButton = screen.getByRole('button', { name: /Quay lại/ });
      fireEvent.click(backButton);

      expect(mockOnBackToWorkspace).toHaveBeenCalledTimes(1);
    });

    it('should not render logout button in new design', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.queryByRole('button', { name: /Đăng xuất/ })).not.toBeInTheDocument();
    });

    it('should not render logout button when no logout handler provided', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
        />
      );

      expect(screen.queryByRole('button', { name: /Đăng xuất/ })).not.toBeInTheDocument();
    });
  });

  describe('Feature Availability Display', () => {
    it('should display available features for mobile users', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Bạn vẫn có thể làm trên điện thoại:')).toBeInTheDocument();
      expect(screen.getByText('Xem và quản lý CV trong Workspace')).toBeInTheDocument();
      expect(screen.getByText('Tải lên CV và mô tả công việc')).toBeInTheDocument();
      expect(screen.getByText('Tải xuống CV đã hoàn thành')).toBeInTheDocument();
    });

    it('should display help information', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText(/Hoặc chuyển sang máy tính bảng để có trải nghiệm di động tốt hơn/)).toBeInTheDocument();
    });
  });

  describe('Visual Design and Styling', () => {
    it('should render with proper CV Builder styling', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      const overlay = document.querySelector('.fixed.inset-0.bg-okbuddy-light-blue');
      expect(overlay).toBeInTheDocument();

      const modal = document.querySelector('.bg-white');
      expect(modal).toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      const backButton = screen.getByRole('button', { name: /Quay lại/ });
      expect(backButton).toHaveClass('bg-gray-100');
    });

    it('should display monitor icon correctly', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      const iconContainer = document.querySelector('.w-20.h-20.bg-gradient-to-br');
      expect(iconContainer).toBeInTheDocument();
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on different screen sizes', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      const modal = document.querySelector('.max-w-sm.w-full');
      expect(modal).toBeInTheDocument();
    });

    it('should handle button layout responsively', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      const buttonContainer = document.querySelector('.gap-4');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      const featureHeading = screen.getByRole('heading', { level: 3 });
      expect(featureHeading).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have proper focus management', () => {
      const detection = createMobileDetection();
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      const backButton = screen.getByRole('button', { name: /Quay lại/ });
      backButton.focus();
      expect(backButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown device type gracefully', () => {
      const detection = createMobileDetection({ 
        isMobile: false, 
        isTablet: false, 
        isDesktop: false 
      });
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText(/Trải nghiệm tốt hơn trên máy tính/)).toBeInTheDocument();
      expect(screen.getByText(/Công cụ chỉnh sửa CV của chúng tôi hoạt động tốt nhất/)).toBeInTheDocument();
    });

    it('should handle very small viewport widths', () => {
      const detection = createMobileDetection({ viewportWidth: 320 });
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      // Should still render correctly
      expect(screen.getByText(/Trải nghiệm tốt hơn trên máy tính/)).toBeInTheDocument();
    });

    it('should handle large tablet viewport widths', () => {
      const detection = createMobileDetection({ 
        isMobile: false,
        isTablet: true,
        viewportWidth: 1000 
      });
      
      render(
        <MobileBlockingOverlay 
          detection={detection}
          onBackToWorkspace={mockOnBackToWorkspace}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText(/Trải nghiệm tốt hơn trên máy tính/)).toBeInTheDocument();
    });
  });
}); 