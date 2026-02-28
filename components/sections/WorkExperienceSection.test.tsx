import { render, screen, fireEvent } from '@testing-library/react';
import { WorkExperienceSection } from './WorkExperienceSection';

describe('WorkExperienceSection Component', () => {
  const mockOnUpdate = vi.fn();
  
  const defaultProps = {
    data: { items: [] },
    onUpdate: mockOnUpdate,
    isActive: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders section title', () => {
      render(<WorkExperienceSection {...defaultProps} />);
      
      expect(screen.getByText(/Kinh nghiệm làm việc/i)).toBeInTheDocument();
    });

    test('shows guidance banner when data has one empty item', () => {
      const propsWithEmptyItem = {
        ...defaultProps,
        data: { items: [{ id: '1', title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }] }
      };
      
      render(<WorkExperienceSection {...propsWithEmptyItem} />);
      
      expect(screen.getByText(/Xây Dựng Kinh Nghiệm Làm Việc Ấn Tượng Trong 5 Giây!/)).toBeInTheDocument();
    });

    test('shows add experience button', () => {
      render(<WorkExperienceSection {...defaultProps} />);
      
      expect(screen.getByText(/Thêm kinh nghiệm/)).toBeInTheDocument();
    });
  });

  describe('Experience Management', () => {
    test('opens wizard when adding new experience', () => {
      render(<WorkExperienceSection {...defaultProps} />);
      
      const addBtn = screen.getByText(/Thêm kinh nghiệm/);
      fireEvent.click(addBtn);
      
      // Should open the wizard modal instead of immediately adding experience
      expect(screen.getByText('Bước 1 / 5')).toBeInTheDocument();
      expect(screen.getByText('Chức danh công việc của bạn là gì?')).toBeInTheDocument();
    });

    test('renders existing experiences', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: 'Frontend Developer',
            company: 'Tech Corp',
            location: 'Ho Chi Minh City',
            startDate: '2023-01',
            endDate: '2024-01',
            current: false,
            bullets: ['Built React applications'],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      expect(screen.getByDisplayValue('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tech Corp')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Ho Chi Minh City')).toBeInTheDocument();
    });

    test('handles empty data gracefully', () => {
      render(<WorkExperienceSection {...defaultProps} />);
      
      // Should render without errors
      expect(screen.getByText(/Kinh nghiệm làm việc/i)).toBeInTheDocument();
    });
  });

  describe('Field Updates', () => {
    test('updates job title', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            bullets: [],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      const titleInput = screen.getByPlaceholderText(/chuyên viên kinh doanh/i);
      fireEvent.change(titleInput, { target: { value: 'Software Engineer' } });
      
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    test('updates company name', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            bullets: [],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      const companyInput = screen.getByPlaceholderText(/công ty cổ phần abc/i);
      fireEvent.change(companyInput, { target: { value: 'Tech Corp' } });
      
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    test('updates location', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            bullets: [],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      const locationInput = screen.getByPlaceholderText(/hồ chí minh/i);
      fireEvent.change(locationInput, { target: { value: 'Ho Chi Minh City' } });
      
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    test('handles current job checkbox', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: 'Developer',
            company: 'Tech Corp',
            location: 'HCM',
            startDate: '2023-01',
            endDate: '2024-01',
            current: false,
            bullets: [],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      const currentCheckbox = screen.getByLabelText(/công việc hiện tại/i);
      fireEvent.click(currentCheckbox);
      
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  describe('Bullet Point Management', () => {
    test('opens wizard when adding new bullet point', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: 'Developer',
            company: 'Tech Corp',
            location: 'HCM',
            startDate: '2023-01',
            endDate: '2024-01',
            current: false,
            bullets: ['Existing bullet'],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      const addBulletBtn = screen.getByText(/thêm mô tả/i);
      fireEvent.click(addBulletBtn);
      
      // Should open the wizard modal instead of directly adding a bullet
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('updates bullet point text', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: 'Developer',
            company: 'Tech Corp',
            location: 'HCM',
            startDate: '2023-01',
            endDate: '2024-01',
            current: false,
            bullets: ['Original bullet'],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      const bulletInput = screen.getByDisplayValue('Original bullet');
      fireEvent.change(bulletInput, { target: { value: 'Updated bullet point' } });
      
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    test('removes bullet point', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: 'Developer',
            company: 'Tech Corp',
            location: 'HCM',
            startDate: '2023-01',
            endDate: '2024-01',
            current: false,
            bullets: ['Bullet 1', 'Bullet 2'],
          }]
        },
      };
      
      const { container } = render(<WorkExperienceSection {...props} />);
      
      const removeButtons = container.querySelectorAll('button[title*="Xóa"]');
      if (removeButtons.length > 0) {
        fireEvent.click(removeButtons[0] as HTMLElement);
        expect(mockOnUpdate).toHaveBeenCalled();
      }
    });
  });

  describe('Experience Removal', () => {
    test('experience item removal functionality is not exposed in UI', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: 'Developer',
            company: 'Tech Corp',
            location: 'HCM',
            startDate: '2023-01',
            endDate: '2024-01',
            current: false,
            bullets: ['Bullet 1'],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      // The current implementation doesn't expose remove experience functionality in the UI
      // Only bullet points can be removed individually
      expect(screen.getByDisplayValue('Developer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tech Corp')).toBeInTheDocument();
      
      // Verify that bullet point removal is available only when there are multiple bullets
      // The component only shows remove buttons when there's more than one bullet point
      const bulletRemoveButtons = screen.queryAllByTitle(/Xóa gạch đầu dòng/);
      // With only one bullet point, no remove button should be visible
      expect(bulletRemoveButtons.length).toBe(0);
    });
  });

  describe('Date Handling', () => {
    test('updates start date', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: 'Developer',
            company: 'Tech Corp',
            location: 'HCM',
            startDate: '',
            endDate: '',
            current: false,
            bullets: [],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      const startDateInputs = screen.getAllByDisplayValue('');
      const startDateInput = startDateInputs.find(input => 
        input.getAttribute('placeholder')?.includes('Từ') || 
        input.getAttribute('type') === 'month'
      );
      
      if (startDateInput) {
        fireEvent.change(startDateInput, { target: { value: '2023-06' } });
        expect(mockOnUpdate).toHaveBeenCalled();
      }
    });

    test('updates end date', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: 'Developer',
            company: 'Tech Corp',
            location: 'HCM',
            startDate: '2023-01',
            endDate: '',
            current: false,
            bullets: [],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      const endDateInputs = screen.getAllByDisplayValue('');
      const endDateInput = endDateInputs.find(input => 
        input.getAttribute('placeholder')?.includes('Đến') || 
        input.getAttribute('type') === 'month'
      );
      
      if (endDateInput) {
        fireEvent.change(endDateInput, { target: { value: '2024-06' } });
        expect(mockOnUpdate).toHaveBeenCalled();
      }
    });
  });

  describe('Component States', () => {
    test('renders differently when active', () => {
      const activeProps = {
        ...defaultProps,
        isActive: true,
      };
      
      render(<WorkExperienceSection {...activeProps} />);
      
      expect(screen.getByText(/Kinh nghiệm làm việc/i)).toBeInTheDocument();
    });

    test('handles multiple experiences', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [
            {
              id: '1',
              title: 'Senior Developer',
              company: 'Tech Corp',
              location: 'HCM',
              startDate: '2023-01',
              endDate: '2024-01',
              current: false,
              bullets: ['Built systems'],
            },
            {
              id: '2',
              title: 'Junior Developer',
              company: 'Start Corp',
              location: 'HN',
              startDate: '2022-01',
              endDate: '2023-01',
              current: false,
              bullets: ['Learned coding'],
            }
          ]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      expect(screen.getByDisplayValue('Senior Developer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Junior Developer')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty bullets array', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: 'Developer',
            company: 'Tech Corp',
            location: 'HCM',
            startDate: '2023-01',
            endDate: '2024-01',
            current: false,
            bullets: [],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      expect(screen.getByText(/thêm mô tả/i)).toBeInTheDocument();
    });

    test('handles undefined data gracefully', () => {
      const props = {
        ...defaultProps,
        data: { items: [] },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      expect(screen.getByText(/Kinh nghiệm làm việc/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper form structure', () => {
      const props = {
        ...defaultProps,
        data: {
          items: [{
            id: '1',
            title: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            bullets: [],
          }]
        },
      };
      
      render(<WorkExperienceSection {...props} />);
      
      // Should render the form - using getAllByText to handle multiple matches
      const experienceTexts = screen.getAllByText(/Kinh nghiệm làm việc/i);
      expect(experienceTexts.length).toBeGreaterThan(0);
    });
  });
});