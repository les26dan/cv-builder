import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AIWizardModal } from '../AIWizardModal';

describe('AIWizardModal Vietnamese Input', () => {
  const mockOnClose = vi.fn();
  const mockOnGenerate = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onGenerate: mockOnGenerate,
    jobTitle: 'Software Engineer',
    company: 'Tech Corp',
    isGenerating: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Vietnamese Input Handling', () => {
    it('should not skip steps when typing Vietnamese characters with tonal marks', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      // Should be on step 1 initially
      expect(screen.getByText('Bước 1 / 3')).toBeInTheDocument();
      expect(screen.getByText('Dự án hoặc trách nhiệm chính')).toBeInTheDocument();

      // Type Vietnamese text with tonal marks
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      
      // Simulate composition events that occur with Vietnamese IME
      fireEvent.compositionStart(projectTextarea);
      await user.type(projectTextarea, 'Phát triển ứng dụng bán hàng');
      fireEvent.compositionEnd(projectTextarea);

      // Press Enter - should advance to step 2 correctly
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
        expect(screen.getByText('Kết quả hoặc tác động')).toBeInTheDocument();
      });

      // Verify we're actually on step 2 and not step 3
      expect(screen.queryByText('Vai trò và phạm vi trách nhiệm')).not.toBeInTheDocument();
    });

    it('should maintain correct step sequence with Vietnamese impact descriptions', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      // Step 1: Enter Vietnamese project description
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.compositionStart(projectTextarea);
      await user.type(projectTextarea, 'Xây dựng hệ thống quản lý khách hàng');
      fireEvent.compositionEnd(projectTextarea);
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
      });

      // Step 2: Enter Vietnamese impact with tonal marks
      const impactTextarea = screen.getByPlaceholderText(/Ví dụ: Tăng hiệu suất bán hàng/);
      fireEvent.compositionStart(impactTextarea);
      await user.type(impactTextarea, 'Tăng doanh thu 25%, giảm thời gian xử lý');
      fireEvent.compositionEnd(impactTextarea);
      fireEvent.keyDown(impactTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 3')).toBeInTheDocument();
        expect(screen.getByText('Vai trò và phạm vi trách nhiệm (tùy chọn)')).toBeInTheDocument();
      });

      // Verify we're correctly on step 3
      expect(screen.queryByText('Dự án hoặc trách nhiệm chính')).not.toBeInTheDocument();
      expect(screen.queryByText('Kết quả hoặc tác động')).not.toBeInTheDocument();
    });

    it('should handle back navigation correctly with Vietnamese input', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      // Navigate to step 2
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      await user.type(projectTextarea, 'Phát triển website bán hàng');
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
      });

      // Enter impact and move to step 3
      const impactTextarea = screen.getByPlaceholderText(/Ví dụ: Tăng hiệu suất bán hàng/);
      await user.type(impactTextarea, 'Tăng doanh số 30%');
      fireEvent.keyDown(impactTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 3')).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByText('Quay lại');
      await user.click(backButton);

      // Should be back on step 2 with preserved data
      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Tăng doanh số 30%')).toBeInTheDocument();
      });

      // Go back to step 1
      await user.click(screen.getByText('Quay lại'));

      await waitFor(() => {
        expect(screen.getByText('Bước 1 / 3')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Phát triển website bán hàng')).toBeInTheDocument();
      });
    });

    it('should complete full wizard flow with Vietnamese text', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      // Step 1: Project with Vietnamese
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      await user.type(projectTextarea, 'Xây dựng ứng dụng di động');
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
      });

      // Step 2: Impact with Vietnamese
      const impactTextarea = screen.getByPlaceholderText(/Ví dụ: Tăng hiệu suất bán hàng/);
      await user.type(impactTextarea, 'Tăng người dùng 50%');
      fireEvent.keyDown(impactTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 3')).toBeInTheDocument();
      });

      // Step 3: Responsibility with Vietnamese
      const responsibilityTextarea = screen.getByPlaceholderText(/Ví dụ: Lãnh đạo nhóm/);
      await user.type(responsibilityTextarea, 'Quản lý đội ngũ 5 người');
      fireEvent.keyDown(responsibilityTextarea, { key: 'Enter' });

      // Should trigger generate
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith({
          project: 'Xây dựng ứng dụng di động',
          impact: 'Tăng người dùng 50%',
          responsibility: 'Quản lý đội ngũ 5 người',
        });
      });
    });

    it('should not advance during active composition', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      
      // Start composition
      fireEvent.compositionStart(projectTextarea);
      await user.type(projectTextarea, 'Phát tri');
      
      // Try to press Enter while composing - should not advance
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });
      
      // Should still be on step 1
      expect(screen.getByText('Bước 1 / 3')).toBeInTheDocument();
      expect(screen.getByText('Dự án hoặc trách nhiệm chính')).toBeInTheDocument();
      
      // Continue typing and end composition
      await user.type(projectTextarea, 'ển app');
      fireEvent.compositionEnd(projectTextarea);
      
      // Now Enter should work
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
      });
    });

    it('should handle complex Vietnamese phrases with multiple tonal marks', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      // Enter complex Vietnamese text with multiple tonal marks
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.compositionStart(projectTextarea);
      await user.type(projectTextarea, 'Phát triển hệ thống quản lý bán hàng và chăm sóc khách hàng toàn diện');
      fireEvent.compositionEnd(projectTextarea);

      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
      });

      // Enter complex impact description
      const impactTextarea = screen.getByPlaceholderText(/Ví dụ: Tăng hiệu suất bán hàng/);
      fireEvent.compositionStart(impactTextarea);
      await user.type(impactTextarea, 'Nâng cao hiệu quả làm việc 40%, giảm thiểu sai sót trong quy trình');
      fireEvent.compositionEnd(impactTextarea);

      fireEvent.keyDown(impactTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 3')).toBeInTheDocument();
      });
    });
  });

  describe('Enter Key Functionality', () => {
    it('should advance steps when pressing Enter with English text', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      // Step 1: Enter English project description
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      await user.type(projectTextarea, 'Develop mobile application');
      
      // Press Enter - should advance to step 2
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
        expect(screen.getByText('Kết quả hoặc tác động')).toBeInTheDocument();
      });
    });

    it('should not advance when Enter is pressed with empty required fields', async () => {
      render(<AIWizardModal {...defaultProps} />);

      // Try to press Enter with empty project field
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      // Should stay on step 1
      expect(screen.getByText('Bước 1 / 3')).toBeInTheDocument();
      expect(screen.getByText('Dự án hoặc trách nhiệm chính')).toBeInTheDocument();
    });

    it('should handle Shift+Enter without advancing steps', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      await user.type(projectTextarea, 'Line 1');
      
      // Shift+Enter should not advance step
      fireEvent.keyDown(projectTextarea, { key: 'Enter', shiftKey: true });
      
      // Should still be on step 1
      expect(screen.getByText('Bước 1 / 3')).toBeInTheDocument();
    });

    it('should work with mixed Vietnamese and English content', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      // Step 1: Mixed content
      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      await user.type(projectTextarea, 'Develop CRM system cho thị trường Việt Nam');
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
      });

      // Step 2: Mixed impact
      const impactTextarea = screen.getByPlaceholderText(/Ví dụ: Tăng hiệu suất bán hàng/);
      await user.type(impactTextarea, 'Increased efficiency by 30% và cải thiện customer satisfaction');
      fireEvent.keyDown(impactTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 3 / 3')).toBeInTheDocument();
      });
    });
  });

  describe('Composition State Management', () => {
    it('should reset composition state on blur', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      
      // Simulate composition start without proper end
      fireEvent.compositionStart(projectTextarea);
      await user.type(projectTextarea, 'Phát triển app');
      
      // Blur the textarea (simulates clicking away)
      fireEvent.blur(projectTextarea);
      
      // Now Enter should work normally
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
      });
    });

    it('should properly handle multiple composition cycles', async () => {
      const user = userEvent.setup();
      render(<AIWizardModal {...defaultProps} />);

      const projectTextarea = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      
      // Test multiple composition cycles
      fireEvent.compositionStart(projectTextarea);
      await user.type(projectTextarea, 'Phá');
      fireEvent.compositionEnd(projectTextarea);
      
      fireEvent.compositionStart(projectTextarea);
      await user.type(projectTextarea, 't tri');
      fireEvent.compositionEnd(projectTextarea);
      
      fireEvent.compositionStart(projectTextarea);
      await user.type(projectTextarea, 'ển app');
      fireEvent.compositionEnd(projectTextarea);

      // Should have complete text
      expect(projectTextarea).toHaveValue('Phát triển app');
      
      // Should advance normally after composition
      fireEvent.keyDown(projectTextarea, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Bước 2 / 3')).toBeInTheDocument();
      });
    });
  });
}); 