import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PreviewPanel } from './PreviewPanel';

// Mock the download utility
vi.mock('../utils/downloadUtils', () => ({
  downloadCV: vi.fn().mockResolvedValue(true)
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockCvData = {
  contact: {
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@gmail.com',
    phone: '0912345678',
    location: 'Hồ Chí Minh, Việt Nam',
    linkedin: 'linkedin.com/in/nguyenvana'
  },
  summary: {
    content: 'Experienced developer with 5 years of experience'
  },
  experience: {
    items: [{
      id: '1',
      title: 'Software Developer',
      company: 'Tech Corp',
      location: 'Hồ Chí Minh',
      startDate: '01/2020',
      endDate: '12/2023',
      current: false,
      bullets: ['Developed web applications', 'Worked with React and Node.js']
    }]
  },
  education: {
    items: [{
      id: '1',
      degree: 'Computer Science',
      institution: 'University of Technology',
      location: 'Hồ Chí Minh',
      graduationDate: '2020'
    }]
  },
  skills: {
    items: ['JavaScript', 'React', 'Node.js']
  },
  sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
  sectionTitles: {
    experience: 'Kinh nghiệm làm việc',
    skills: 'Kỹ năng chuyên môn'
  }
};

const emptyCvData = {
  contact: {},
  summary: { content: '' },
  experience: { items: [] },
  education: { items: [] },
  skills: { items: [] },
  sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education']
};

describe('PreviewPanel Component', () => {
  const mockSetActiveSection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders preview panel with header', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      expect(screen.getByText('Xem trước')).toBeInTheDocument();
      expect(screen.getByText('Tải xuống')).toBeInTheDocument();
    });

    it('renders without crashing with empty data', () => {
      const { container } = render(
        <PreviewPanel 
          cvData={emptyCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      expect(container).toBeInTheDocument();
    });
  });

  describe('Data Binding to CV State', () => {
    it('renders contact information correctly', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText(/nguyenvana@gmail\.com.*0912345678.*Hồ Chí Minh, Việt Nam/)).toBeInTheDocument();
    });

    it('renders summary content', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      expect(screen.getByText('Experienced developer with 5 years of experience')).toBeInTheDocument();
    });

    it('renders work experience correctly', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
      expect(screen.getByText(', Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('01/2020 – 12/2023')).toBeInTheDocument();
      expect(screen.getByText('• Developed web applications')).toBeInTheDocument();
      expect(screen.getByText('• Worked with React and Node.js')).toBeInTheDocument();
    });

    it('renders skills list', () => {
      const { container } = render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Find the skills section by its heading
      const skillsHeading = screen.getByText(/KỸ NĂNG CHUYÊN MÔN/i);
      expect(skillsHeading).toBeInTheDocument();
      
      // Check that skills are rendered as pipe-separated text
      const skillsContent = screen.getByText('JavaScript | React | Node.js');
      expect(skillsContent).toBeInTheDocument();
    });

    it('renders education information', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText(', University of Technology')).toBeInTheDocument();
      expect(screen.getByText('2020')).toBeInTheDocument();
    });
  });

  describe('Empty Section Suppression', () => {
    it('does not show empty section headings', () => {
      render(
        <PreviewPanel 
          cvData={emptyCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Should not show section headings when sections are empty
      expect(screen.queryByText(/KINH NGHIỆM LÀM VIỆC/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/KỸ NĂNG/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/HỌC VẤN/i)).not.toBeInTheDocument();
    });

    it('shows sections only when they have content', () => {
      const partialData = {
        ...emptyCvData,
        skills: { items: ['JavaScript'] }
      };

      render(
        <PreviewPanel 
          cvData={partialData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Should show Skills section since it has content (case insensitive)
      expect(screen.getByText(/KỸ NĂNG/i)).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      
      // Should not show empty sections
      expect(screen.queryByText(/KINH NGHIỆM LÀM VIỆC/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/HỌC VẤN/i)).not.toBeInTheDocument();
    });

    it('handles empty contact section appropriately', () => {
      render(
        <PreviewPanel 
          cvData={emptyCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Should not render contact section when all fields are empty
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    });
  });

  describe('Custom Section Titles', () => {
    it('uses custom section titles when provided', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Should use custom title from sectionTitles (case insensitive due to CSS uppercase)
      expect(screen.getByText(/KỸ NĂNG CHUYÊN MÔN/i)).toBeInTheDocument();
      expect(screen.queryByText(/^KỸ NĂNG$/i)).not.toBeInTheDocument();
    });

    it('falls back to default titles when custom titles not provided', () => {
      const dataWithoutCustomTitles = {
        ...mockCvData,
        sectionTitles: {}
      };

      render(
        <PreviewPanel 
          cvData={dataWithoutCustomTitles} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Should use default title (case insensitive)
      expect(screen.getByText(/KỸ NĂNG/i)).toBeInTheDocument();
    });
  });

  describe('Click-to-Jump Functionality', () => {
    it('calls setActiveSection when section is clicked', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Click on skills section (case insensitive)
      const skillsSection = screen.getByText(/KỸ NĂNG CHUYÊN MÔN/i).closest('div');
      fireEvent.click(skillsSection!);
      
      expect(mockSetActiveSection).toHaveBeenCalledWith('skills');
    });

    it('highlights active section', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection="skills"
          setActiveSection={mockSetActiveSection}
        />
      );
      
      const skillsSection = screen.getByText(/KỸ NĂNG CHUYÊN MÔN/i).closest('.cv-section');
      expect(skillsSection).toHaveClass('bg-blue-50');
    });

    it('handles contact section click', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Click on contact section (name)
      const contactSection = screen.getByText('Nguyễn Văn A').closest('div');
      fireEvent.click(contactSection!);
      
      expect(mockSetActiveSection).toHaveBeenCalledWith('contact');
    });
  });

  describe('Content Update Reflection', () => {
    it('updates when cvData changes', () => {
      const { rerender } = render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Verify initial content
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      
      // Update the data
      const updatedData = {
        ...mockCvData,
        contact: {
          ...mockCvData.contact,
          fullName: 'Trần Thị B'
        }
      };
      
      rerender(
        <PreviewPanel 
          cvData={updatedData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Verify updated content
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn A')).not.toBeInTheDocument();
    });

    it('shows/hides sections based on content changes', () => {
      const { rerender } = render(
        <PreviewPanel 
          cvData={emptyCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Initially no skills section
      expect(screen.queryByText(/KỸ NĂNG/i)).not.toBeInTheDocument();
      
      // Add skills
      const updatedData = {
        ...emptyCvData,
        skills: { items: ['React', 'TypeScript'] }
      };
      
      rerender(
        <PreviewPanel 
          cvData={updatedData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Skills section should now appear (case insensitive)
      expect(screen.getByText(/KỸ NĂNG/i)).toBeInTheDocument();
      expect(screen.getByText(/React/)).toBeInTheDocument();
      expect(screen.getByText(/TypeScript/)).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    let mockWindowOpen: vi.SpyInstance;

    beforeEach(() => {
      // Mock window.open since JSDOM doesn't implement it
      mockWindowOpen = vi.spyOn(window, 'open').mockImplementation(() => ({
        document: {
          write: vi.fn(),
          close: vi.fn()
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn()
      } as any));
    });

    afterEach(() => {
      mockWindowOpen.mockRestore();
    });

    it('shows download dropdown when button is clicked', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      const downloadButton = screen.getByText('Tải xuống');
      fireEvent.click(downloadButton);
      
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('Word (.docx)')).toBeInTheDocument();
    });

    it('handles download format selection', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      const downloadButton = screen.getByText('Tải xuống');
      fireEvent.click(downloadButton);
      
      const pdfOption = screen.getByText('PDF');
      fireEvent.click(pdfOption);
      
      // Wait for async operations to complete
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('✅ CV downloaded successfully as', 'PDF');
      });
      
      consoleSpy.mockRestore();
    });

    it('closes dropdown after format selection', async () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      const downloadButton = screen.getByText('Tải xuống');
      fireEvent.click(downloadButton);
      
      const pdfOption = screen.getByText('PDF');
      fireEvent.click(pdfOption);
      
      await waitFor(() => {
        expect(screen.queryByText('PDF')).not.toBeInTheDocument();
      });
    });
  });

  describe('Section Order', () => {
    it('renders sections in specified order', () => {
      const customOrderData = {
        ...mockCvData,
        sectionOrder: ['skills', 'contact', 'summary', 'experience', 'education']
      };

      render(
        <PreviewPanel 
          cvData={customOrderData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // Check that skills section appears before contact name
      const skillsHeading = screen.getByText(/KỸ NĂNG CHUYÊN MÔN/i);
      const contactName = screen.getByText('Nguyễn Văn A');
      
      // Compare positions in DOM
      expect(skillsHeading.compareDocumentPosition(contactName)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });

  describe('Template Styling', () => {
    it('applies proper inline styles for styling', () => {
      render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      const nameElement = screen.getByText('Nguyễn Văn A');
      expect(nameElement).toHaveStyle({
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#111827'
      });
      
      const sectionHeading = screen.getByText(/KỸ NĂNG CHUYÊN MÔN/i);
      expect(sectionHeading).toHaveStyle({
        fontSize: '16px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      });
    });

    it('maintains proper A4 page dimensions', () => {
      const { container } = render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      const previewContainer = container.querySelector('[style*="794px"]');
      expect(previewContainer).toBeInTheDocument();
      expect(previewContainer).toHaveStyle({
        width: '794px',
        height: '1123px'
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing section data gracefully', () => {
      const incompleteData = {
        contact: { fullName: 'Test User' },
        // Missing other sections
        sectionOrder: ['contact', 'summary', 'experience']
      };

      const { container } = render(
        <PreviewPanel 
          cvData={incompleteData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
    
    expect(container).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('handles empty bullets in work experience', () => {
      const dataWithEmptyBullets = {
        ...mockCvData,
        experience: {
          items: [{
            id: '1',
            title: 'Developer',
            company: 'Company',
            startDate: '2020',
            endDate: '2023',
            bullets: ['Valid bullet', '', '   ', 'Another valid bullet']
          }]
        }
      };

      render(
        <PreviewPanel 
          cvData={dataWithEmptyBullets} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
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
            title: 'Current Developer',
            company: 'Current Company',
            startDate: '01/2023',
            current: true,
            bullets: ['Working on current project']
          }]
        }
      };

      render(
        <PreviewPanel 
          cvData={dataWithCurrentJob} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      expect(screen.getByText('01/2023 – Hiện tại')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('adjusts scale based on container size', () => {
      const { container } = render(
        <PreviewPanel 
          cvData={mockCvData} 
          activeSection={null}
          setActiveSection={mockSetActiveSection}
        />
      );
      
      // The component should set up ResizeObserver
      expect(global.ResizeObserver).toHaveBeenCalled();
      
      // Check that the preview container has the scaling setup
      const previewContainer = container.querySelector('[style*="--preview-scale"]');
      expect(previewContainer).toBeInTheDocument();
    });
  });
}); 