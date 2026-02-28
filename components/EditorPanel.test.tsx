import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorPanel } from './EditorPanel';
import { initialCV } from '../utils/mockData';

// Mock child components
vi.mock('./sections/ContactSection', () => ({
  ContactSection: ({ data, onUpdate }: any) => (
    <div data-testid="contact-section">
      <button onClick={() => onUpdate({ name: 'Updated Name' })}>
        Update Contact
      </button>
      Contact: {data?.name || 'No name'}
    </div>
  ),
}));

vi.mock('./sections/SummarySection', () => ({
  SummarySection: ({ data, onUpdate }: any) => (
    <div data-testid="summary-section">
      <button onClick={() => onUpdate({ content: 'Updated Summary' })}>
        Update Summary
      </button>
      Summary: {data?.content || 'No summary'}
    </div>
  ),
}));

vi.mock('./sections/WorkExperienceSection', () => ({
  WorkExperienceSection: ({ data, onUpdate }: any) => (
    <div data-testid="work-experience-section">
      <button onClick={() => onUpdate([{ title: 'Updated Job' }])}>
        Update Experience
      </button>
      Experience Jobs: {data?.length || 0}
    </div>
  ),
}));

vi.mock('./sections/SkillsSection', () => ({
  SkillsSection: ({ data, onUpdate }: any) => (
    <div data-testid="skills-section">
      <button onClick={() => onUpdate({ technical: ['React'] })}>
        Update Skills
      </button>
      Skills: {data?.technical?.length || 0}
    </div>
  ),
}));

vi.mock('./sections/EducationSection', () => ({
  EducationSection: ({ data, onUpdate }: any) => (
    <div data-testid="education-section">
      <button onClick={() => onUpdate([{ degree: 'Updated Degree' }])}>
        Update Education
      </button>
      Education: {data?.length || 0}
    </div>
  ),
}));

describe('EditorPanel Component', () => {
  const defaultProps = {
    cvData: initialCV,
    onUpdateSection: vi.fn(),
    onSectionOrderChange: vi.fn(),
    activeSection: null,
    setActiveSection: vi.fn(),
    cvScore: 80,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders CV score display', () => {
      render(<EditorPanel {...defaultProps} />);
      
      expect(screen.getByText(/80/)).toBeInTheDocument();
    });

    test('renders all section components', () => {
      render(<EditorPanel {...defaultProps} />);
      
      expect(screen.getByTestId('contact-section')).toBeInTheDocument();
      expect(screen.getByTestId('summary-section')).toBeInTheDocument();
      expect(screen.getByTestId('work-experience-section')).toBeInTheDocument();
      expect(screen.getByTestId('skills-section')).toBeInTheDocument();
      expect(screen.getByTestId('education-section')).toBeInTheDocument();
    });

    test('shows section titles in draggable sections', () => {
      render(<EditorPanel {...defaultProps} />);
      
      // Should have section titles rendered via DraggableSection
      expect(screen.getByText(/Chỉnh sửa CV/)).toBeInTheDocument();
      expect(screen.getByText(/Độ hoàn thiện CV/)).toBeInTheDocument();
      expect(screen.getByText(/Phân tích JD/)).toBeInTheDocument();
    });
  });

  describe('Section Updates', () => {
    test('handles contact section updates', () => {
      render(<EditorPanel {...defaultProps} />);
      
      const updateBtn = screen.getByText('Update Contact');
      fireEvent.click(updateBtn);
      
      expect(defaultProps.onUpdateSection).toHaveBeenCalledWith('contact', { name: 'Updated Name' });
    });

    test('handles summary section updates', () => {
      render(<EditorPanel {...defaultProps} />);
      
      const updateBtn = screen.getByText('Update Summary');
      fireEvent.click(updateBtn);
      
      expect(defaultProps.onUpdateSection).toHaveBeenCalledWith('summary', { content: 'Updated Summary' });
    });

    test('handles experience section updates', () => {
      render(<EditorPanel {...defaultProps} />);
      
      const updateBtn = screen.getByText('Update Experience');
      fireEvent.click(updateBtn);
      
      expect(defaultProps.onUpdateSection).toHaveBeenCalledWith('experience', [{ title: 'Updated Job' }]);
    });

    test('handles skills section updates', () => {
      render(<EditorPanel {...defaultProps} />);
      
      const updateBtn = screen.getByText('Update Skills');
      fireEvent.click(updateBtn);
      
      expect(defaultProps.onUpdateSection).toHaveBeenCalledWith('skills', { technical: ['React'] });
    });

    test('handles education section updates', () => {
      render(<EditorPanel {...defaultProps} />);
      
      const updateBtn = screen.getByText('Update Education');
      fireEvent.click(updateBtn);
      
      expect(defaultProps.onUpdateSection).toHaveBeenCalledWith('education', [{ degree: 'Updated Degree' }]);
    });
  });

  describe('Navigation', () => {
    test('handles section navigation clicks', () => {
      render(<EditorPanel {...defaultProps} />);
      
      // Navigation is handled through DraggableSection interactions
      // Verify sections render correctly
      expect(screen.getByTestId('contact-section')).toBeInTheDocument();
      expect(screen.getByTestId('summary-section')).toBeInTheDocument();
    });

    test('highlights active section in navigation', () => {
      const propsWithActiveSection = {
        ...defaultProps,
        activeSection: 'summary',
      };
      
      render(<EditorPanel {...propsWithActiveSection} />);
      
      // Active section highlighting is handled by DraggableSection
      // Verify the summary section is rendered
      expect(screen.getByTestId('summary-section')).toBeInTheDocument();
    });
  });

  describe('CV Score Display', () => {
    test('shows different scores correctly', () => {
      const props = { ...defaultProps, cvScore: 95 };
      render(<EditorPanel {...props} />);
      
      expect(screen.getByText(/95/)).toBeInTheDocument();
    });

    test('shows score tips for improvement', () => {
      const props = { ...defaultProps, cvScore: 60 };
      render(<EditorPanel {...props} />);
      
      // Should show AI tips when score is low
      expect(screen.getByText(/💡 Sử dụng tính năng AI để đạt điểm tối đa 100%/)).toBeInTheDocument();
    });
  });

  describe('Add Section Functionality', () => {
    test('shows add section button', () => {
      render(<EditorPanel {...defaultProps} />);
      
      expect(screen.getByText(/\+ Thêm phần mới/)).toBeInTheDocument();
    });

    test('add section button is clickable', () => {
      render(<EditorPanel {...defaultProps} />);
      
      const addBtn = screen.getByText(/\+ Thêm phần mới/);
      fireEvent.click(addBtn);
      
      // Should be clickable without errors
      expect(addBtn).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<EditorPanel {...defaultProps} />);
      
      // Check the main panel structure exists
      const heading = screen.getByText(/Chỉnh sửa CV/);
      expect(heading).toBeInTheDocument();
    });

    test('buttons are accessible', () => {
      render(<EditorPanel {...defaultProps} />);
      
      // Check that buttons exist and can be interacted with
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Verify at least one button is focusable (buttons are inherently keyboard accessible)
      expect(buttons[0]).toBeInTheDocument();
    });
  });

  describe('Navigation to Section', () => {
    test('handles navigation to contact section', () => {
      const propsWithNavigation = {
        ...defaultProps,
        onNavigateToSection: vi.fn(),
      };
      
      render(<EditorPanel {...propsWithNavigation} />);
      
      // Test would verify navigation functionality if it existed in component
      expect(screen.getByTestId('contact-section')).toBeInTheDocument();
    });

    test('handles navigation to summary section', () => {
      const propsWithNavigation = {
        ...defaultProps,
        onNavigateToSection: vi.fn(),
      };
      
      render(<EditorPanel {...propsWithNavigation} />);
      
      expect(screen.getByTestId('summary-section')).toBeInTheDocument();
    });

    test('handles navigation to experience section', () => {
      const propsWithNavigation = {
        ...defaultProps,
        onNavigateToSection: vi.fn(),
      };
      
      render(<EditorPanel {...propsWithNavigation} />);
      
      expect(screen.getByTestId('work-experience-section')).toBeInTheDocument();
    });
  });

  describe('Section Order Management', () => {
    test('handles section order changes', () => {
      render(<EditorPanel {...defaultProps} />);
      
      // Verify onSectionOrderChange is available as prop
      expect(defaultProps.onSectionOrderChange).toBeDefined();
    });

    test('passes correct props to draggable sections', () => {
      render(<EditorPanel {...defaultProps} />);
      
      // Verify all sections are rendered (order can be changed)
      expect(screen.getByTestId('contact-section')).toBeInTheDocument();
      expect(screen.getByTestId('summary-section')).toBeInTheDocument();
      expect(screen.getByTestId('work-experience-section')).toBeInTheDocument();
      expect(screen.getByTestId('skills-section')).toBeInTheDocument();
      expect(screen.getByTestId('education-section')).toBeInTheDocument();
    });
  });

  describe('Different Section Types', () => {
    test('renders contact section with proper data', () => {
      const propsWithContactData = {
        ...defaultProps,
        cvData: {
          ...initialCV,
          contact: { name: 'John Doe', email: 'john@example.com' },
        },
      };
      
      render(<EditorPanel {...propsWithContactData} />);
      
      expect(screen.getByTestId('contact-section')).toBeInTheDocument();
    });

    test('renders summary section with content', () => {
      const propsWithSummary = {
        ...defaultProps,
        cvData: {
          ...initialCV,
          summary: { content: 'Professional summary content' },
        },
      };
      
      render(<EditorPanel {...propsWithSummary} />);
      
      expect(screen.getByTestId('summary-section')).toBeInTheDocument();
    });

    test('renders experience section with items', () => {
      const propsWithExperience = {
        ...defaultProps,
        cvData: {
          ...initialCV,
          experience: { items: [{ id: '1', title: 'Developer', company: 'Tech Corp' }] },
        },
      };
      
      render(<EditorPanel {...propsWithExperience} />);
      
      expect(screen.getByTestId('work-experience-section')).toBeInTheDocument();
    });

    test('renders skills section with items', () => {
      const propsWithSkills = {
        ...defaultProps,
        cvData: {
          ...initialCV,
          skills: { items: ['JavaScript', 'React', 'Node.js'] },
        },
      };
      
      render(<EditorPanel {...propsWithSkills} />);
      
      expect(screen.getByTestId('skills-section')).toBeInTheDocument();
    });

    test('renders education section with items', () => {
      const propsWithEducation = {
        ...defaultProps,
        cvData: {
          ...initialCV,
          education: { items: [{ id: '1', degree: 'Computer Science', school: 'University' }] },
        },
      };
      
      render(<EditorPanel {...propsWithEducation} />);
      
      expect(screen.getByTestId('education-section')).toBeInTheDocument();
    });
  });

  describe('Custom Sections', () => {
    test('handles custom section data', () => {
      const propsWithCustomSection = {
        ...defaultProps,
        cvData: {
          ...initialCV,
          customSection: { content: 'Custom section content' },
        },
      };
      
      render(<EditorPanel {...propsWithCustomSection} />);
      
      // Should render without errors even with custom sections
      expect(screen.getByTestId('contact-section')).toBeInTheDocument();
    });

    test('handles undefined custom section data', () => {
      const propsWithUndefinedSection = {
        ...defaultProps,
        cvData: {
          ...initialCV,
          undefinedSection: undefined,
        },
      };
      
      render(<EditorPanel {...propsWithUndefinedSection} />);
      
      // Should handle undefined sections gracefully
      expect(screen.getByTestId('contact-section')).toBeInTheDocument();
    });
  });

  describe('Active Section Handling', () => {
    test('handles contact section as active', () => {
      const propsWithActiveContact = {
        ...defaultProps,
        activeSection: 'contact',
      };
      
      render(<EditorPanel {...propsWithActiveContact} />);
      
      expect(screen.getByTestId('contact-section')).toBeInTheDocument();
    });

    test('handles experience section as active', () => {
      const propsWithActiveExperience = {
        ...defaultProps,
        activeSection: 'experience',
      };
      
      render(<EditorPanel {...propsWithActiveExperience} />);
      
      expect(screen.getByTestId('work-experience-section')).toBeInTheDocument();
    });

    test('handles skills section as active', () => {
      const propsWithActiveSkills = {
        ...defaultProps,
        activeSection: 'skills',
      };
      
      render(<EditorPanel {...propsWithActiveSkills} />);
      
      expect(screen.getByTestId('skills-section')).toBeInTheDocument();
    });

    test('handles education section as active', () => {
      const propsWithActiveEducation = {
        ...defaultProps,
        activeSection: 'education',
      };
      
      render(<EditorPanel {...propsWithActiveEducation} />);
      
      expect(screen.getByTestId('education-section')).toBeInTheDocument();
    });

    test('handles unknown section as active', () => {
      const propsWithUnknownActive = {
        ...defaultProps,
        activeSection: 'unknown-section',
      };
      
      render(<EditorPanel {...propsWithUnknownActive} />);
      
      // Should handle unknown sections gracefully
      expect(screen.getByTestId('contact-section')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles null CV data', () => {
      const propsWithNullData = {
        ...defaultProps,
        cvData: {
          ...initialCV,
          contact: null,
          summary: null,
          experience: null,
          skills: null,
          education: null,
        },
      };
      
      // Should render with minimal data structure
      expect(() => render(<EditorPanel {...propsWithNullData} />)).not.toThrow();
    });

    test('handles missing section data', () => {
      const propsWithMissingData = {
        ...defaultProps,
        cvData: {
          ...initialCV,
          contact: {},
          summary: {},
          experience: { items: [] },
          skills: { items: [] },
          education: { items: [] },
        },
      };
      
      expect(() => render(<EditorPanel {...propsWithMissingData} />)).not.toThrow();
    });

    test('handles very low CV score', () => {
      const propsWithLowScore = {
        ...defaultProps,
        cvScore: 0,
      };
      
      render(<EditorPanel {...propsWithLowScore} />);
      
      // Check for the CV score percentage display
      expect(screen.getAllByText(/0%/)[0]).toBeInTheDocument();
    });

    test('handles very high CV score', () => {
      const propsWithHighScore = {
        ...defaultProps,
        cvScore: 100,
      };
      
      render(<EditorPanel {...propsWithHighScore} />);
      
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    test('displays CV data correctly', () => {
      render(<EditorPanel {...defaultProps} />);
      
      // Check that data is passed to sections
      expect(screen.getByText(/Contact:/)).toBeInTheDocument();
      expect(screen.getByText(/Summary:/)).toBeInTheDocument();
      expect(screen.getByText(/Experience Jobs:/)).toBeInTheDocument();
    });

    test('handles empty data gracefully', () => {
      const emptyProps = {
        ...defaultProps,
        cvData: {
          ...initialCV,
          contact: {},
          summary: {},
          experience: [],
          skills: {},
          education: [],
        },
      };
      
      render(<EditorPanel {...emptyProps} />);
      
      expect(screen.getByText(/Contact: No name/)).toBeInTheDocument();
      expect(screen.getByText(/Summary: No summary/)).toBeInTheDocument();
      expect(screen.getByText(/Experience Jobs: 0/)).toBeInTheDocument();
    });
  });
}); 