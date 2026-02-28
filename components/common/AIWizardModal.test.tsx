import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIWizardModal } from './AIWizardModal';

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  onGenerate: jest.fn(),
  jobTitle: 'Software Engineer',
  company: 'Tech Corp',
  isGenerating: false
};

describe('AIWizardModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<AIWizardModal {...mockProps} isOpen={false} />);
      expect(screen.queryByText('Tạo mô tả công việc nhanh')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<AIWizardModal {...mockProps} />);
      expect(screen.getByText('Tạo mô tả công việc nhanh')).toBeInTheDocument();
    });

    it('should display job title and company in step 1', () => {
      render(<AIWizardModal {...mockProps} />);
      expect(screen.getByText(/Software Engineer tại Tech Corp/)).toBeInTheDocument();
    });

    it('should render step 1 content initially', () => {
      render(<AIWizardModal {...mockProps} />);
      expect(screen.getByText('Dự án/Công việc chính')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/)).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to step 2 when next button is clicked with valid data', async () => {
      render(<AIWizardModal {...mockProps} />);
      
      // Fill in project field
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.change(projectInput, { target: { value: 'Test Project' } });
      
      // Click next
      const nextButton = screen.getByText('Tiếp theo');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Tác động/Kết quả')).toBeInTheDocument();
      });
    });

    it('should not navigate to step 2 when project field is empty', () => {
      render(<AIWizardModal {...mockProps} />);
      
      const nextButton = screen.getByText('Tiếp theo');
      fireEvent.click(nextButton);
      
      // Should still be on step 1
      expect(screen.getByText('Dự án/Công việc chính')).toBeInTheDocument();
    });

    it('should navigate back to step 1 from step 2', async () => {
      render(<AIWizardModal {...mockProps} />);
      
      // Go to step 2
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.change(projectInput, { target: { value: 'Test Project' } });
      fireEvent.click(screen.getByText('Tiếp theo'));
      
      await waitFor(() => {
        expect(screen.getByText('Tác động/Kết quả')).toBeInTheDocument();
      });
      
      // Go back to step 1
      const backButton = screen.getByText('Quay lại');
      fireEvent.click(backButton);
      
      await waitFor(() => {
        expect(screen.getByText('Dự án/Công việc chính')).toBeInTheDocument();
      });
    });

    it('should navigate to step 3 from step 2 with valid impact data', async () => {
      render(<AIWizardModal {...mockProps} />);
      
      // Navigate to step 2
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.change(projectInput, { target: { value: 'Test Project' } });
      fireEvent.click(screen.getByText('Tiếp theo'));
      
      await waitFor(() => {
        expect(screen.getByText('Tác động/Kết quả')).toBeInTheDocument();
      });
      
      // Fill impact and navigate to step 3
      const impactInput = screen.getByPlaceholderText(/Ví dụ: Tăng hiệu suất 30%, giảm thời gian xử lý 50%/);
      fireEvent.change(impactInput, { target: { value: 'Increased efficiency by 50%' } });
      fireEvent.click(screen.getByText('Tiếp theo'));
      
      await waitFor(() => {
        expect(screen.getByText('Vai trò/Trách nhiệm')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should require project field to be filled before proceeding', () => {
      render(<AIWizardModal {...mockProps} />);
      
      const nextButton = screen.getByText('Tiếp theo');
      fireEvent.click(nextButton);
      
      // Should still show step 1 content
      expect(screen.getByText('Dự án/Công việc chính')).toBeInTheDocument();
    });

    it('should require impact field to be filled before proceeding to step 3', async () => {
      render(<AIWizardModal {...mockProps} />);
      
      // Navigate to step 2
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.change(projectInput, { target: { value: 'Test Project' } });
      fireEvent.click(screen.getByText('Tiếp theo'));
      
      await waitFor(() => {
        expect(screen.getByText('Tác động/Kết quả')).toBeInTheDocument();
      });
      
      // Try to proceed without filling impact
      const nextButton = screen.getByText('Tiếp theo');
      fireEvent.click(nextButton);
      
      // Should still be on step 2
      expect(screen.getByText('Tác động/Kết quả')).toBeInTheDocument();
    });
  });

  describe('Generation Process', () => {
    it('should call onGenerate with correct data when generate button is clicked', async () => {
      render(<AIWizardModal {...mockProps} />);
      
      // Fill all steps
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.change(projectInput, { target: { value: 'Test Project' } });
      fireEvent.click(screen.getByText('Tiếp theo'));
      
      await waitFor(() => {
        const impactInput = screen.getByPlaceholderText(/Ví dụ: Tăng hiệu suất 30%/);
        fireEvent.change(impactInput, { target: { value: 'Test Impact' } });
        fireEvent.click(screen.getByText('Tiếp theo'));
      });
      
      await waitFor(() => {
        const responsibilityInput = screen.getByPlaceholderText(/Ví dụ: Lập kế hoạch, thiết kế/);
        fireEvent.change(responsibilityInput, { target: { value: 'Test Responsibility' } });
        
        const generateButton = screen.getByText('Tạo gạch đầu dòng');
        fireEvent.click(generateButton);
      });
      
      expect(mockProps.onGenerate).toHaveBeenCalledWith({
        project: 'Test Project',
        impact: 'Test Impact',
        responsibility: 'Test Responsibility'
      });
    });

    it('should disable generate button when isGenerating is true', async () => {
      // First render without isGenerating to navigate to step 3
      const { rerender } = render(<AIWizardModal {...mockProps} />);
      
      // Navigate to step 3
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.change(projectInput, { target: { value: 'Test Project' } });
      fireEvent.click(screen.getByText('Tiếp theo'));
      
      await waitFor(() => {
        const impactInput = screen.getByPlaceholderText(/Ví dụ: Tăng hiệu suất 30%, giảm thời gian xử lý 50%/);
        fireEvent.change(impactInput, { target: { value: 'Test Impact' } });
        fireEvent.click(screen.getByText('Tiếp theo'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Vai trò/Trách nhiệm')).toBeInTheDocument();
      });
      
      // Now rerender with isGenerating true
      rerender(<AIWizardModal {...mockProps} isGenerating={true} />);
      
      await waitFor(() => {
        const generateButton = screen.getByText('Đang tạo...');
        expect(generateButton).toBeDisabled();
      });
    });

    it('should show generating state text when isGenerating is true', async () => {
      // First render without isGenerating to navigate to step 3
      const { rerender } = render(<AIWizardModal {...mockProps} />);
      
      // Navigate to final step
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.change(projectInput, { target: { value: 'Test Project' } });
      fireEvent.click(screen.getByText('Tiếp theo'));
      
      await waitFor(() => {
        const impactInput = screen.getByPlaceholderText(/Ví dụ: Tăng hiệu suất 30%, giảm thời gian xử lý 50%/);
        fireEvent.change(impactInput, { target: { value: 'Test Impact' } });
        fireEvent.click(screen.getByText('Tiếp theo'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Vai trò/Trách nhiệm')).toBeInTheDocument();
      });
      
      // Now rerender with isGenerating true
      rerender(<AIWizardModal {...mockProps} isGenerating={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Đang tạo...')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Controls', () => {
    it('should call onClose when close button is clicked', () => {
      render(<AIWizardModal {...mockProps} />);
      
      const closeButton = screen.getByLabelText('Đóng');
      fireEvent.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when skip button is clicked', () => {
      render(<AIWizardModal {...mockProps} />);
      
      const skipButton = screen.getByText('Bỏ qua');
      fireEvent.click(skipButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      render(<AIWizardModal {...mockProps} />);
      
      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty job title gracefully', () => {
      render(<AIWizardModal {...mockProps} jobTitle="" />);
      expect(screen.getByText('Tạo mô tả công việc nhanh')).toBeInTheDocument();
    });

    it('should handle empty company gracefully', () => {
      render(<AIWizardModal {...mockProps} company="" />);
      expect(screen.getByText('Tạo mô tả công việc nhanh')).toBeInTheDocument();
    });

    it('should reset form when modal is reopened', () => {
      const { rerender } = render(<AIWizardModal {...mockProps} isOpen={false} />);
      
      // Open modal and fill form
      rerender(<AIWizardModal {...mockProps} isOpen={true} />);
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      fireEvent.change(projectInput, { target: { value: 'Test Project' } });
      
      // Close and reopen modal
      rerender(<AIWizardModal {...mockProps} isOpen={false} />);
      rerender(<AIWizardModal {...mockProps} isOpen={true} />);
      
      // Form should be reset
      const newProjectInput = screen.getByPlaceholderText(/Ví dụ: Phát triển hệ thống CRM/);
      expect(newProjectInput).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AIWizardModal {...mockProps} />);
      
      expect(screen.getByLabelText('Đóng')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should trap focus within modal', () => {
      render(<AIWizardModal {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });
}); 