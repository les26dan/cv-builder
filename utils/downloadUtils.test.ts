import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateTxtContent, downloadFile, generateFilename, downloadCV } from './downloadUtils';

// Mock window.open for PDF testing
const mockWindowOpen = vi.fn();
const mockDocument = {
  write: vi.fn(),
  close: vi.fn()
};
const mockWindow = {
  document: mockDocument,
  focus: vi.fn(),
  print: vi.fn(),
  close: vi.fn()
};

// Mock URL for blob testing
const mockURL = {
  createObjectURL: vi.fn(() => 'mock-blob-url'),
  revokeObjectURL: vi.fn()
};

// Mock DOM elements for download testing
const mockLink = {
  href: '',
  download: '',
  click: vi.fn()
};

// Setup global mocks
Object.defineProperty(window, 'open', { value: mockWindowOpen });
Object.defineProperty(global, 'URL', { value: mockURL });

// Mock document methods without redefining the entire document object
Object.defineProperty(document, 'createElement', { 
  value: vi.fn(() => mockLink),
  writable: true 
});
Object.defineProperty(document.body, 'appendChild', { 
  value: vi.fn(),
  writable: true 
});
Object.defineProperty(document.body, 'removeChild', { 
  value: vi.fn(),
  writable: true 
});

const mockCvData = {
  contact: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/johndoe'
  },
  summary: {
    content: 'Experienced software developer with 5 years of experience in web development and team leadership.'
  },
  experience: {
    items: [
      {
        id: '1',
        title: 'Senior Developer',
        company: 'Tech Corp',
        location: 'New York, NY',
        startDate: '01/2020',
        endDate: '12/2023',
        current: false,
        bullets: ['Led development team', 'Improved performance by 50%', 'Mentored junior developers']
      },
      {
        id: '2',
        title: 'Developer',
        company: 'Startup Inc',
        location: 'San Francisco, CA',
        startDate: '06/2018',
        endDate: '12/2019',
        current: false,
        bullets: ['Built web applications', 'Worked with React and Node.js']
      }
    ]
  },
  skills: {
    items: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python']
  },
  education: {
    items: [
      {
        id: '1',
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of Technology',
        location: 'Boston, MA',
        graduationDate: '2018',
        description: 'Graduated summa cum laude with focus on software engineering'
      }
    ]
  },
  sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
  sectionTitles: {
    experience: 'Professional Experience',
    skills: 'Technical Skills'
  }
};

const emptyCvData = {
  contact: {},
  summary: {},
  experience: { items: [] },
  skills: { items: [] },
  education: { items: [] },
  sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education']
};

describe('downloadUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockReturnValue(mockWindow);
  });

  describe('generateTxtContent', () => {
    it('generates complete TXT content with all sections', () => {
      const result = generateTxtContent(mockCvData);
      
      expect(result).toContain('John Doe');
      expect(result).toContain('='.repeat('John Doe'.length));
      expect(result).toContain('Email: john.doe@example.com');
      expect(result).toContain('Điện thoại: 1234567890');
      expect(result).toContain('Địa chỉ: New York, NY');
      expect(result).toContain('LinkedIn: linkedin.com/in/johndoe');
      
      expect(result).toContain('Experienced software developer');
      expect(result).toContain('PROFESSIONAL EXPERIENCE');
      expect(result).toContain('Senior Developer - Tech Corp - New York, NY');
      expect(result).toContain('01/2020 - 12/2023');
      expect(result).toContain('• Led development team');
      
      expect(result).toContain('TECHNICAL SKILLS');
      expect(result).toContain('JavaScript | TypeScript | React | Node.js | Python');
      
      expect(result).toContain('HỌC VẤN');
      expect(result).toContain('Bachelor of Science in Computer Science - University of Technology - Boston, MA');
      expect(result).toContain('Năm tốt nghiệp: 2018');
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
            bullets: ['Current responsibilities']
          }]
        }
      };

      const result = generateTxtContent(dataWithCurrentJob);
      expect(result).toContain('01/2023 - Hiện tại');
    });

    it('handles empty sections gracefully', () => {
      const result = generateTxtContent(emptyCvData);
      
      expect(result).toBe('');
      expect(result).not.toContain('KINH NGHIỆM LÀM VIỆC');
      expect(result).not.toContain('KỸ NĂNG');
    });

    it('handles missing bullets in experience', () => {
      const dataWithoutBullets = {
        ...mockCvData,
        experience: {
          items: [{
            id: '1',
            title: 'Developer',
            company: 'Company',
            startDate: '2020',
            endDate: '2023'
            // No bullets
          }]
        }
      };

      const result = generateTxtContent(dataWithoutBullets);
      expect(result).toContain('Developer - Company');
      expect(result).toContain('2020 - 2023');
    });

    it('handles empty and null bullets correctly', () => {
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

      const result = generateTxtContent(dataWithEmptyBullets);
      expect(result).toContain('• Valid bullet');
      expect(result).toContain('• Another valid bullet');
      expect(result).not.toContain('• \n'); // Empty bullets should not appear
    });

    it('handles custom section titles', () => {
      const result = generateTxtContent(mockCvData);
      expect(result).toContain('PROFESSIONAL EXPERIENCE');
      expect(result).toContain('TECHNICAL SKILLS');
    });

    it('handles default section titles when custom not provided', () => {
      const dataWithoutCustomTitles = {
        ...mockCvData,
        sectionTitles: {}
      };

      const result = generateTxtContent(dataWithoutCustomTitles);
      expect(result).toContain('KINH NGHIỆM LÀM VIỆC');
      expect(result).toContain('KỸ NĂNG');
    });

    it('handles custom sections correctly', () => {
      const dataWithCustomSections = {
        ...mockCvData,
        'projects-main': {
          items: [{ id: '1', title: 'Project A', description: 'Description A' }]
        },
        'custom-section': {
          content: 'Custom content here'
        },
        sectionOrder: ['contact', 'projects-main', 'custom-section']
      };

      const result = generateTxtContent(dataWithCustomSections);
      expect(result).toContain('DỰ ÁN');
      expect(result).toContain('Project A');
      expect(result).toContain('PHẦN TÙY CHỈNH');
      expect(result).toContain('Custom content here');
    });

    it('handles missing contact fields gracefully', () => {
      const dataWithPartialContact = {
        ...mockCvData,
        contact: {
          fullName: 'John Doe',
          email: 'john@example.com'
          // Missing phone, location, linkedin
        }
      };

      const result = generateTxtContent(dataWithPartialContact);
      expect(result).toContain('John Doe');
      expect(result).toContain('Email: john@example.com');
      expect(result).not.toContain('Điện thoại:');
      expect(result).not.toContain('LinkedIn:');
    });
  });

  describe('downloadFile', () => {
    it('creates and downloads file correctly', () => {
      const content = 'Test file content';
      const filename = 'test.txt';
      const mimeType = 'text/plain';

      downloadFile(content, filename, mimeType);

      expect(mockURL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: mimeType
        })
      );
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('mock-blob-url');
      expect(mockLink.download).toBe(filename);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(mockURL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });

    it('handles special characters in content', () => {
      const content = 'Content with special chars: áéíóú ñ ç';
      const filename = 'special.txt';
      const mimeType = 'text/plain;charset=utf-8';

      downloadFile(content, filename, mimeType);

      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('handles empty content', () => {
      const content = '';
      const filename = 'empty.txt';
      const mimeType = 'text/plain';

      downloadFile(content, filename, mimeType);

      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('generateFilename', () => {
    it('generates filename with full name and timestamp', () => {
      const result = generateFilename(mockCvData, 'pdf');
      
      expect(result).toContain('John_Doe_CV_');
      expect(result).toContain('.pdf');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format
    });

    it('handles special characters in name', () => {
      const dataWithSpecialChars = {
        ...mockCvData,
        contact: {
          fullName: 'José María García-López'
        }
      };

      const result = generateFilename(dataWithSpecialChars, 'docx');
      expect(result).toContain('Jos_Mara_GarcaLpez_CV_');
      expect(result).toContain('.docx');
    });

    it('handles missing name gracefully', () => {
      const dataWithoutName = {
        ...mockCvData,
        contact: {}
      };

      const result = generateFilename(dataWithoutName, 'txt');
      expect(result).toContain('CV_');
      expect(result).toContain('.txt');
    });

    it('handles empty name gracefully', () => {
      const dataWithEmptyName = {
        ...mockCvData,
        contact: {
          fullName: ''
        }
      };

      const result = generateFilename(dataWithEmptyName, 'pdf');
      expect(result).toContain('CV_');
      expect(result).toContain('.pdf');
    });

    it('handles very long names', () => {
      const dataWithLongName = {
        ...mockCvData,
        contact: {
          fullName: 'This Is A Very Long Name That Should Be Handled Properly'
        }
      };

      const result = generateFilename(dataWithLongName, 'pdf');
      expect(result).toContain('This_Is_A_Very_Long_Name_That_Should_Be_Handled_Properly_CV_');
    });

    it('generates different extensions correctly', () => {
      expect(generateFilename(mockCvData, 'pdf')).toContain('.pdf');
      expect(generateFilename(mockCvData, 'docx')).toContain('.docx');
      expect(generateFilename(mockCvData, 'txt')).toContain('.txt');
    });
  });

  describe('downloadCV', () => {
    it('downloads TXT format correctly', async () => {
      await downloadCV(mockCvData, 'txt');

      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('downloads PDF format correctly', async () => {
      await downloadCV(mockCvData, 'pdf');

      expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank');
      expect(mockDocument.write).toHaveBeenCalled();
      expect(mockDocument.close).toHaveBeenCalled();
      expect(mockWindow.focus).toHaveBeenCalled();

      // Check that HTML contains our typography changes
      const htmlContent = mockDocument.write.mock.calls[0][0];
      expect(htmlContent).toContain('font-size: 20px'); // Name font size
      expect(htmlContent).toContain('font-size: 12px'); // Contact font size
      expect(htmlContent).toContain('font-size: 14px'); // Bullet font size
      expect(htmlContent).not.toContain('font-style: italic'); // No italic dates
      expect(htmlContent).toContain('margin-bottom: 20px'); // Section spacing
    });

    it('downloads DOCX format correctly (as RTF)', async () => {
      await downloadCV(mockCvData, 'docx');

      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toContain('.rtf');
    });

    it('handles unsupported format gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      
      await downloadCV(mockCvData, 'unsupported' as any);

      expect(consoleSpy).toHaveBeenCalledWith('Unsupported format:', 'unsupported');
      consoleSpy.mockRestore();
    });

    it('handles PDF generation with empty data', async () => {
      await downloadCV(emptyCvData, 'pdf');

      expect(mockWindowOpen).toHaveBeenCalled();
      expect(mockDocument.write).toHaveBeenCalled();
    });

    it('handles null window.open gracefully', async () => {
      mockWindowOpen.mockReturnValue(null);

      await downloadCV(mockCvData, 'pdf');

      expect(mockWindowOpen).toHaveBeenCalled();
      // Should not throw error when window.open returns null
    });

    it('generates HTML with correct typography for PDF', async () => {
      await downloadCV(mockCvData, 'pdf');

      const htmlContent = mockDocument.write.mock.calls[0][0];
      
      // Verify typography changes are applied
      expect(htmlContent).toContain('font-size: 20px'); // Name font size updated from 24px
      expect(htmlContent).toContain('font-size: 12px'); // Contact font size updated from 14px
      expect(htmlContent).toContain('font-size: 14px'); // Bullet font size updated from 13px
      expect(htmlContent).toContain('margin-bottom: 20px'); // Section spacing updated
      
      // Verify no italic styling for dates
      expect(htmlContent).not.toContain('.job-dates { font-style: italic;');
      
      // Verify content structure
      expect(htmlContent).toContain('John Doe');
      expect(htmlContent).toContain('PROFESSIONAL EXPERIENCE');
      expect(htmlContent).toContain('Senior Developer');
      expect(htmlContent).toContain('• Led development team');
    });

    it('generates RTF with correct content for DOCX', async () => {
      await downloadCV(mockCvData, 'docx');

      // RTF content should be generated and downloaded
      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toContain('.rtf');
    });
  });

  describe('PDF HTML Generation - Typography Validation', () => {
    it('generates HTML with exact typography specifications', async () => {
      await downloadCV(mockCvData, 'pdf');

      const htmlContent = mockDocument.write.mock.calls[0][0];
      
      // Contact section typography
      expect(htmlContent).toContain('font-size: 20px'); // Name
      expect(htmlContent).toContain('font-size: 12px'); // Contact info
      expect(htmlContent).toContain('text-align: center'); // Centered contact
      
      // Section headers
      expect(htmlContent).toContain('font-size: 16px'); // Section headers
      expect(htmlContent).toContain('text-transform: uppercase'); // Uppercase headers
      expect(htmlContent).toContain('letter-spacing: 0.5px'); // Letter spacing
      
      // Experience section
      expect(htmlContent).toContain('font-weight: 600'); // Job headers
      expect(htmlContent).toContain('font-size: 14px'); // Job dates and bullets
      
      // Spacing
      expect(htmlContent).toContain('margin-bottom: 20px'); // Section spacing
      expect(htmlContent).toContain('margin-bottom: 15px'); // Job spacing
    });

    it('generates HTML with proper structure and classes', async () => {
      await downloadCV(mockCvData, 'pdf');

      const htmlContent = mockDocument.write.mock.calls[0][0];
      
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<html>');
      expect(htmlContent).toContain('<head>');
      expect(htmlContent).toContain('<style>');
      expect(htmlContent).toContain('@page');
      expect(htmlContent).toContain('@media print');
      expect(htmlContent).toContain('class="contact-section"');
      expect(htmlContent).toContain('class="section-title"');
      expect(htmlContent).toContain('class="job-header-row"');
      expect(htmlContent).toContain('class="bullet"');
    });

    it('handles complex CV data in HTML generation', async () => {
      const complexData = {
        ...mockCvData,
        experience: {
          items: [
            {
              id: '1',
              title: 'Senior Software Engineer',
              company: 'Tech Giant Corp',
              location: 'San Francisco, CA',
              startDate: '01/2020',
              endDate: '12/2023',
              current: false,
              bullets: [
                'Led a team of 8 developers in building scalable web applications',
                'Improved system performance by 75% through code optimization',
                'Mentored junior developers and conducted technical interviews'
              ]
            }
          ]
        }
      };

      await downloadCV(complexData, 'pdf');

      const htmlContent = mockDocument.write.mock.calls[0][0];
      expect(htmlContent).toContain('Senior Software Engineer');
      expect(htmlContent).toContain('Tech Giant Corp');
      expect(htmlContent).toContain('San Francisco, CA');
      expect(htmlContent).toContain('• Led a team of 8 developers');
      expect(htmlContent).toContain('• Improved system performance');
      expect(htmlContent).toContain('• Mentored junior developers');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles malformed CV data gracefully', async () => {
      const malformedData = {
        contact: null,
        experience: { items: null },
        skills: null
      };

      expect(() => generateTxtContent(malformedData as any)).not.toThrow();
      await expect(downloadCV(malformedData as any, 'pdf')).resolves.not.toThrow();
    });

    it('handles very large datasets', async () => {
      const largeData = {
        ...mockCvData,
        experience: {
          items: Array(100).fill(0).map((_, i) => ({
            id: `job-${i}`,
            title: `Position ${i}`,
            company: `Company ${i}`,
            startDate: '2020',
            endDate: '2023',
            bullets: Array(20).fill(0).map((_, j) => `Responsibility ${i}-${j}`)
          }))
        }
      };

      const startTime = performance.now();
      await downloadCV(largeData, 'pdf');
      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('handles special characters in all content', async () => {
      const dataWithSpecialChars = {
        contact: {
          fullName: 'José María García-López',
          email: 'josé@example.com',
          location: 'São Paulo, Brasil'
        },
        summary: {
          content: 'Développeur avec expérience en français et español'
        },
        experience: {
          items: [{
            id: '1',
            title: 'Développeur Senior',
            company: 'Société Française',
            startDate: '2020',
            endDate: '2023',
            bullets: ['Travaillé avec équipe internationale', 'Géré projets complexes']
          }]
        }
      };

      expect(() => generateTxtContent(dataWithSpecialChars)).not.toThrow();
      await expect(downloadCV(dataWithSpecialChars, 'pdf')).resolves.not.toThrow();
    });

    it('handles undefined and null values in nested objects', () => {
      const dataWithNulls = {
        contact: {
          fullName: 'Test User',
          email: null,
          phone: undefined,
          location: ''
        },
        experience: {
          items: [
            {
              id: '1',
              title: null,
              company: 'Test Company',
              startDate: '2020',
              endDate: '2023',
              bullets: [null, undefined, '', 'Valid bullet']
            }
          ]
        }
      };

      expect(() => generateTxtContent(dataWithNulls as any)).not.toThrow();
    });
  });

  describe('Memory and Performance', () => {
    it('cleans up resources properly', async () => {
      await downloadCV(mockCvData, 'txt');

      expect(mockURL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    it('handles multiple concurrent downloads', async () => {
      const promises = [
        downloadCV(mockCvData, 'txt'),
        downloadCV(mockCvData, 'pdf'),
        downloadCV(mockCvData, 'docx')
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });
}); 