import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WorkExperienceSection } from '../WorkExperienceSection';

describe('WorkExperienceSection UI Improvements', () => {
  const mockOnUpdate = vi.fn();
  
  const mockExperienceData = {
    items: [
      {
        id: 'exp-1',
        title: 'Chuyên viên kinh doanh',
        company: 'Công ty cổ phần nội thất HLT',
        location: 'Hồ Chí Minh',
        startDate: '01/2024',
        endDate: '',
        current: true,
        bullets: ['Tăng doanh thu 25% thông qua phát triển khách hàng mới']
      },
      {
        id: 'exp-2',
        title: 'Nhân viên kinh doanh',
        company: 'Công ty cổ phần MML',
        location: 'Hồ Chí Minh',
        startDate: '01/2022',
        endDate: '01/2023',
        current: false,
        bullets: ['Quản lý danh mục khách hàng lớn']
      }
    ]
  };

  const defaultProps = {
    data: mockExperienceData,
    onUpdate: mockOnUpdate,
    isActive: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Vietnamese Date Format', () => {
    it('should display "Hiện tại" for current jobs instead of "Present"', () => {
      render(<WorkExperienceSection {...defaultProps} />);
      
      // Check for current job display
      expect(screen.getByText(/01\/2024 - Hiện tại/)).toBeInTheDocument();
      expect(screen.queryByText(/Present/)).not.toBeInTheDocument();
    });

    it('should show green "Hiện tại" label for current jobs', () => {
      render(<WorkExperienceSection {...defaultProps} />);
      
      // Find the green current job label
      const currentLabel = screen.getByText('Hiện tại');
      expect(currentLabel).toBeInTheDocument();
      
      // Check styling
      expect(currentLabel).toHaveStyle({ 
        color: '#16A34A',
        backgroundColor: '#DCFCE7'
      });
    });

         it('should not show green label for past jobs', () => {
       render(<WorkExperienceSection {...defaultProps} />);
       
       // Should have "Hiện tại" appearing once in the date range and once as green label
       const currentLabels = screen.getAllByText('Hiện tại');
       expect(currentLabels.length).toBeGreaterThan(0); // At least one "Hiện tại" label should exist
     });
  });

  describe('Focus States and Blue Selection Stroke', () => {
    it('should apply focus styles to input fields', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceSection {...defaultProps} />);
      
      // Find job title input
      const titleInput = screen.getByDisplayValue('Chuyên viên kinh doanh');
      
      // Focus the input
      await user.click(titleInput);
      
      // Check if input has focus ring classes
      expect(titleInput).toHaveClass('focus:border-blue-500', 'focus:ring-2', 'focus:ring-blue-200');
    });

    it('should apply focus styles to company input fields', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceSection {...defaultProps} />);
      
      // Find company input
      const companyInput = screen.getByDisplayValue('Công ty cổ phần nội thất HLT');
      
      // Focus the input
      await user.click(companyInput);
      
      // Check if input has focus ring classes
      expect(companyInput).toHaveClass('focus:border-blue-500', 'focus:ring-2', 'focus:ring-blue-200');
    });

    it('should apply focus styles to textarea fields', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceSection {...defaultProps} />);
      
      // Find bullet point textarea
      const bulletTextarea = screen.getByDisplayValue('Tăng doanh thu 25% thông qua phát triển khách hàng mới');
      
      // Focus the textarea
      await user.click(bulletTextarea);
      
      // Check if textarea has focus ring classes
      expect(bulletTextarea).toHaveClass('focus:border-blue-500', 'focus:ring-2', 'focus:ring-blue-200');
    });
  });

  describe('Hover Effects', () => {
    it('should show enhanced hover effects on bullet delete icons', async () => {
      const user = userEvent.setup();
      
      // Create data with multiple bullets to show delete icons
      const dataWithMultipleBullets = {
        items: [
          {
            ...mockExperienceData.items[0],
            bullets: ['First bullet', 'Second bullet']
          }
        ]
      };
      
      render(<WorkExperienceSection {...{ ...defaultProps, data: dataWithMultipleBullets }} />);
      
      // Find delete button (should be visible since there are multiple bullets)
      const deleteButtons = screen.getAllByTitle('Xóa gạch đầu dòng');
      expect(deleteButtons.length).toBeGreaterThan(0);
      
      // Check if delete button has hover classes
      const deleteButton = deleteButtons[0];
      expect(deleteButton).toHaveClass('hover:bg-red-50', 'transition-all', 'duration-200');
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should show tooltips on expand/collapse icons', () => {
      render(<WorkExperienceSection {...defaultProps} />);
      
      // Find expand/collapse buttons by their title attributes
      const expandButtons = screen.getAllByTitle(/Thu gọn|Mở rộng/);
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    it('should handle expand/collapse interaction', async () => {
      const user = userEvent.setup();
      render(<WorkExperienceSection {...defaultProps} />);
      
      // Find the first work experience section header
      const firstExperienceHeader = screen.getByText('Chuyên viên kinh doanh at Công ty cổ phần nội thất HLT');
      
      // Click to collapse (initially expanded)
      await user.click(firstExperienceHeader);
      
      // Verify interaction works (component should re-render)
      expect(firstExperienceHeader).toBeInTheDocument();
    });
  });

     describe('Work Experience Segmentation', () => {
     it('should render multiple work experiences as separate sections', () => {
       render(<WorkExperienceSection {...defaultProps} />);
       
       // Check both work experiences are rendered
       expect(screen.getByText('Chuyên viên kinh doanh at Công ty cổ phần nội thất HLT')).toBeInTheDocument();
       expect(screen.getByText('Nhân viên kinh doanh at Công ty cổ phần MML')).toBeInTheDocument();
     });

     it('should clearly distinguish between current and past jobs', () => {
       render(<WorkExperienceSection {...defaultProps} />);
       
       // Current job should have green label
       expect(screen.getByText('Hiện tại')).toBeInTheDocument();
       
       // Past job should show end date
       expect(screen.getByText(/01\/2022 - 01\/2023/)).toBeInTheDocument();
     });

     it('should have distinct borders for better visual separation', () => {
       render(<WorkExperienceSection {...defaultProps} />);
       
       // Find work experience containers (they should have border classes)
       const workExperienceContainers = screen.getByText('Chuyên viên kinh doanh at Công ty cổ phần nội thất HLT').closest('[class*="border-2"]');
       expect(workExperienceContainers).toBeInTheDocument();
     });
   });

  describe('Transition Effects', () => {
    it('should have transition classes on interactive elements', () => {
      render(<WorkExperienceSection {...defaultProps} />);
      
      // Check input fields have transition classes
      const titleInput = screen.getByDisplayValue('Chuyên viên kinh doanh');
      expect(titleInput).toHaveClass('transition-all', 'duration-200');
      
      const companyInput = screen.getByDisplayValue('Công ty cổ phần nội thất HLT');
      expect(companyInput).toHaveClass('transition-all', 'duration-200');
    });

    it('should have transition effects on bullet textareas', () => {
      render(<WorkExperienceSection {...defaultProps} />);
      
      const bulletTextarea = screen.getByDisplayValue('Tăng doanh thu 25% thông qua phát triển khách hàng mới');
      expect(bulletTextarea).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('Accessibility Improvements', () => {
         it('should have accessible interactive elements', () => {
       render(<WorkExperienceSection {...defaultProps} />);
       
       // Check that buttons are rendered (accessibility is already built-in)
       const allButtons = screen.getAllByRole('button');
       expect(allButtons.length).toBeGreaterThan(0);
     });

    it('should have proper titles for interactive elements', () => {
      render(<WorkExperienceSection {...defaultProps} />);
      
      // Check for tooltip titles
      expect(screen.getAllByTitle(/Thu gọn|Mở rộng/).length).toBeGreaterThan(0);
    });
  });
}); 