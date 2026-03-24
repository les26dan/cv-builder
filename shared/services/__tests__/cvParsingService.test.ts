import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CVParsingServiceImpl, CVParsingResult } from '../cvParsingService';
import { CVData } from '../../types/workflow';

// Mock pdf-parse
vi.mock('pdf-parse', () => ({
  __esModule: true,
  default: vi.fn()
}));

// Mock mammoth
vi.mock('mammoth', () => ({
  extractRawText: vi.fn()
}));

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

describe('CVParsingService', () => {
  let service: CVParsingServiceImpl;
  const mockPdfParse = pdfParse as vi.MockedFunction<typeof pdfParse>;
  const mockMammoth = mammoth.extractRawText as vi.MockedFunction<typeof mammoth.extractRawText>;

  // Helper function to create a properly mocked File
  const createMockFile = (content: string, filename: string, type: string): File => {
    const file = {
      name: filename,
      type: type,
      size: content.length,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    } as unknown as File;
    return file;
  };

  beforeEach(() => {
    service = new CVParsingServiceImpl();
    vi.clearAllMocks();
  });

  describe('parseFile', () => {
    it('should successfully parse a PDF file', async () => {
      const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf');
      
      const mockText = `
        John Doe
        john.doe@email.com
        +1234567890
        
        SUMMARY
        Experienced software developer with 5 years of experience.
        
        EXPERIENCE
        Software Engineer
        Tech Company
        2020 - Present
        • Developed web applications
        • Led team of 3 developers
        
        EDUCATION
        Bachelor of Computer Science
        University of Technology
        2020
        
        SKILLS
        JavaScript, React, Node.js
      `;

      mockPdfParse.mockResolvedValue({ text: mockText } as any);

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.cvData).toBeDefined();
      expect(result.cvData?.contact.fullName).toBe('John Doe');
      expect(result.cvData?.contact.email).toBe('john.doe@email.com');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should successfully parse a DOCX file', async () => {
      const mockFile = createMockFile('test content', 'test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      
      const mockText = `
        Jane Smith
        jane.smith@email.com
        
        OBJECTIVE
        Marketing professional seeking new opportunities.
        
        WORK EXPERIENCE
        Marketing Manager
        Marketing Corp
        2019 - 2023
        • Managed marketing campaigns
        • Increased brand awareness by 30%
      `;

      mockMammoth.mockResolvedValue({ value: mockText } as any);

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.cvData).toBeDefined();
      expect(result.cvData?.contact.fullName).toBe('Jane Smith');
      expect(result.cvData?.contact.email).toBe('jane.smith@email.com');
    });

    it('should handle unsupported file types', async () => {
      const mockFile = createMockFile('test content', 'test.txt', 'text/plain');

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Unsupported file type: text/plain');
      expect(result.confidence).toBe(0);
    });

    it('should handle PDF parsing errors', async () => {
      const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf');
      
      mockPdfParse.mockRejectedValue(new Error('PDF parsing failed'));

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('PDF parsing failed: PDF parsing failed');
      expect(result.confidence).toBe(0);
    });

    it('should handle DOCX parsing errors', async () => {
      const mockFile = createMockFile('test content', 'test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      
      mockMammoth.mockRejectedValue(new Error('DOCX parsing failed'));

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('DOCX parsing failed: DOCX parsing failed');
      expect(result.confidence).toBe(0);
    });
  });

  describe('extractText', () => {
    it('should extract text from PDF', async () => {
      const mockBuffer = Buffer.from('test content');
      const mockText = 'Extracted PDF text';
      
      mockPdfParse.mockResolvedValue({ text: mockText } as any);

      const result = await service.extractText(mockBuffer, 'application/pdf');

      expect(result).toBe(mockText);
      expect(mockPdfParse).toHaveBeenCalledWith(mockBuffer);
    });

    it('should extract text from DOCX', async () => {
      const mockBuffer = Buffer.from('test content');
      const mockText = 'Extracted DOCX text';
      
      mockMammoth.mockResolvedValue({ value: mockText } as any);

      const result = await service.extractText(mockBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      expect(result).toBe(mockText);
      expect(mockMammoth).toHaveBeenCalledWith({ buffer: mockBuffer });
    });

    it('should extract text from DOC', async () => {
      const mockBuffer = Buffer.from('test content');
      const mockText = 'Extracted DOC text';
      
      mockMammoth.mockResolvedValue({ value: mockText } as any);

      const result = await service.extractText(mockBuffer, 'application/msword');

      expect(result).toBe(mockText);
      expect(mockMammoth).toHaveBeenCalledWith({ buffer: mockBuffer });
    });

    it('should throw error for unsupported MIME type', async () => {
      const mockBuffer = Buffer.from('test content');

      await expect(service.extractText(mockBuffer, 'text/plain'))
        .rejects.toThrow('Unsupported file type: text/plain');
    });
  });

  describe('structureData', () => {
    it('should extract contact information correctly', async () => {
      const mockText = `
        John Doe
        john.doe@email.com
        +1234567890
        New York, NY
        linkedin.com/in/johndoe
        
        Some other content
      `;

      const result = await service.structureData(mockText);

      expect(result.contact?.fullName).toBe('John Doe');
      expect(result.contact?.email).toBe('john.doe@email.com');
      expect(result.contact?.phone).toBe('+1234567890');
      expect(result.contact?.linkedin).toBe('linkedin.com/in/johndoe');
    });

    it('should extract summary section correctly', async () => {
      const mockText = `
        John Doe
        
        SUMMARY
        Experienced software developer with 5 years of experience.
        Skilled in multiple programming languages and frameworks.
        
        EXPERIENCE
        Software Engineer
      `;

      const result = await service.structureData(mockText);

      expect(result.summary?.content).toContain('Experienced software developer');
      expect(result.summary?.content).toContain('multiple programming languages');
    });

    it('should extract experience section correctly', async () => {
      const mockText = `
        John Doe
        
        EXPERIENCE
        Software Engineer
        Tech Company
        New York
        2020 - Present
        Developed web applications
        Led team of 3 developers
        
        Junior Developer
        Startup Inc
        2018 - 2020
        Built mobile apps
      `;

      const result = await service.structureData(mockText);

      expect(result.experience?.items).toHaveLength(2);
      expect(result.experience?.items[0].title).toBe('Software Engineer');
      expect(result.experience?.items[0].company).toBe('Tech Company');
      expect(result.experience?.items[0].startDate).toBe('2020');
      expect(result.experience?.items[0].endDate).toBe('Present');
      expect(result.experience?.items[0].current).toBe(true);
      expect(result.experience?.items[0].bullets).toContain('Developed web applications');
    });

    it('should extract education section correctly', async () => {
      const mockText = `
        John Doe
        
        EDUCATION
        Bachelor of Computer Science
        University of Technology
        New York
        2020
        Graduated with honors
      `;

      const result = await service.structureData(mockText);

      expect(result.education?.items).toHaveLength(1);
      expect(result.education?.items[0].degree).toBe('Bachelor of Computer Science');
      expect(result.education?.items[0].institution).toBe('University of Technology');
      expect(result.education?.items[0].graduationDate).toBe('2020');
      expect(result.education?.items[0].description).toBe('Graduated with honors');
    });

    it('should extract skills section correctly', async () => {
      const mockText = `
        John Doe
        
        SKILLS
        JavaScript, React, Node.js
        • Python
        • Docker
        - AWS
        * Git
      `;

      const result = await service.structureData(mockText);

      expect(result.skills?.items).toContain('JavaScript');
      expect(result.skills?.items).toContain('React');
      expect(result.skills?.items).toContain('Node.js');
      expect(result.skills?.items).toContain('Python');
      expect(result.skills?.items).toContain('Docker');
      expect(result.skills?.items).toContain('AWS');
      expect(result.skills?.items).toContain('Git');
    });

    it('should handle Vietnamese CV content', async () => {
      const mockText = `
        Nguyễn Văn A
        nguyenvana@gmail.com
        0912345678
        Hồ Chí Minh
        
        TÓM TẮT
        Kỹ sư phần mềm với 3 năm kinh nghiệm.
        
        KINH NGHIỆM
        Lập trình viên
        Công ty ABC
        2021 - hiện tại
        Phát triển ứng dụng web
        
        HỌC VẤN
        Cử nhân Công nghệ thông tin
        Đại học Bách khoa
        2021
        
        KỸ NĂNG
        JavaScript, React, Node.js
      `;

      const result = await service.structureData(mockText);

      expect(result.contact?.fullName).toBe('Nguyễn Văn A');
      expect(result.contact?.email).toBe('nguyenvana@gmail.com');
      expect(result.summary?.content).toContain('Kỹ sư phần mềm');
      expect(result.experience?.items[0].title).toBe('Lập trình viên');
      expect(result.experience?.items[0].company).toBe('Công ty ABC');
      expect(result.experience?.items[0].current).toBe(true);
      expect(result.education?.items[0].degree).toBe('Cử nhân Công nghệ thông tin');
    });

    it('should handle empty or minimal content', async () => {
      const mockText = `
        John Doe
        john@email.com
      `;

      const result = await service.structureData(mockText);

      expect(result.contact?.fullName).toBe('John Doe');
      expect(result.contact?.email).toBe('john@email.com');
      expect(result.summary?.content).toBe('');
      expect(result.experience?.items).toHaveLength(0);
      expect(result.education?.items).toHaveLength(0);
      expect(result.skills?.items).toHaveLength(0);
    });
  });

  describe('enhanceWithAI', () => {
    it('should enhance partial CV data with defaults', async () => {
      const partialData: Partial<CVData> = {
        contact: {
          fullName: 'John Doe',
          email: 'john@email.com',
          phone: '',
          location: '',
          linkedin: ''
        }
      };

      const result = await service.enhanceWithAI(partialData);

      expect(result.contact.fullName).toBe('John Doe');
      expect(result.contact.email).toBe('john@email.com');
      expect(result.summary).toBeDefined();
      expect(result.experience).toBeDefined();
      expect(result.education).toBeDefined();
      expect(result.skills).toBeDefined();
      expect(result.sectionOrder).toEqual(['contact', 'summary', 'experience', 'skills', 'education']);
    });

    it('should preserve existing data when enhancing', async () => {
      const partialData: Partial<CVData> = {
        contact: {
          fullName: 'Jane Smith',
          email: 'jane@email.com',
          phone: '+1234567890',
          location: 'New York',
          linkedin: 'linkedin.com/in/jane'
        },
        summary: {
          content: 'Experienced professional'
        },
        experience: {
          items: [{
            id: 'exp-1',
            title: 'Manager',
            company: 'Tech Corp',
            location: 'NY',
            startDate: '2020',
            endDate: '2023',
            current: false,
            bullets: ['Managed team']
          }]
        }
      };

      const result = await service.enhanceWithAI(partialData);

      expect(result.contact.fullName).toBe('Jane Smith');
      expect(result.summary.content).toBe('Experienced professional');
      expect(result.experience.items).toHaveLength(1);
      expect(result.experience.items[0].title).toBe('Manager');
    });

    it('should handle job description parameter', async () => {
      const partialData: Partial<CVData> = {
        contact: {
          fullName: 'John Doe',
          email: 'john@email.com',
          phone: '',
          location: '',
          linkedin: ''
        }
      };

      const jobDescription = 'Looking for a software engineer with React experience';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      const result = await service.enhanceWithAI(partialData, jobDescription);

      expect(consoleSpy).toHaveBeenCalledWith('AI Enhancement (placeholder):', {
        cvData: partialData,
        jobDescription
      });
      expect(result).toBeDefined();

      consoleSpy.mockRestore();
    });
  });

  describe('confidence calculation', () => {
    it('should calculate high confidence for complete CV', async () => {
      const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf');
      const mockText = `
        John Doe
        john.doe@email.com
        +1234567890
        
        SUMMARY
        Experienced software developer with 5 years of experience.
        
        EXPERIENCE
        Software Engineer
        Tech Company
        2020 - Present
        • Developed web applications
        
        EDUCATION
        Bachelor of Computer Science
        University of Technology
        2020
        
        SKILLS
        JavaScript, React, Node.js
      `;

      mockPdfParse.mockResolvedValue({ text: mockText } as any);

      const result = await service.parseFile(mockFile);

      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should calculate low confidence for incomplete CV', async () => {
      const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf');
      const mockText = `
        John Doe
        Some random text without proper sections
      `;

      mockPdfParse.mockResolvedValue({ text: mockText } as any);

      const result = await service.parseFile(mockFile);

      expect(result.confidence).toBeLessThan(50);
    });

    it('should calculate medium confidence for partial CV', async () => {
      const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf');
      const mockText = `
        John Doe
        john.doe@email.com
        
        EXPERIENCE
        Software Engineer
        Tech Company
        2020 - Present
      `;

      mockPdfParse.mockResolvedValue({ text: mockText } as any);

      const result = await service.parseFile(mockFile);

      expect(result.confidence).toBeGreaterThanOrEqual(30);
      expect(result.confidence).toBeLessThan(80);
    });
  });

  describe('error handling', () => {
    it('should handle file reading errors gracefully', async () => {
      const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf');
      
      // Mock File.arrayBuffer to throw an error after creation
      (mockFile.arrayBuffer as vi.Mock).mockRejectedValue(new Error('File reading failed'));

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('File reading failed');
      expect(result.confidence).toBe(0);
    });

    it('should handle malformed PDF content', async () => {
      const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf');
      
      mockPdfParse.mockRejectedValue(new Error('Invalid PDF structure'));

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('PDF parsing failed: Invalid PDF structure');
    });

    it('should handle malformed DOCX content', async () => {
      const mockFile = createMockFile('test content', 'test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      
      mockMammoth.mockRejectedValue(new Error('Invalid DOCX structure'));

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('DOCX parsing failed: Invalid DOCX structure');
    });

    it('should handle unknown errors gracefully', async () => {
      const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf');
      
      mockPdfParse.mockRejectedValue('Unknown error');

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('PDF parsing failed: Unknown error');
    });
  });

  describe('edge cases', () => {
    it('should handle empty file', async () => {
      const mockFile = createMockFile('', 'empty.pdf', 'application/pdf');
      
      mockPdfParse.mockResolvedValue({ text: '' } as any);

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.cvData?.contact.fullName).toBe('');
      expect(result.confidence).toBe(0);
    });

    it('should handle CV with only contact information', async () => {
      const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf');
      const mockText = `
        John Doe
        john.doe@email.com
        +1234567890
      `;

      mockPdfParse.mockResolvedValue({ text: mockText } as any);

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.cvData?.contact.fullName).toBe('John Doe');
      expect(result.cvData?.contact.email).toBe('john.doe@email.com');
      expect(result.cvData?.contact.phone).toBe('+1234567890');
      expect(result.cvData?.experience.items).toHaveLength(0);
      expect(result.confidence).toBe(30); // Only contact info
    });

    it('should handle CV with special characters and formatting', async () => {
      const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf');
      const mockText = `
        José María García-López
        josé.maría@email.com
        +34-123-456-789
        
        RÉSUMÉ
        Développeur logiciel avec 5 années d'expérience.
        
        EXPÉRIENCE
        Ingénieur Logiciel
        Société Française
        2020 – Présent
        • Développé des applications web
        • Géré une équipe de 3 développeurs
      `;

      mockPdfParse.mockResolvedValue({ text: mockText } as any);

      const result = await service.parseFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.cvData?.contact.fullName).toBe('José María García-López');
      expect(result.cvData?.contact.email).toBe('josé.maría@email.com');
      expect(result.cvData?.contact.phone).toBe('+34123456789');
    });
  });
}); 