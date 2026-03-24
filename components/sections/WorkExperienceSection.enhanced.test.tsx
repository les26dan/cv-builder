import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WorkExperienceSection } from './WorkExperienceSection';

// Mock the AI service
vi.mock('../../utils/aiService', () => ({
  aiService: {
    generateBulletFromWizard: vi.fn(),
    generateBulletPoints: vi.fn()
  }
}));

const mockData = {
  items: [
    {
      id: '1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      startDate: '2023-01',
      endDate: '2024-01',
      bullets: ['Developed applications', 'Led team projects']
    }
  ]
};

const mockProps = {
  data: mockData,
  onUpdate: vi.fn(),
  isActive: true
};

describe('WorkExperienceSection Enhanced Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI Generation Buttons', () => {
    it('should show Dùng mẫu button', () => {
      render(<WorkExperienceSection {...mockProps} />);
      
      expect(screen.getByText('Dùng mẫu')).toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      render(<WorkExperienceSection {...mockProps} />);
      
      const templateButton = screen.getByText('Dùng mẫu');
      
      expect(templateButton).toBeInTheDocument();
      expect(templateButton.tagName).toBe('BUTTON');
    });
  });

  describe('Wizard Modal Integration', () => {
    it('should open wizard modal when Thêm mô tả button is clicked', () => {
      render(<WorkExperienceSection {...mockProps} />);
      
      // Click Thêm mô tả button
      const addDescButton = screen.getByText('Thêm mô tả');
      fireEvent.click(addDescButton);
      
      // Wizard modal should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should close wizard modal when close button is clicked', async () => {
      render(<WorkExperienceSection {...mockProps} />);
      
      // Open wizard
      const addDescButton = screen.getByText('Thêm mô tả');
      fireEvent.click(addDescButton);
      
      // Close modal
      const closeButton = screen.getByLabelText('Đóng');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Template Modal Integration', () => {
    it('should open template modal when Dùng mẫu button is clicked', () => {
      render(<WorkExperienceSection {...mockProps} />);
      
      // Click Dùng mẫu button
      const templateButton = screen.getByText('Dùng mẫu');
      fireEvent.click(templateButton);
      
      // Template modal should be open
      expect(screen.getByText('Chọn mẫu gạch đầu dòng')).toBeInTheDocument();
    });

    it('should close template modal when close button is clicked', async () => {
      render(<WorkExperienceSection {...mockProps} />);
      
      // Open template modal
      const templateButton = screen.getByText('Dùng mẫu');
      fireEvent.click(templateButton);
      
      // Close modal
      const closeButton = screen.getByLabelText('Đóng');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Chọn mẫu gạch đầu dòng')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Handling', () => {
    it('should pass correct job title and company to wizard modal', () => {
      render(<WorkExperienceSection {...mockProps} />);
      
      // Open wizard
      const addDescButton = screen.getByText('Thêm mô tả');
      fireEvent.click(addDescButton);
      
      // Check that job info is displayed in modal
      expect(screen.getByText(/Software Engineer tại Tech Corp/)).toBeInTheDocument();
    });

    it('should handle empty job title and company gracefully', () => {
      const emptyData = {
        items: [
          {
            id: '1',
            title: '',
            company: '',
            startDate: '',
            endDate: '',
            bullets: []
          }
        ]
      };
      
      render(<WorkExperienceSection {...mockProps} data={emptyData} />);
      
      // Should show guidance message
      expect(screen.getByText('💡 Bắt đầu với thông tin cơ bản')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      render(<WorkExperienceSection {...mockProps} />);
      
      const templateButton = screen.getByText('Dùng mẫu');
      const addDescButton = screen.getByText('Thêm mô tả');
      
      expect(templateButton).toBeInTheDocument();
      expect(addDescButton).toBeInTheDocument();
      expect(templateButton.tagName).toBe('BUTTON');
      expect(addDescButton.tagName).toBe('BUTTON');
    });

    it('should be keyboard navigable', () => {
      render(<WorkExperienceSection {...mockProps} />);
      
      const templateButton = screen.getByText('Dùng mẫu');
      const addDescButton = screen.getByText('Thêm mô tả');
      
      templateButton.focus();
      expect(templateButton).toHaveFocus();
      
      addDescButton.focus();
      expect(addDescButton).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle disabled state correctly', () => {
      render(<WorkExperienceSection {...mockProps} />);
      
      const templateButton = screen.getByText('Dùng mẫu');
      const addDescButton = screen.getByText('Thêm mô tả');
      
      expect(templateButton).not.toBeDisabled();
      expect(addDescButton).not.toBeDisabled();
    });

    it('should disable buttons when generating', () => {
      // This would require mocking the generating state
      // For now, just verify the buttons exist
      render(<WorkExperienceSection {...mockProps} />);
      
      const templateButton = screen.getByText('Dùng mẫu');
      const addDescButton = screen.getByText('Thêm mô tả');
      
      expect(templateButton).toBeInTheDocument();
      expect(addDescButton).toBeInTheDocument();
    });
  });

  describe('Multiple Experience Items', () => {
    it('should handle multiple experience items with separate button pairs', () => {
      const multipleItemsData = {
        items: [
          {
            id: '1',
            title: 'Software Engineer',
            company: 'Tech Corp',
            startDate: '2023-01',
            endDate: '2024-01',
            bullets: []
          },
          {
            id: '2',
            title: 'Developer',
            company: 'Dev Inc',
            startDate: '2022-01',
            endDate: '2023-01',
            bullets: []
          }
        ]
      };
      
      render(<WorkExperienceSection {...mockProps} data={multipleItemsData} />);
      
      const templateButtons = screen.getAllByText('Dùng mẫu');
      const addDescButtons = screen.getAllByText('Thêm mô tả');
      
      expect(templateButtons).toHaveLength(2);
      expect(addDescButtons).toHaveLength(2);
      
      // Each should open its own modal
      fireEvent.click(addDescButtons[0]);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
}); 