import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { Header } from '../Header';

// Mock CrossAppDataService
vi.mock('../../shared/services/crossAppDataService', () => ({
  CrossAppDataService: {
    getInstance: vi.fn(() => ({
      getURLParams: vi.fn(() => ({ cvId: 'test-cv-id', userId: 'test-user-id' })),
      navigateWithCVData: vi.fn(),
    }))
  }
}));

describe('Header Component - JD Analysis Implementation', () => {
  const defaultProps = {
    cvScore: 75,
    cvData: {
      contact: { fullName: 'Test User' },
      summary: 'Test summary',
      experience: [],
      skills: [],
      education: []
    },
    onUpdateCvData: vi.fn(),
    onJobAnalysisComplete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders logo and branding correctly', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByText('CV Builder')).toBeInTheDocument();
    });

    it('renders auto-save indicator', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByText('✓ Đã lưu tự động')).toBeInTheDocument();
    });

    it('renders user avatar placeholder', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByText('N')).toBeInTheDocument();
    });

    it('renders back button when cvId is present', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload/i });
      expect(backButton).toBeInTheDocument();
    });

    it('renders workspace navigation button', () => {
      render(<Header {...defaultProps} />);
      
      const workspaceButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      expect(workspaceButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing cvData gracefully', () => {
      const propsWithoutCvData = {
        ...defaultProps,
        cvData: undefined
      };

      expect(() => {
        render(<Header {...propsWithoutCvData} />);
      }).not.toThrow();
      
      expect(screen.getByText('CV Builder')).toBeInTheDocument();
    });

    it('handles different score values', () => {
      // Test with score 0
      const { rerender } = render(<Header {...defaultProps} cvScore={0} />);
      expect(screen.getByText('CV Builder')).toBeInTheDocument();

      // Test with score 100 by rerendering same component
      rerender(<Header {...defaultProps} cvScore={100} />);
      expect(screen.getByText('CV Builder')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for navigation elements', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload/i });
      expect(backButton).toHaveAttribute('aria-label');
      
      const workspaceButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      expect(workspaceButton).toHaveAttribute('aria-label');
    });

    it('has proper title attributes for tooltips', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload/i });
      expect(backButton).toHaveAttribute('title');
      
      const workspaceButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      expect(workspaceButton).toHaveAttribute('title');
    });
  });
}); 