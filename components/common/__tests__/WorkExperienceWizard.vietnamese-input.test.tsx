import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WorkExperienceWizard } from '../WorkExperienceWizard';

describe('WorkExperienceWizard Vietnamese Input', () => {
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

  describe('Vietnamese Input Handling', () => {
    it('should not skip steps when typing Vietnamese characters with tonal marks', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Should be on step 1 initially
      expect(screen.getByText('Bước 1 / 5')).toBeInTheDocument();
      expect(screen.getByText('Chức danh công việc của bạn là gì?')).toBeInTheDocument();

      // Type Vietnamese text with tonal marks
      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      
      // Simulate composition events that occur with Vietnamese IME
      fireEvent.compositionStart(titleInput);
      await user.type(titleInput, 'Bán hàng');
      fireEvent.compositionEnd(titleInput);

      // Press Enter - should stay on step 1 and move to step 2 correctly
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
        expect(screen.getByText('Tên công ty hoặc tổ chức?')).toBeInTheDocument();
      });

      // Verify we're actually on step 2 and not step 3
      expect(screen.queryByText('Dự án hoặc trách nhiệm chính')).not.toBeInTheDocument();
    });

    it('should maintain correct step sequence with Vietnamese company names', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Step 1: Enter job title
      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      fireEvent.compositionStart(titleInput);
      await user.type(titleInput, 'Nhân viên bán hàng');
      fireEvent.compositionEnd(titleInput);
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
      });

      // Step 2: Enter Vietnamese company name with tonal marks
      const companyInput = screen.getByPlaceholderText(/Ví dụ: Công ty cổ phần ABC/);
      fireEvent.compositionStart(companyInput);
      await user.type(companyInput, 'Công ty cổ phần MML');
      fireEvent.compositionEnd(companyInput);
      fireEvent.keyDown(companyInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 5')).toBeInTheDocument();
        expect(screen.getByText('Dự án hoặc trách nhiệm chính')).toBeInTheDocument();
      });

      // Verify we're correctly on step 3
      expect(screen.queryByText('Tên công ty hoặc tổ chức?')).not.toBeInTheDocument();
      expect(screen.queryByText('Kết quả hoặc tác động')).not.toBeInTheDocument();
    });

    it('should handle back navigation correctly with Vietnamese input', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Navigate to step 2
      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      await user.type(titleInput, 'Bán hàng');
      fireEvent.keyDown(titleInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
      });

      // Enter company name and move to step 3
      const companyInput = screen.getByPlaceholderText(/Ví dụ: Công ty cổ phần ABC/);
      await user.type(companyInput, 'Công ty ABC');
      fireEvent.keyDown(companyInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 5')).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByText('Quay lại');
      await user.click(backButton);

      // Should be back on step 2 with preserved data
      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Công ty ABC')).toBeInTheDocument();
      });

      // Go back to step 1
      await user.click(screen.getByText('Quay lại'));

      await waitFor(() => {
        expect(screen.getByText('Bước 1 / 5')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Bán hàng')).toBeInTheDocument();
      });
    });

    it('should not advance during active composition', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      
      // Start composition
      fireEvent.compositionStart(titleInput);
      await user.type(titleInput, 'Bán h');
      
      // Try to press Enter while composing - should not advance
      fireEvent.keyDown(titleInput, { key: 'Enter' });
      
      // Should still be on step 1
      expect(screen.getByText('Bước 1 / 5')).toBeInTheDocument();
      expect(screen.getByText('Chức danh công việc của bạn là gì?')).toBeInTheDocument();
      
      // Continue typing and end composition
      await user.type(titleInput, 'àng');
      fireEvent.compositionEnd(titleInput);
      
      // Now Enter should work
      fireEvent.keyDown(titleInput, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
      });
    });

    it('should handle complex Vietnamese phrases in project descriptions', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Navigate through first two steps
      await user.type(screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/), 'Nhân viên kinh doanh');
      fireEvent.keyDown(screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/), { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/Ví dụ: Công ty cổ phần ABC/), 'Công ty TNHH ABC');
      fireEvent.keyDown(screen.getByPlaceholderText(/Ví dụ: Công ty cổ phần ABC/), { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 5')).toBeInTheDocument();
      });

      // Enter complex Vietnamese project description
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.compositionStart(projectTextarea);
      await user.type(projectTextarea, 'Phát triển hệ thống quản lý khách hàng mới thông qua các kênh trực tuyến');
      fireEvent.compositionEnd(projectTextarea);

      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 4 / 5')).toBeInTheDocument();
        expect(screen.getByText('Kết quả hoặc tác động')).toBeInTheDocument();
      });
    });
  });

  describe('IME Composition Events', () => {
    it('should properly handle composition start and end events', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      const titleInput = screen.getByPlaceholderText(/Ví dụ: Chuyên viên kinh doanh/);
      
      // Test multiple composition cycles
      fireEvent.compositionStart(titleInput);
      await user.type(titleInput, 'Bá');
      fireEvent.compositionEnd(titleInput);
      
      fireEvent.compositionStart(titleInput);
      await user.type(titleInput, 'n há');
      fireEvent.compositionEnd(titleInput);
      
      fireEvent.compositionStart(titleInput);
      await user.type(titleInput, 'ng');
      fireEvent.compositionEnd(titleInput);

      // Should have complete text
      expect(titleInput).toHaveValue('Bán hàng');
      
      // Should advance normally after composition
      fireEvent.keyDown(titleInput, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 5')).toBeInTheDocument();
      });
    });
  });
}); 