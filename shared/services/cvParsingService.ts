// Browser-compatible CV parsing service
// This is a simplified implementation that works in the browser environment
// In a production environment, this would be replaced with a server-side service

import { CVData } from '../types/workflow';

// CV parsing service interface
export interface CVParsingService {
  parseFile(file: File): Promise<CVParsingResult>;
}

// CV parsing result interface
export interface CVParsingResult {
  success: boolean;
  cvData?: Partial<CVData>;
  rawText?: string;
  errors?: string[];
  confidence: number;
}

// Browser-compatible CV parsing service implementation
export class CVParsingServiceImpl implements CVParsingService {
  /**
   * Parse a CV file and extract structured data
   * This is a simplified browser implementation
   * @param file - CV file (PDF, DOCX, DOC)
   * @returns Parsing result with structured CV data
   */
  async parseFile(file: File): Promise<CVParsingResult> {
    try {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];

      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          errors: [`Unsupported file type: ${file.type}`],
          confidence: 0
        };
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return {
          success: false,
          errors: ['File too large. Maximum size is 10MB.'],
          confidence: 0
        };
      }

      // For now, we'll return a mock parsed CV data
      // In a production environment, this would be replaced with actual parsing logic
      // or a call to a server-side parsing service
      const mockCVData = this.generateMockCVData(file.name);
      
      return {
        success: true,
        cvData: mockCVData,
        rawText: `Mock extracted text from ${file.name}`,
        confidence: 0.8
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
        confidence: 0
      };
    }
  }

  /**
   * Generate mock CV data for testing purposes
   * @param fileName - Name of the uploaded file
   * @returns Mock CV data
   */
  private generateMockCVData(fileName: string): Partial<CVData> {
    const baseName = fileName.replace(/\.(pdf|docx|doc)$/i, '');
    
    return {
      contact: {
        fullName: `${baseName.replace(/[-_]/g, ' ')} (từ file)`,
        email: `${baseName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
        phone: '+84 123 456 789',
        location: 'Hồ Chí Minh, Việt Nam',
        linkedin: `linkedin.com/in/${baseName.toLowerCase().replace(/\s+/g, '-')}`
      },
      summary: {
        content: `Chuyên gia có kinh nghiệm trong lĩnh vực công nghệ thông tin với khả năng phân tích và giải quyết vấn đề tốt. Đã từng làm việc tại nhiều công ty lớn và có kinh nghiệm quản lý dự án. Nội dung này được trích xuất từ file ${fileName}.`
      },
      experience: {
        items: [
          {
            id: 'exp1',
            title: 'Senior Software Developer',
            company: 'Tech Company Ltd',
            location: 'Hồ Chí Minh',
            startDate: '2022-01',
            endDate: '2024-12',
            current: true,
            bullets: [
              'Phát triển ứng dụng web hiện đại sử dụng React và TypeScript',
              'Quản lý team 3 developer junior',
              'Cải thiện hiệu suất ứng dụng 40%',
              'Triển khai CI/CD pipeline cho dự án'
            ]
          },
          {
            id: 'exp2',
            title: 'Full Stack Developer',
            company: 'Startup Innovation',
            location: 'Hà Nội',
            startDate: '2020-06',
            endDate: '2021-12',
            current: false,
            bullets: [
              'Xây dựng hệ thống backend với Node.js và MongoDB',
              'Phát triển frontend với Vue.js',
              'Tích hợp API của bên thứ ba',
              'Tối ưu hóa database và caching'
            ]
          }
        ]
      },
      skills: {
        items: [
          'React', 'TypeScript', 'Node.js', 'MongoDB', 'PostgreSQL',
          'Vue.js', 'Express.js', 'Docker', 'AWS', 'Git',
          'JavaScript', 'Python', 'HTML/CSS', 'REST API', 'GraphQL'
        ]
      },
      education: {
        items: [
          {
            id: 'edu1',
            degree: 'Cử nhân Khoa học Máy tính',
            institution: 'Đại học Bách khoa Hà Nội',
            location: 'Hà Nội',
            graduationDate: '2020-06',
            description: 'Tốt nghiệp loại Giỏi, GPA: 3.8/4.0'
          }
        ]
      },
      sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
      sectionTitles: {
        contact: 'Thông tin liên hệ',
        summary: 'Tóm tắt',
        experience: 'Kinh nghiệm làm việc',
        skills: 'Kỹ năng',
        education: 'Học vấn'
      }
    };
  }
} 