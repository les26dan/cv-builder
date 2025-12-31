import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplateSelectionModal } from './TemplateSelectionModal';

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSelectTemplate: jest.fn(),
  jobTitle: 'Software Engineer'
};

describe('TemplateSelectionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<TemplateSelectionModal {...mockProps} isOpen={false} />);
      expect(screen.queryByText('Chọn mẫu gạch đầu dòng')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<TemplateSelectionModal {...mockProps} />);
      expect(screen.getByText('Chọn mẫu gạch đầu dòng')).toBeInTheDocument();
    });

    it('should display job title when provided', () => {
      render(<TemplateSelectionModal {...mockProps} />);
      expect(screen.getByText(/Software Engineer/)).toBeInTheDocument();
    });

    it('should render all template options', () => {
      render(<TemplateSelectionModal {...mockProps} />);
      
      expect(screen.getByText('Thành tựu với kết quả')).toBeInTheDocument();
      expect(screen.getByText('Triển khai dự án')).toBeInTheDocument();
      expect(screen.getByText('Quản lý và lãnh đạo')).toBeInTheDocument();
      expect(screen.getByText('Cải thiện quy trình')).toBeInTheDocument();
      expect(screen.getByText('Hợp tác nhóm')).toBeInTheDocument();
      expect(screen.getByText('Giải quyết vấn đề')).toBeInTheDocument();
    });
  });

  describe('Template Selection', () => {
    it('should call onSelectTemplate when a template is clicked', () => {
      render(<TemplateSelectionModal {...mockProps} />);
      
      const firstTemplate = screen.getByText('Thành tựu với kết quả').closest('div');
      fireEvent.click(firstTemplate!);
      
      expect(mockProps.onSelectTemplate).toHaveBeenCalledWith({
        id: 'achievement',
        title: 'Thành tựu với kết quả',
        content: 'Dẫn dắt [nhóm/dự án] để [đạt được mục tiêu], mang lại [tác động cụ thể].',
        example: 'Dẫn dắt nhóm 5 kỹ sư để triển khai hệ thống CRM mới, mang lại cải thiện hiệu suất 30%.'
      });
    });
  });

  describe('Modal Controls', () => {
    it('should call onClose when close button is clicked', () => {
      render(<TemplateSelectionModal {...mockProps} />);
      
      const closeButton = screen.getByLabelText('Đóng');
      fireEvent.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      render(<TemplateSelectionModal {...mockProps} />);
      
      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing jobTitle gracefully', () => {
      render(<TemplateSelectionModal {...mockProps} jobTitle={undefined} />);
      expect(screen.getByText('Chọn mẫu gạch đầu dòng')).toBeInTheDocument();
    });

    it('should handle empty jobTitle gracefully', () => {
      render(<TemplateSelectionModal {...mockProps} jobTitle="" />);
      expect(screen.getByText('Chọn mẫu gạch đầu dòng')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TemplateSelectionModal {...mockProps} />);
      
      expect(screen.getByLabelText('Đóng')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
}); 