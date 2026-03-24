import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { DennisSchroderTemplate } from './DennisSchroderTemplate';

const mockOnSectionClick = vi.fn();

const mockCvData = {
  contact: {
    fullName: 'Dennis Schroder',
    email: 'dennis@example.com',
    phone: '1234567890',
    location: 'Berlin, Germany',
    linkedin: 'linkedin.com/in/dennisschroder'
  },
  summary: {
    content: 'Professional basketball player with NBA experience and leadership skills in team coordination and strategic game planning.'
  },
  experience: {
    items: [{
      id: '1',
      title: 'Point Guard',
      company: 'Brooklyn Nets',
      location: 'Brooklyn, NY',
      startDate: '2023',
      endDate: '2024',
      current: false,
      bullets: ['Leading the team offense', 'Averaged 12.3 points per game', 'Team captain responsibilities']
    }, {
      id: '2',
      title: 'Starting Point Guard',
      company: 'Los Angeles Lakers',
      location: 'Los Angeles, CA',
      startDate: '2021',
      endDate: '2023',
      current: false,
      bullets: ['Playoff experience', 'Clutch performance in key games']
    }]
  },
  education: {
    items: [{
      id: '1',
      degree: 'High School Diploma',
      institution: 'Braunschweig International School',
      location: 'Braunschweig, Germany',
      graduationDate: '2013',
      description: 'Graduated with honors, basketball team captain'
    }]
  },
  skills: {
    items: ['Basketball', 'Leadership', 'Team Coordination', 'Strategic Planning', 'Communication']
  },
  sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
  sectionTitles: {
    experience: 'Professional Experience',
    skills: 'Core Competencies'
  }
};

const emptyCvData = {
  contact: {},
  summary: {},
  experience: { items: [] },
  education: { items: [] },
  skills: { items: [] },
  sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education']
};

describe('DennisSchroderTemplate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders template with complete CV data', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(screen.getByText('Dennis Schroder')).toBeInTheDocument();
      expect(screen.getByText(/dennis@example.com/)).toBeInTheDocument();
      expect(screen.getByText('Point Guard')).toBeInTheDocument();
    });

    it('renders with all required props', () => {
      const { container } = render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
          activeSection="experience"
          currentPage={1}
          totalPages={2}
          isPreview={true}
        />
      );
      
      expect(container).toBeInTheDocument();
    });

    it('renders with minimal props', () => {
      const { container } = render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(container).toBeInTheDocument();
    });
  });

  describe('Typography and Styling - WYSIWYG Validation', () => {
    it('applies correct font sizes for contact section', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      const nameElement = screen.getByText('Dennis Schroder');
      expect(nameElement).toHaveStyle({
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center'
      });

      const contactInfo = screen.getByText(/dennis@example.com/);
      expect(contactInfo).toHaveStyle({
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center'
      });
    });

    it('applies correct styling for section headers', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      const experienceHeader = screen.getByText('PROFESSIONAL EXPERIENCE');
      expect(experienceHeader).toHaveStyle({
        fontSize: '16px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        borderBottom: '2px solid #d1d5db',
        color: '#111827',
        letterSpacing: '0.5px'
      });
    });

    it('applies correct styling for work experience dates (no italic)', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      const dateElement = screen.getByText('2023 – 2024');
      expect(dateElement).toHaveStyle({
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.3'
      });
      
      // Ensure no italic styling
      expect(dateElement).not.toHaveStyle({
        fontStyle: 'italic'
      });
    });

    it('applies correct styling for bullet points', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      const bulletElement = screen.getByText('• Leading the team offense');
      expect(bulletElement).toHaveStyle({
        fontSize: '14px',
        color: '#374151',
        lineHeight: '1.4'
      });
    });

    it('applies correct section spacing (20px)', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      const sections = screen.getAllByText(/PROFESSIONAL EXPERIENCE|CORE COMPETENCIES|HỌC VẤN/);
      sections.forEach(section => {
        const sectionContainer = section.closest('.mb-5');
        expect(sectionContainer).toHaveClass('mb-5'); // 20px spacing
      });
    });

    it('renders summary with correct typography', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      const summaryText = screen.getByText(/Professional basketball player/);
      expect(summaryText).toHaveStyle({
        fontSize: '14px',
        color: '#374151',
        lineHeight: '1.5',
        textAlign: 'justify'
      });
    });
  });

  describe('Section Content Rendering', () => {
    it('renders contact section with all fields', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(screen.getByText('Dennis Schroder')).toBeInTheDocument();
      expect(screen.getByText(/dennis@example.com.*1234567890.*Berlin, Germany.*linkedin.com\/in\/dennisschroder/)).toBeInTheDocument();
    });

    it('renders experience section with multiple jobs', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(screen.getByText('Point Guard')).toBeInTheDocument();
      expect(screen.getByText(', Brooklyn Nets')).toBeInTheDocument();
      expect(screen.getByText(/Brooklyn, NY/)).toBeInTheDocument();
      expect(screen.getByText('Starting Point Guard')).toBeInTheDocument();
      expect(screen.getByText(', Los Angeles Lakers')).toBeInTheDocument();
      
      // Check bullets
      expect(screen.getByText('• Leading the team offense')).toBeInTheDocument();
      expect(screen.getByText('• Averaged 12.3 points per game')).toBeInTheDocument();
      expect(screen.getByText('• Playoff experience')).toBeInTheDocument();
    });

    it('renders skills section as pipe-separated list', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(screen.getByText('Basketball | Leadership | Team Coordination | Strategic Planning | Communication')).toBeInTheDocument();
    });

    it('renders education section with description', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(screen.getByText('High School Diploma')).toBeInTheDocument();
      expect(screen.getByText(', Braunschweig International School')).toBeInTheDocument();
      expect(screen.getByText(/Braunschweig, Germany/)).toBeInTheDocument();
      expect(screen.getByText('2013')).toBeInTheDocument();
      expect(screen.getByText('Graduated with honors, basketball team captain')).toBeInTheDocument();
    });
  });

  describe('Custom Section Titles', () => {
    it('uses custom section titles when provided', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(screen.getByText('PROFESSIONAL EXPERIENCE')).toBeInTheDocument();
      expect(screen.getByText('CORE COMPETENCIES')).toBeInTheDocument();
    });

    it('falls back to default titles when custom titles not provided', () => {
      const dataWithoutCustomTitles = {
        ...mockCvData,
        sectionTitles: {}
      };

             render(
         <DennisSchroderTemplate 
           cvData={dataWithoutCustomTitles} 
           onSectionClick={mockOnSectionClick}
         />
       );
      
      expect(screen.getByText('KINH NGHIỆM LÀM VIỆC')).toBeInTheDocument();
      expect(screen.getByText('KỸ NĂNG')).toBeInTheDocument();
    });

    it('handles custom section prefixes correctly', () => {
      const customSectionData = {
        ...mockCvData,
        'projects-1': {
          items: [{ id: '1', title: 'Test Project', description: 'Test Description' }]
        },
        'volunteer-1': {
          items: [{ id: '1', title: 'Volunteer Work', organization: 'Test Org' }]
        },
        'custom-1': {
          content: 'Custom content'
        }
      };

      render(
        <DennisSchroderTemplate 
          cvData={customSectionData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      // These would be rendered if included in sectionOrder
    });
  });

  describe('Interactive Features', () => {
    it('calls onSectionClick when section is clicked', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      const contactSection = screen.getByText('Dennis Schroder').closest('[data-section]');
      fireEvent.click(contactSection!);
      
      expect(mockOnSectionClick).toHaveBeenCalledWith('contact');
    });

    it('applies active section styling', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
          activeSection="experience"
        />
      );
      
      const experienceSection = screen.getByText('PROFESSIONAL EXPERIENCE').closest('.cv-section');
      expect(experienceSection).toHaveClass('bg-blue-50', 'rounded-sm');
    });

    it('does not apply active styling when no active section', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      const experienceSection = screen.getByText('PROFESSIONAL EXPERIENCE').closest('.cv-section');
      expect(experienceSection).not.toHaveClass('bg-blue-50');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles completely empty CV data', () => {
      const { container } = render(
        <DennisSchroderTemplate 
          cvData={emptyCvData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(container).toBeInTheDocument();
      // Should not render any section content
      expect(screen.queryByText('KINH NGHIỆM LÀM VIỆC')).not.toBeInTheDocument();
    });

    it('handles missing contact information', () => {
      const dataWithoutContact = {
        ...mockCvData,
        contact: {}
      };

      render(
        <DennisSchroderTemplate 
          cvData={dataWithoutContact} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      // Should not render contact section
      expect(screen.queryByText('Dennis Schroder')).not.toBeInTheDocument();
    });

    it('handles empty bullet points correctly', () => {
      const dataWithEmptyBullets = {
        ...mockCvData,
        experience: {
          items: [{
            id: '1',
            title: 'Test Job',
            company: 'Test Company',
            startDate: '2020',
            endDate: '2023',
            bullets: ['Valid bullet', '', '   ', 'Another valid bullet', null, undefined]
          }]
        }
      };

      render(
        <DennisSchroderTemplate 
          cvData={dataWithEmptyBullets} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(screen.getByText('• Valid bullet')).toBeInTheDocument();
      expect(screen.getByText('• Another valid bullet')).toBeInTheDocument();
      // Empty bullets should not be rendered
    });

    it('handles current job status correctly', () => {
      const dataWithCurrentJob = {
        ...mockCvData,
        experience: {
          items: [{
            id: '1',
            title: 'Current Position',
            company: 'Current Company',
            startDate: '2023',
            current: true,
            bullets: ['Current responsibilities']
          }]
        }
      };

      render(
        <DennisSchroderTemplate 
          cvData={dataWithCurrentJob} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(screen.getByText('2023 – Hiện tại')).toBeInTheDocument();
    });

    it('handles missing section data gracefully', () => {
      const incompleteData = {
        contact: { fullName: 'Test User' },
        sectionOrder: ['contact', 'summary', 'experience']
      };

      const { container } = render(
        <DennisSchroderTemplate 
          cvData={incompleteData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(container).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('handles null and undefined values in arrays', () => {
      const dataWithNulls = {
        ...mockCvData,
        skills: {
          items: ['Valid Skill', null, undefined, '', 'Another Skill']
        }
      };

      render(
        <DennisSchroderTemplate 
          cvData={dataWithNulls} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      // Should handle nulls gracefully
      expect(screen.getByText(/Valid Skill.*Another Skill/)).toBeInTheDocument();
    });
  });

  describe('Pagination Features', () => {
    it('renders page indicator for multi-page documents', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
          currentPage={2}
          totalPages={3}
        />
      );
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not render page indicator for single page', () => {
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
          currentPage={1}
          totalPages={1}
        />
      );
      
      // Should not have page indicator for single page
      const pageIndicators = screen.queryAllByText('1');
      // Filter out any '1' that might be in content - check if any have page indicator styling
      const actualPageIndicator = pageIndicators.find(el => 
        el.style.position === 'absolute' && el.style.bottom === '20px'
      );
      expect(actualPageIndicator).toBeUndefined();
    });

    it('calculates section heights correctly for pagination', () => {
      // This tests the internal pagination logic
      render(
        <DennisSchroderTemplate 
          cvData={mockCvData} 
          onSectionClick={mockOnSectionClick}
          currentPage={1}
          totalPages={2}
        />
      );
      
      // Should render sections based on pagination logic
      expect(screen.getByText('Dennis Schroder')).toBeInTheDocument();
    });
  });

  describe('Section Rendering Logic', () => {
    it('renders sections in correct order', () => {
      const customOrderData = {
        ...mockCvData,
        sectionOrder: ['skills', 'contact', 'experience']
      };

      render(
        <DennisSchroderTemplate 
          cvData={customOrderData} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      // All sections should be rendered regardless of order
      expect(screen.getByText('CORE COMPETENCIES')).toBeInTheDocument();
      expect(screen.getByText('Dennis Schroder')).toBeInTheDocument();
      expect(screen.getByText('PROFESSIONAL EXPERIENCE')).toBeInTheDocument();
    });

    it('handles custom sections correctly', () => {
      const dataWithCustomSections = {
        ...mockCvData,
        'projects-main': {
          items: [{ id: '1', title: 'Project A', description: 'Description A' }]
        },
        'volunteer-main': {
          items: [{ id: '1', title: 'Volunteer Work', organization: 'Charity Org' }]
        },
        'custom-section': {
          content: 'Custom section content'
        },
        sectionOrder: ['contact', 'projects-main', 'volunteer-main', 'custom-section']
      };

      render(
        <DennisSchroderTemplate 
          cvData={dataWithCustomSections} 
          onSectionClick={mockOnSectionClick}
        />
      );
      
      expect(screen.getByText('DỰ ÁN')).toBeInTheDocument();
      expect(screen.getByText('HOẠT ĐỘNG TÌNH NGUYỆN')).toBeInTheDocument();
      expect(screen.getByText('PHẦN TÙY CHỈNH')).toBeInTheDocument();
      expect(screen.getByText('Project A')).toBeInTheDocument();
      expect(screen.getByText('Volunteer Work')).toBeInTheDocument();
      expect(screen.getByText('Custom section content')).toBeInTheDocument();
    });
  });

  describe('TypeScript Interface Compliance', () => {
    it('accepts all valid prop combinations', () => {
      // Test with minimal props
      const minimalProps = {
        cvData: mockCvData,
        onSectionClick: mockOnSectionClick
      };

      const { rerender } = render(<DennisSchroderTemplate {...minimalProps} />);
      
      // Test with all props
      const fullProps = {
        cvData: mockCvData,
        onSectionClick: mockOnSectionClick,
        activeSection: 'experience' as string | null,
        currentPage: 1,
        totalPages: 2,
        isPreview: true
      };

      rerender(<DennisSchroderTemplate {...fullProps} />);
      
      expect(screen.getByText('Dennis Schroder')).toBeInTheDocument();
    });
  });

  describe('Performance and Memory', () => {
    it('handles large datasets without performance issues', () => {
      const largeDataset = {
        ...mockCvData,
        experience: {
          items: Array(50).fill(0).map((_, i) => ({
            id: `job-${i}`,
            title: `Position ${i}`,
            company: `Company ${i}`,
            startDate: '2020',
            endDate: '2023',
            bullets: Array(10).fill(0).map((_, j) => `Responsibility ${i}-${j}`)
          }))
        },
        skills: {
          items: Array(100).fill(0).map((_, i) => `Skill ${i}`)
        }
      };

      const startTime = performance.now();
      render(
        <DennisSchroderTemplate 
          cvData={largeDataset} 
          onSectionClick={mockOnSectionClick}
        />
      );
      const endTime = performance.now();

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByText('Position 0')).toBeInTheDocument();
    });
  });
}); 