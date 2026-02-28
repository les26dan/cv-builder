import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkExperienceWizard } from '../WorkExperienceWizard';
import { vi } from 'vitest';

describe('WorkExperienceWizard', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    isGenerating: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Wizard Flow', () => {
    test('renders first step correctly', () => {
      render(<WorkExperienceWizard {...defaultProps} />);
      
      expect(screen.getByText('Chức danh công việc của bạn là gì?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Chuyên viên kinh doanh/)).toBeInTheDocument();
      expect(screen.getByText('Bước 1 / 7')).toBeInTheDocument();
    });

    test('progresses through all steps with valid data', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Step 1: Job Title
      await user.type(screen.getByPlaceholderText(/Chuyên viên kinh doanh/), 'Software Engineer');
      await user.click(screen.getByText('Tiếp theo'));

      // Step 2: Company
      expect(screen.getByText('Tên công ty hoặc tổ chức?')).toBeInTheDocument();
      await user.type(screen.getByPlaceholderText(/Công ty cổ phần ABC/), 'Tech Corp');
      await user.click(screen.getByText('Tiếp theo'));

      // Step 3: Dates
      expect(screen.getByText('Thời gian làm việc')).toBeInTheDocument();
      await user.type(screen.getByPlaceholderText('12/2023 hoặc 2023'), '01/2023');
      await user.type(screen.getByPlaceholderText('12/2024 hoặc 2024'), '12/2023');
      await user.click(screen.getByText('Tiếp theo'));

      // Step 4: Location
      expect(screen.getByText('Địa điểm làm việc (tùy chọn)')).toBeInTheDocument();
      await user.type(screen.getByPlaceholderText(/Hồ Chí Minh/), 'Ho Chi Minh City');
      await user.click(screen.getByText('Tiếp theo'));

      // Step 5: Project (AI Section starts)
      expect(screen.getByText('🎯 Tạo mô tả công việc với AI')).toBeInTheDocument();
      expect(screen.getByText('Dự án hoặc trách nhiệm chính')).toBeInTheDocument();
      await user.type(
        screen.getByPlaceholderText(/Phát triển hệ thống CRM/),
        'Developed mobile application'
      );
      await user.click(screen.getByText('Tiếp theo'));

      // Step 6: Impact
      expect(screen.getByText('💡 Mẹo: Sử dụng số liệu cụ thể')).toBeInTheDocument();
      await user.type(
        screen.getByPlaceholderText(/Tăng hiệu suất bán hàng/),
        'Increased user engagement by 40%'
      );
      await user.click(screen.getByText('Tiếp theo'));

      // Step 7: Responsibility
      expect(screen.getByText('Vai trò và phạm vi trách nhiệm (tùy chọn)')).toBeInTheDocument();
      await user.type(
        screen.getByPlaceholderText(/Lãnh đạo nhóm 5 người/),
        'Led team of 3 developers'
      );

      // Final step - generate
      expect(screen.getByText('Tạo với AI')).toBeInTheDocument();
    });

    test('can go back to previous steps', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Go to step 2
      await user.type(screen.getByPlaceholderText(/Chuyên viên kinh doanh/), 'Software Engineer');
      await user.click(screen.getByText('Tiếp theo'));

      // Go back to step 1
      await user.click(screen.getByText('Quay lại'));
      expect(screen.getByText('Chức danh công việc của bạn là gì?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument();
    });

    test('shows progress indicator correctly', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Check initial progress
      expect(screen.getByText('Bước 1 / 7')).toBeInTheDocument();
      
      // Progress to step 2
      await user.type(screen.getByPlaceholderText(/Chuyên viên kinh doanh/), 'Software Engineer');
      await user.click(screen.getByText('Tiếp theo'));
      
      expect(screen.getByText('Bước 2 / 7')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    test('prevents progression with empty required fields', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Try to proceed without filling job title
      await user.click(screen.getByText('Tiếp theo'));
      
      expect(screen.getByText('Vui lòng nhập chức danh công việc')).toBeInTheDocument();
      // Should still be on step 1
      expect(screen.getByText('Bước 1 / 7')).toBeInTheDocument();
    });

    test('validates date logic', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Go through steps to dates
      await user.type(screen.getByPlaceholderText(/Chuyên viên kinh doanh/), 'Software Engineer');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Công ty cổ phần ABC/), 'Tech Corp');
      await user.click(screen.getByText('Tiếp theo'));

      // Enter invalid dates (end before start)
      await user.type(screen.getByPlaceholderText('12/2023 hoặc 2023'), '2023');
      await user.type(screen.getByPlaceholderText('12/2024 hoặc 2024'), '2022');
      await user.click(screen.getByText('Tiếp theo'));

      expect(screen.getByText('Ngày kết thúc phải sau ngày bắt đầu')).toBeInTheDocument();
    });

    test('handles current job checkbox correctly', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Go to dates step
      await user.type(screen.getByPlaceholderText(/Chuyên viên kinh doanh/), 'Software Engineer');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Công ty cổ phần ABC/), 'Tech Corp');
      await user.click(screen.getByText('Tiếp theo'));

      // Enter start date and check current job
      await user.type(screen.getByPlaceholderText('12/2023 hoặc 2023'), '2023');
      await user.click(screen.getByLabelText('Tôi hiện đang làm việc ở đây'));
      
      // End date should be disabled
      const endDateInput = screen.getByPlaceholderText('12/2024 hoặc 2024');
      expect(endDateInput).toBeDisabled();
      
      // Should be able to proceed without end date
      await user.click(screen.getByText('Tiếp theo'));
      expect(screen.getByText('Địa điểm làm việc (tùy chọn)')).toBeInTheDocument();
    });

    test('validates AI wizard required fields', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Complete basic info steps
      await user.type(screen.getByPlaceholderText(/Chuyên viên kinh doanh/), 'Software Engineer');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Công ty cổ phần ABC/), 'Tech Corp');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText('12/2023 hoặc 2023'), '2023');
      await user.click(screen.getByLabelText('Tôi hiện đang làm việc ở đây'));
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.click(screen.getByText('Tiếp theo')); // Skip location
      
      // Try to proceed without project description
      await user.click(screen.getByText('Tiếp theo'));
      expect(screen.getByText('Vui lòng mô tả dự án hoặc trách nhiệm chính')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('closes wizard on close button click', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      await user.click(screen.getByLabelText('Đóng'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('shows confirmation on cancel', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(<WorkExperienceWizard {...defaultProps} />);

      await user.click(screen.getByText('Hủy'));
      expect(confirmSpy).toHaveBeenCalledWith(
        'Bạn có chắc chắn muốn hủy? Tất cả thông tin đã nhập sẽ bị mất.'
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      confirmSpy.mockRestore();
    });

    test('allows skipping AI with confirmation', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(<WorkExperienceWizard {...defaultProps} />);

      // Complete basic info steps quickly
      await user.type(screen.getByPlaceholderText(/Chuyên viên kinh doanh/), 'Software Engineer');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Công ty cổ phần ABC/), 'Tech Corp');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText('12/2023 hoặc 2023'), '2023');
      await user.click(screen.getByLabelText('Tôi hiện đang làm việc ở đây'));
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.click(screen.getByText('Tiếp theo')); // Skip location
      
      // Now in AI section - try to skip
      expect(screen.getByText('Bỏ qua AI')).toBeInTheDocument();
      await user.click(screen.getByText('Bỏ qua AI'));
      
      expect(confirmSpy).toHaveBeenCalledWith(
        'Bỏ qua AI sẽ yêu cầu bạn tự viết gạch đầu dòng. Bạn có chắc chắn?'
      );
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          aiGenerated: false,
          bullets: ['']
        })
      );

      confirmSpy.mockRestore();
    });

    test('handles form submit with AI generation', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Complete all steps
      await user.type(screen.getByPlaceholderText(/Chuyên viên kinh doanh/), 'Software Engineer');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Công ty cổ phần ABC/), 'Tech Corp');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText('12/2023 hoặc 2023'), '01/2023');
      await user.type(screen.getByPlaceholderText('12/2024 hoặc 2024'), '12/2023');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Hồ Chí Minh/), 'HCM');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Phát triển hệ thống CRM/), 'Developed app');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Tăng hiệu suất bán hàng/), 'Increased efficiency 30%');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Lãnh đạo nhóm 5 người/), 'Led team');
      
      // Submit with AI
      await user.click(screen.getByText('Tạo với AI'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Software Engineer',
          company: 'Tech Corp',
          startDate: '01/2023',
          endDate: '12/2023',
          current: false,
          location: 'HCM',
          project: 'Developed app',
          impact: 'Increased efficiency 30%',
          responsibility: 'Led team',
          aiGenerated: true,
          bullets: []
        })
      );
    });
  });

  describe('Loading States', () => {
    test('disables form when generating', () => {
      render(<WorkExperienceWizard {...defaultProps} isGenerating={true} />);

      const input = screen.getByPlaceholderText(/Chuyên viên kinh doanh/);
      expect(input).toBeDisabled();
      
      const nextButton = screen.getByText('Tiếp theo');
      expect(nextButton).toBeDisabled();
      
      const closeButton = screen.getByLabelText('Đóng');
      expect(closeButton).toBeDisabled();
    });

    test('shows loading state on final step', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceWizard {...defaultProps} />);

      // Navigate to final step
      await user.type(screen.getByPlaceholderText(/Chuyên viên kinh doanh/), 'Software Engineer');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Công ty cổ phần ABC/), 'Tech Corp');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText('12/2023 hoặc 2023'), '2023');
      await user.click(screen.getByLabelText('Tôi hiện đang làm việc ở đây'));
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.click(screen.getByText('Tiếp theo')); // Skip location
      
      await user.type(screen.getByPlaceholderText(/Phát triển hệ thống CRM/), 'Developed app');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Tăng hiệu suất bán hàng/), 'Increased efficiency');
      await user.click(screen.getByText('Tiếp theo'));

      // Final step - check button text
      expect(screen.getByText('Tạo với AI')).toBeInTheDocument();

      // Simulate loading state
      render(<WorkExperienceWizard {...defaultProps} isGenerating={true} />);
      expect(screen.getByText('Đang tạo...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<WorkExperienceWizard {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Thêm kinh nghiệm làm việc');
      expect(screen.getByLabelText('Đóng')).toBeInTheDocument();
    });

         test('supports keyboard navigation', async () => {
       const user = userEvent.setup();
       render(<WorkExperienceWizard {...defaultProps} />);

       const input = screen.getByPlaceholderText(/Chuyên viên kinh doanh/);
       
       // Focus should be on the input initially (autoFocus)
       expect(input).toHaveFocus();

       // Tab navigation should work
       await user.tab();
       expect(screen.getByText('Hủy')).toHaveFocus();
     });

     test('advances to next step on Enter key press', async () => {
       const user = userEvent.setup();
       render(<WorkExperienceWizard {...defaultProps} />);

       // Step 1: Job Title
       const titleInput = screen.getByPlaceholderText(/Chuyên viên kinh doanh/);
       await user.type(titleInput, 'Software Engineer');
       await user.keyboard('{Enter}');
       
       // Should advance to step 2
       expect(screen.getByText('Bước 2 / 7')).toBeInTheDocument();
       expect(screen.getByText('Tên công ty hoặc tổ chức?')).toBeInTheDocument();
     });

     test('does not advance on Enter if validation fails', async () => {
       const user = userEvent.setup();
       render(<WorkExperienceWizard {...defaultProps} />);

       // Try to advance without filling required field
       const titleInput = screen.getByPlaceholderText(/Chuyên viên kinh doanh/);
       await user.keyboard('{Enter}');
       
       // Should stay on step 1
       expect(screen.getByText('Bước 1 / 7')).toBeInTheDocument();
       expect(screen.getByText('Vui lòng nhập chức danh công việc')).toBeInTheDocument();
     });
  });

  describe('Edge Cases', () => {
    test('handles modal not open', () => {
      const { container } = render(
        <WorkExperienceWizard {...defaultProps} isOpen={false} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    test('resets form data when modal reopens', () => {
      const { rerender } = render(
        <WorkExperienceWizard {...defaultProps} isOpen={false} />
      );

      // Open and enter some data
      rerender(<WorkExperienceWizard {...defaultProps} isOpen={true} />);
      
      const input = screen.getByPlaceholderText(/Chuyên viên kinh doanh/);
      fireEvent.change(input, { target: { value: 'Test Job' } });
      expect(input).toHaveValue('Test Job');

      // Close and reopen
      rerender(<WorkExperienceWizard {...defaultProps} isOpen={false} />);
      rerender(<WorkExperienceWizard {...defaultProps} isOpen={true} />);

      // Data should be reset
      const newInput = screen.getByPlaceholderText(/Chuyên viên kinh doanh/);
      expect(newInput).toHaveValue('');
      expect(screen.getByText('Bước 1 / 7')).toBeInTheDocument();
    });

    test('handles form submission with partial data', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to allow skipping AI
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(<WorkExperienceWizard {...defaultProps} />);

      // Enter minimal required data
      await user.type(screen.getByPlaceholderText(/Chuyên viên kinh doanh/), 'Engineer');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText(/Công ty cổ phần ABC/), 'Company');
      await user.click(screen.getByText('Tiếp theo'));
      
      await user.type(screen.getByPlaceholderText('12/2023 hoặc 2023'), '2023');
      await user.click(screen.getByLabelText('Tôi hiện đang làm việc ở đây'));
      await user.click(screen.getByText('Tiếp theo'));
      
      // Skip location
      await user.click(screen.getByText('Tiếp theo'));
      
      // Skip AI entirely
      await user.click(screen.getByText('Bỏ qua AI'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Engineer',
          company: 'Company',
          location: '',
          current: true,
          aiGenerated: false
        })
      );

      confirmSpy.mockRestore();
    });
  });
}); 