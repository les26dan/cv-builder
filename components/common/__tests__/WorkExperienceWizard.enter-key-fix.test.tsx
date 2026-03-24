import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WorkExperienceWizard } from '../WorkExperienceWizard';

describe('WorkExperienceWizard Enter Key Fix', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    isGenerating: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Enter Key Functionality', () => {
    it('should advance steps when pressing Enter with English text', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Step 1: Enter English job title
      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      await user.type(titleInput, 'Software Engineer');
      
      // Press Enter - should advance to step 2
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
        expect(screen.getByText('Tên công ty hoặc tổ chức?')).toBeInTheDocument();
      });
    });

    it('should advance steps when pressing Enter with Vietnamese text', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Step 1: Enter Vietnamese job title
      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      await user.type(titleInput, 'Bán hàng');
      
      // Press Enter - should advance to step 2
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
        expect(screen.getByText('Tên công ty hoặc tổ chức?')).toBeInTheDocument();
      });
    });

    it('should complete full wizard flow with Enter key navigation', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Step 1: Job title
      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      await user.type(titleInput, 'Lập trình viên');
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
      });

      // Step 2: Company
      const companyInput = screen.getByPlaceholderText(/Ví dụ: Công ty cổ phần ABC/);
      await user.type(companyInput, 'Công ty ABC');
      fireEvent.keyDown(companyInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 5')).toBeInTheDocument();
      });

      // Step 3: Project
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      await user.type(projectTextarea, 'Phát triển ứng dụng web');
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 4 / 5')).toBeInTheDocument();
      });

      // Step 4: Impact
      const impactTextarea = screen.getByPlaceholderText(/Ví dụ: Tăng hiệu suất bán hàng/);
      await user.type(impactTextarea, 'Tăng hiệu suất 30%');
      fireEvent.keyDown(impactTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 5 / 5')).toBeInTheDocument();
      });

      // Step 5: Responsibility (optional)
      const responsibilityTextarea = screen.getByPlaceholderText(/Ví dụ: Lãnh đạo nhóm/);
      await user.type(responsibilityTextarea, 'Quản lý team 3 người');
      fireEvent.keyDown(responsibilityTextarea, { key: 'Enter' });

      // Should trigger finish
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Lập trình viên',
            company: 'Công ty ABC',
            project: 'Phát triển ứng dụng web',
            impact: 'Tăng hiệu suất 30%',
            responsibility: 'Quản lý team 3 người',
            aiGenerated: true,
          })
        );
      });
    });

    it('should not advance when Enter is pressed with empty required fields', async () => {
      render(<WorkExperienceWizard {...defaultProps} />);

      // Try to press Enter with empty title
      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      // Should stay on step 1
      expect(screen.getByText('Bước 1 / 5')).toBeInTheDocument();
      expect(screen.getByText('Chức danh công việc của bạn là gì?')).toBeInTheDocument();
    });

    it('should work with mixed Vietnamese and English content', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Step 1: Vietnamese title
      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      await user.type(titleInput, 'Nhân viên bán hàng');
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
      });

      // Step 2: English company name
      const companyInput = screen.getByPlaceholderText(/Ví dụ: Công ty cổ phần ABC/);
      await user.type(companyInput, 'Tech Solutions Ltd');
      fireEvent.keyDown(companyInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 5')).toBeInTheDocument();
      });

      // Step 3: Mixed content
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      await user.type(projectTextarea, 'Develop CRM system for Vietnamese market');
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 4 / 5')).toBeInTheDocument();
      });
    });

    it('should handle rapid Enter key presses gracefully', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Enter title
      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      await user.type(titleInput, 'Developer');
      
      // Press Enter multiple times rapidly
      fireEvent.keyDown(titleInput, { key: 'Enter' });
      fireEvent.keyDown(titleInput, { key: 'Enter' });
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      // Should only advance once to step 2
      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
      });

      // Should not skip to step 3 or beyond
      expect(screen.queryByText('Bước 3 / 5')).not.toBeInTheDocument();
    });
  });

  describe('Composition State Management', () => {
    it('should reset composition state on blur', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      
      // Simulate composition start without proper end
      fireEvent.compositionStart(titleInput);
      await user.type(titleInput, 'Bán hàng');
      
      // Blur the input (simulates clicking away)
      fireEvent.blur(titleInput);
      
      // Now Enter should work normally
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
      });
    });

    it('should handle Shift+Enter without advancing steps', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Navigate to a textarea step
      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      await user.type(titleInput, 'Developer');
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
      });

      const companyInput = screen.getByPlaceholderText(/Ví dụ: Công ty cổ phần ABC/);
      await user.type(companyInput, 'TechCorp');
      fireEvent.keyDown(companyInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 5')).toBeInTheDocument();
      });

      // Now on textarea - Shift+Enter should not advance
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      await user.type(projectTextarea, 'Line 1');
      
      // Shift+Enter should not advance step
      fireEvent.keyDown(projectTextarea, { key: 'Enter', shiftKey: true });
      
      // Should still be on step 3
      expect(screen.getByText('Bước 3 / 5')).toBeInTheDocument();
    });
  });
}); 