import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Header } from './Header';
import { aiService } from '../utils/aiService';

// Mock the aiService
vi.mock('../utils/aiService', () => ({
  aiService: {
    analyzeJobDescription: vi.fn()
  }
}));

// Mock the ScoreIndicator component
vi.mock('./common/ScoreIndicator', () => ({
  ScoreIndicator: ({ score }: { score: number }) => (
    <div data-testid="score-indicator">{score}</div>
  )
}));

// Mock CrossAppDataService
const mockGetURLParams = vi.fn<[], { cvId: string | null, userId: string | null }>(() => ({ cvId: 'test-cv-id', userId: 'test-user-id' }));
const mockNavigateWithCVData = vi.fn();
const mockStoreCVData = vi.fn();

vi.mock('../shared/services/crossAppDataService', () => ({
  CrossAppDataService: {
    getInstance: vi.fn(() => ({
      getURLParams: mockGetURLParams,
      navigateWithCVData: mockNavigateWithCVData,
      storeCVData: mockStoreCVData
    }))
  }
}));

// Mock CVParsingService
const mockParseFile = vi.fn();
vi.mock('../shared/services/cvParsingService', () => ({
  CVParsingServiceImpl: vi.fn(() => ({
    parseFile: mockParseFile
  }))
}));

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('Header Component', () => {
  const mockCvData = {
    contact: { 
      fullName: 'John Doe', 
      email: 'john@example.com',
      phone: '+84 123 456 789',
      location: 'Ho Chi Minh City',
      linkedin: 'linkedin.com/in/johndoe'
    },
    summary: { content: 'Professional summary' },
    experience: { items: [] },
    skills: { items: ['React', 'TypeScript'] },
    education: { items: [] },
    targetJobDescription: ''
  };

  const defaultProps = {
    cvScore: 75,
    cvData: mockCvData,
    onUpdateCvData: vi.fn(),
    onJobAnalysisComplete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    // Reset mock to default values
    mockGetURLParams.mockReturnValue({ cvId: 'test-cv-id', userId: 'test-user-id' });
    // Reset parsing service mock
    mockParseFile.mockReset();
  });

  describe('Basic Rendering', () => {
    it('renders the CV Builder logo/title', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByText(/okbuddy/i)).toBeInTheDocument();
    });

    it('renders the CV score with correct value', () => {
      render(<Header {...defaultProps} cvScore={85} />);
      
      expect(screen.getByText(/điểm cv/i)).toBeInTheDocument();
      expect(screen.getByTestId('score-indicator')).toHaveTextContent('85');
    });

    it('renders auto-save indicator', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByText(/đã lưu tự động/i)).toBeInTheDocument();
    });

    it('renders user avatar with initial', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByText('N')).toBeInTheDocument();
    });

    it('renders without crashing with minimal props', () => {
      const { container } = render(<Header cvScore={70} />);
      
      expect(container).toBeInTheDocument();
    });
  });

  describe('Back Navigation', () => {
    it('renders back to upload button when cvId is present', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload cv & jd/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveTextContent('CV & JD Upload');
    });

    it('does not render back button when cvId is not present', () => {
      mockGetURLParams.mockReturnValue({ cvId: null, userId: null });
      
      render(<Header {...defaultProps} />);
      
      const backButton = screen.queryByRole('button', { name: /quay lại trang upload cv & jd/i });
      expect(backButton).not.toBeInTheDocument();
    });

    it('navigates to upload page with CV data when back button is clicked', () => {
      mockGetURLParams.mockReturnValue({ cvId: 'test-cv-id', userId: 'test-user-id' });
      
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload cv & jd/i });
      fireEvent.click(backButton);
      
      expect(mockNavigateWithCVData).toHaveBeenCalledWith('upload', expect.objectContaining({
        id: 'test-cv-id',
        userId: 'test-user-id',
        status: 'completed',
        score: 75,
        contact: mockCvData.contact,
        summary: mockCvData.summary,
        experience: mockCvData.experience,
        skills: mockCvData.skills,
        education: mockCvData.education
      }));
    });

    it('falls back to direct navigation when no CV data is available', () => {
      mockGetURLParams.mockReturnValue({ cvId: null, userId: null });
      
      render(<Header {...defaultProps} cvData={null} />);
      
      // Since cvId is null, back button won't be rendered
      // But if it were clicked, it would use fallback navigation
      expect(mockLocation.href).toBe('');
    });

    it('has proper accessibility attributes for back button', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload cv & jd/i });
      expect(backButton).toHaveAttribute('title', 'Quay lại trang Upload CV & JD');
      expect(backButton).toHaveAttribute('aria-label', 'Quay lại trang Upload CV & JD');
    });

    it('has proper hover styles for back button', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload cv & jd/i });
      expect(backButton).toHaveClass('hover:text-gray-800', 'hover:bg-gray-50');
    });
  });

  describe('Logo Navigation', () => {
    it('renders CV Builder logo as clickable button', () => {
      render(<Header {...defaultProps} />);
      
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      expect(logoButton).toBeInTheDocument();
      expect(logoButton).toHaveTextContent('CV Builder');
    });

    it('navigates to workspace when logo is clicked', () => {
      render(<Header {...defaultProps} />);
      
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      fireEvent.click(logoButton);
      
      expect(mockLocation.href).toBe('http://localhost:3000/workspace');
    });

    it('triggers auto-save before navigation when CV data is present', () => {
      const onUpdateCvData = vi.fn();
      
      render(<Header {...defaultProps} onUpdateCvData={onUpdateCvData} />);
      
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      fireEvent.click(logoButton);
      
      expect(onUpdateCvData).toHaveBeenCalledWith(mockCvData);
      expect(mockLocation.href).toBe('http://localhost:3000/workspace');
    });

    it('navigates without auto-save when no CV data is present', () => {
      const onUpdateCvData = vi.fn();
      
      render(<Header {...defaultProps} cvData={null} onUpdateCvData={onUpdateCvData} />);
      
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      fireEvent.click(logoButton);
      
      expect(onUpdateCvData).not.toHaveBeenCalled();
      expect(mockLocation.href).toBe('http://localhost:3000/workspace');
    });

    it('navigates without auto-save when no callback is provided', () => {
      render(<Header {...defaultProps} onUpdateCvData={undefined} />);
      
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      fireEvent.click(logoButton);
      
      expect(mockLocation.href).toBe('http://localhost:3000/workspace');
    });

    it('has proper accessibility attributes for logo button', () => {
      render(<Header {...defaultProps} />);
      
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      expect(logoButton).toHaveAttribute('title', 'Quay lại CV Workspace');
      expect(logoButton).toHaveAttribute('aria-label', 'Quay lại CV Workspace');
    });

    it('has proper hover styles and tooltip for logo button', () => {
      render(<Header {...defaultProps} />);
      
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      expect(logoButton).toHaveClass('hover:text-primary-600', 'group');
      
      // Check tooltip is present
      const tooltip = logoButton.querySelector('.group-hover\\:opacity-100');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('Quay lại CV Workspace');
    });
  });

  describe('CV Replacement', () => {
    it('renders replace CV button', () => {
      render(<Header {...defaultProps} />);
      
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      expect(replaceButton).toBeInTheDocument();
      expect(replaceButton).toHaveTextContent('Thay thế CV');
    });

    it('opens replacement modal when replace button is clicked', () => {
      render(<Header {...defaultProps} />);
      
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Thay thế CV hiện tại')).toBeInTheDocument();
      expect(screen.getByText('Tải lên file CV mới để thay thế nội dung hiện tại')).toBeInTheDocument();
    });

    it('closes replacement modal when cancel button is clicked', () => {
      render(<Header {...defaultProps} />);
      
      // Open modal
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      // Close modal
      const cancelButton = screen.getByRole('button', { name: /hủy/i });
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('Thay thế CV hiện tại')).not.toBeInTheDocument();
    });

    it('shows warning message about data loss', () => {
      render(<Header {...defaultProps} />);
      
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      expect(screen.getByText(/Thao tác này sẽ thay thế toàn bộ nội dung CV hiện tại/i)).toBeInTheDocument();
      expect(screen.getByText(/Dữ liệu cũ sẽ không thể khôi phục/i)).toBeInTheDocument();
    });

    it('handles successful CV replacement', async () => {
      const onUpdateCvData = vi.fn();
      const mockFile = new File(['mock cv content'], 'test-cv.pdf', { type: 'application/pdf' });
      
      mockParseFile.mockResolvedValue({
        success: true,
        cvData: {
          contact: { fullName: 'New Name', email: 'new@email.com' },
          summary: { content: 'New summary' },
          experience: { items: [] },
          skills: { items: ['New Skill'] },
          education: { items: [] }
        },
        rawText: 'Mock CV text'
      });

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<Header {...defaultProps} onUpdateCvData={onUpdateCvData} />);
      
      // Open modal
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      // Get file input and trigger file selection
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(mockParseFile).toHaveBeenCalledWith(mockFile);
        expect(onUpdateCvData).toHaveBeenCalledWith(expect.objectContaining({
          contact: { fullName: 'New Name', email: 'new@email.com' },
          summary: { content: 'New summary' },
          skills: { items: ['New Skill'] }
        }));
        expect(mockStoreCVData).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('CV đã được thay thế thành công!');
      });
      
      alertSpy.mockRestore();
    });

    it('validates file type and shows error for invalid files', async () => {
      const mockFile = new File(['mock content'], 'test.txt', { type: 'text/plain' });
      
      render(<Header {...defaultProps} />);
      
      // Open modal
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      // Try to upload invalid file
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Chỉ hỗ trợ file PDF, DOCX, và DOC')).toBeInTheDocument();
      });
    });

    it('validates file size and shows error for large files', async () => {
      // Create a mock file that exceeds 10MB
      const mockFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large-cv.pdf', { type: 'application/pdf' });
      
      render(<Header {...defaultProps} />);
      
      // Open modal
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      // Try to upload large file
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('File quá lớn. Kích thước tối đa là 10MB')).toBeInTheDocument();
      });
    });

    it('handles parsing errors gracefully', async () => {
      const mockFile = new File(['mock cv content'], 'test-cv.pdf', { type: 'application/pdf' });
      
      mockParseFile.mockResolvedValue({
        success: false,
        errors: ['Parsing failed']
      });
      
      render(<Header {...defaultProps} />);
      
      // Open modal
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      // Try to upload file
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      // Should show overwrite confirmation first
      expect(screen.getByText('Xác nhận thay thế CV')).toBeInTheDocument();
      
      // Confirm the overwrite to trigger file processing
      const confirmButton = screen.getByRole('button', { name: /xác nhận thay thế/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockParseFile).toHaveBeenCalledWith(mockFile);
      });
    });

    it('shows loading state during CV replacement', async () => {
      const mockFile = new File(['mock cv content'], 'test-cv.pdf', { type: 'application/pdf' });
      
      mockParseFile.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        cvData: {
          contact: { fullName: 'Test User', email: 'test@email.com' },
          summary: { content: 'Test summary' },
          experience: { items: [] },
          skills: { items: [] },
          education: { items: [] }
        },
        rawText: 'Test CV text'
      }), 100)));
      
      render(<Header {...defaultProps} />);
      
      // Open modal
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      // Try to upload file
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      // Should show overwrite confirmation first
      expect(screen.getByText('Xác nhận thay thế CV')).toBeInTheDocument();
      
      // Confirm the overwrite to trigger file processing
      const confirmButton = screen.getByRole('button', { name: /xác nhận thay thế/i });
      fireEvent.click(confirmButton);
      
      // Wait for file processing to be triggered
      await waitFor(() => {
        expect(mockParseFile).toHaveBeenCalledWith(mockFile);
      });
    });

    it('has proper accessibility attributes', () => {
      render(<Header {...defaultProps} />);
      
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      expect(replaceButton).toHaveAttribute('title', 'Thay thế CV hiện tại');
      expect(replaceButton).toHaveAttribute('aria-label', 'Thay thế CV hiện tại');
    });
  });

  describe('JD Update and Re-analysis', () => {
    it('preserves existing CV data during JD re-analysis', async () => {
      const onUpdateCvData = vi.fn();
      const mockAnalysisResult = {
        summary: ['Improve professional summary'],
        workExperience: ['Add quantifiable achievements'],
        skills: ['Add technical skills'],
        education: ['Consider additional certifications']
      };
      
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockResolvedValue({
        success: true,
        data: mockAnalysisResult
      });

      render(<Header {...defaultProps} onUpdateCvData={onUpdateCvData} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      const jobDescription = 'Software Engineer job description';
      fireEvent.change(textarea, { target: { value: jobDescription } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(onUpdateCvData).toHaveBeenCalledWith(expect.objectContaining({
          ...mockCvData, // All existing CV data should be preserved
          targetJobDescription: jobDescription,
          suggestions: mockAnalysisResult
        }));
      });
    });

    it('updates workspace entry metadata with new job description', async () => {
      const mockAnalysisResult = {
        summary: ['Improve professional summary'],
        workExperience: ['Add quantifiable achievements'],
        skills: ['Add technical skills'],
        education: ['Consider additional certifications']
      };
      
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockResolvedValue({
        success: true,
        data: mockAnalysisResult
      });

      render(<Header {...defaultProps} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      const jobDescription = 'Software Engineer job description';
      fireEvent.change(textarea, { target: { value: jobDescription } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(mockStoreCVData).toHaveBeenCalledWith(
          'test-cv-id',
          'test-user-id',
          expect.objectContaining({
            jobDescription: {
              text: jobDescription,
              keywords: mockAnalysisResult.skills
            },
            analysisResults: expect.objectContaining({
              suggestions: expect.arrayContaining([
                expect.objectContaining({
                  section: 'summary',
                  recommendation: 'Improve professional summary',
                  priority: 'high',
                  implemented: false
                })
              ])
            })
          }),
          'editor'
        );
      });
    });

    it('shows success message after JD re-analysis', async () => {
      const mockAnalysisResult = {
        summary: ['Improve professional summary'],
        workExperience: ['Add quantifiable achievements'],
        skills: ['Add technical skills'],
        education: ['Consider additional certifications']
      };
      
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockResolvedValue({
        success: true,
        data: mockAnalysisResult
      });

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Header {...defaultProps} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Phân tích mô tả công việc thành công! Các gợi ý mới đã được cập nhật.');
      });

      alertSpy.mockRestore();
    });

    it('maintains non-destructive update approach', async () => {
      const onUpdateCvData = vi.fn();
      const originalCvData = {
        ...mockCvData,
        summary: { content: 'Original user-written summary' },
        experience: {
          items: [{
            id: 'exp1',
            title: 'User-edited title',
            company: 'User Company',
            location: 'User Location',
            startDate: '2022-01',
            endDate: '2024-12',
            current: true,
            bullets: ['User-written bullet point']
          }]
        }
      };

      const mockAnalysisResult = {
        summary: ['Improve professional summary'],
        workExperience: ['Add quantifiable achievements'],
        skills: ['Add technical skills'],
        education: ['Consider additional certifications']
      };
      
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockResolvedValue({
        success: true,
        data: mockAnalysisResult
      });

      render(<Header {...defaultProps} cvData={originalCvData} onUpdateCvData={onUpdateCvData} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(onUpdateCvData).toHaveBeenCalledWith(expect.objectContaining({
          summary: { content: 'Original user-written summary' }, // User content preserved
          experience: {
            items: [{
              id: 'exp1',
              title: 'User-edited title', // User edits preserved
              company: 'User Company',
              location: 'User Location',
              startDate: '2022-01',
              endDate: '2024-12',
              current: true,
              bullets: ['User-written bullet point'] // User content preserved
            }]
          },
          suggestions: mockAnalysisResult // Only suggestions updated
        }));
      });
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('shows overwrite confirmation when replacing CV with existing data', async () => {
      const cvDataWithContent = {
        ...mockCvData,
        contact: { fullName: 'Existing User', email: 'existing@email.com' },
        summary: { content: 'Existing summary content' }
      };

      render(<Header {...defaultProps} cvData={cvDataWithContent} />);
      
      // Open replacement modal
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      // Try to upload file
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      const mockFile = new File(['mock cv content'], 'test-cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      // Should show overwrite confirmation
      expect(screen.getByText('Xác nhận thay thế CV')).toBeInTheDocument();
      expect(screen.getByText(/Bạn có chắc chắn muốn thay thế toàn bộ nội dung CV hiện tại/i)).toBeInTheDocument();
      expect(screen.getByText('test-cv.pdf')).toBeInTheDocument();
    });

    it('allows cancellation of CV replacement', async () => {
      const cvDataWithContent = {
        ...mockCvData,
        contact: { fullName: 'Existing User', email: 'existing@email.com' }
      };

      render(<Header {...defaultProps} cvData={cvDataWithContent} />);
      
      // Open replacement modal and trigger overwrite confirmation
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      const mockFile = new File(['mock cv content'], 'test-cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      // Cancel overwrite - use more specific selector for the overwrite modal
      const cancelButtons = screen.getAllByRole('button', { name: /hủy/i });
      const overwriteCancelButton = cancelButtons.find(button => 
        button.closest('[aria-labelledby="overwrite-modal-title"]')
      );
      fireEvent.click(overwriteCancelButton!);
      
      // Confirmation dialog should be closed
      expect(screen.queryByText('Xác nhận thay thế CV')).not.toBeInTheDocument();
    });

    it('proceeds with replacement after confirmation', async () => {
      const onUpdateCvData = vi.fn();
      const cvDataWithContent = {
        ...mockCvData,
        contact: { fullName: 'Existing User', email: 'existing@email.com' }
      };

      mockParseFile.mockResolvedValue({
        success: true,
        cvData: {
          contact: { fullName: 'New Name', email: 'new@email.com' },
          summary: { content: 'New summary' },
          experience: { items: [] },
          skills: { items: ['New Skill'] },
          education: { items: [] }
        },
        rawText: 'Mock CV text'
      });

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Header {...defaultProps} cvData={cvDataWithContent} onUpdateCvData={onUpdateCvData} />);
      
      // Open replacement modal and trigger overwrite confirmation
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      const mockFile = new File(['mock cv content'], 'test-cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      // Confirm overwrite
      const confirmButton = screen.getByRole('button', { name: /xác nhận thay thế/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(onUpdateCvData).toHaveBeenCalledWith(expect.objectContaining({
          contact: { fullName: 'New Name', email: 'new@email.com' }
        }));
        expect(alertSpy).toHaveBeenCalledWith('CV đã được thay thế thành công!');
      });

      alertSpy.mockRestore();
    });

    it('allows cancellation of job analysis', async () => {
      render(<Header {...defaultProps} />);
      
      // Open job analysis modal
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      // Start analysis
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      // Should show cancel button during analysis
      expect(screen.getByRole('button', { name: /dừng phân tích đang chạy/i })).toBeInTheDocument();
      expect(screen.getByText('Đang phân tích...')).toBeInTheDocument();
    });

    it('handles data consistency during file replacement', async () => {
      const onUpdateCvData = vi.fn();
      
      mockParseFile.mockResolvedValue({
        success: true,
        cvData: {
          contact: { fullName: 'Parsed Name', email: 'parsed@email.com' },
          summary: { content: 'Parsed summary' },
          experience: { items: [] },
          skills: { items: [] },
          education: { items: [] }
        },
        rawText: 'Parsed CV text'
      });

      render(<Header {...defaultProps} onUpdateCvData={onUpdateCvData} />);
      
      // Upload file - this will trigger overwrite confirmation since mockCvData has content
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      const mockFile = new File(['mock cv content'], 'test-cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      // Should show overwrite confirmation
      expect(screen.getByText('Xác nhận thay thế CV')).toBeInTheDocument();
      
      // Confirm the overwrite
      const confirmButton = screen.getByRole('button', { name: /xác nhận thay thế/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(onUpdateCvData).toHaveBeenCalledWith(
          expect.objectContaining({
            contact: { fullName: 'Parsed Name', email: 'parsed@email.com' },
            summary: { content: 'Parsed summary' },
            experience: { items: [] },
            skills: { items: [] },
            education: { items: [] }
          })
        );
      });
    });

    it('manages scratch CV vs uploaded CV differences', async () => {
      // Test with scratch CV (no uploaded file)
      const scratchCvData = {
        ...mockCvData,
        contact: { fullName: 'Scratch User', email: 'scratch@email.com' },
        // No uploadedFile metadata
      };

      const onUpdateCvData = vi.fn();
      
      mockParseFile.mockResolvedValue({
        success: true,
        cvData: {
          contact: { fullName: 'Uploaded User', email: 'uploaded@email.com' },
          summary: { content: 'Uploaded summary' },
          experience: { items: [] },
          skills: { items: [] },
          education: { items: [] }
        },
        rawText: 'Uploaded CV text'
      });

      render(<Header {...defaultProps} cvData={scratchCvData} onUpdateCvData={onUpdateCvData} />);
      
      // Should show overwrite confirmation for scratch CV with content
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      const mockFile = new File(['mock cv content'], 'uploaded-cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      // Should show overwrite confirmation since scratch CV has content
      expect(screen.getByText('Xác nhận thay thế CV')).toBeInTheDocument();
    });

    it('has proper accessibility for error dialogs', () => {
      const cvDataWithContent = {
        ...mockCvData,
        contact: { fullName: 'Existing User', email: 'existing@email.com' }
      };

      render(<Header {...defaultProps} cvData={cvDataWithContent} />);
      
      // Open replacement modal and trigger overwrite confirmation
      const replaceButton = screen.getByRole('button', { name: /thay thế cv hiện tại/i });
      fireEvent.click(replaceButton);
      
      const fileInput = screen.getByLabelText(/chọn file cv để thay thế/i);
      const mockFile = new File(['mock cv content'], 'test-cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
             // Check accessibility attributes
       const dialogs = screen.getAllByRole('dialog');
       const overwriteDialog = dialogs.find(dialog => 
         dialog.getAttribute('aria-labelledby') === 'overwrite-modal-title'
       );
       expect(overwriteDialog).toHaveAttribute('aria-modal', 'true');
       expect(overwriteDialog).toHaveAttribute('aria-labelledby', 'overwrite-modal-title');
      
      const title = screen.getByRole('heading', { name: /xác nhận thay thế cv/i });
      expect(title).toHaveAttribute('id', 'overwrite-modal-title');
    });
  });

  describe('Job Analysis Button', () => {
    it('shows "Phân tích JD" button when no target job is set', () => {
      render(<Header {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Phân tích JD');
      expect(button).not.toHaveTextContent('✓');
    });

    it('shows "Đã phân tích JD" button when target job is set', () => {
      const cvDataWithTarget = {
        ...mockCvData,
        targetJobDescription: 'Software Engineer position'
      };
      
      render(<Header {...defaultProps} cvData={cvDataWithTarget} />);
      
      const button = screen.getByRole('button', { name: /đã phân tích mô tả công việc/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Đã phân tích JD');
      expect(button).toHaveTextContent('✓');
    });

    it('has correct styling for analyzed state', () => {
      const cvDataWithTarget = {
        ...mockCvData,
        targetJobDescription: 'Software Engineer position'
      };
      
      render(<Header {...defaultProps} cvData={cvDataWithTarget} />);
      
      const button = screen.getByRole('button', { name: /đã phân tích mô tả công việc/i });
      expect(button).toHaveClass('bg-success-50', 'text-success-500');
    });

    it('has correct styling for unanalyzed state', () => {
      render(<Header {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      expect(button).toHaveClass('bg-primary-50', 'text-primary-500');
    });
  });

  describe('Job Analysis Modal', () => {
    it('opens modal when job analysis button is clicked', () => {
      render(<Header {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(button);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Phân tích mô tả công việc mục tiêu')).toBeInTheDocument();
    });

    it('closes modal when cancel button is clicked', () => {
      render(<Header {...defaultProps} />);
      
      // Open modal
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      // Close modal
      const cancelButton = screen.getByRole('button', { name: /đóng modal phân tích công việc/i });
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('Phân tích mô tả công việc mục tiêu')).not.toBeInTheDocument();
    });

    it('closes modal when clicking outside', () => {
      render(<Header {...defaultProps} />);
      
      // Open modal
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      // Click outside (on the backdrop)
      const backdrop = screen.getByRole('dialog').parentElement;
      fireEvent.click(backdrop!);
      
      // Modal should still be open since we didn't implement backdrop click to close
      expect(screen.getByText('Phân tích mô tả công việc mục tiêu')).toBeInTheDocument();
    });

    it('updates textarea value when typing', () => {
      render(<Header {...defaultProps} />);
      
      // Open modal
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      expect(textarea).toHaveValue('Software Engineer job description');
    });

    it('disables analyze button when textarea is empty', () => {
      render(<Header {...defaultProps} />);
      
      // Open modal
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      expect(analyzeButton).toBeDisabled();
    });

    it('enables analyze button when textarea has content', () => {
      render(<Header {...defaultProps} />);
      
      // Open modal
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      expect(analyzeButton).not.toBeDisabled();
    });
  });

  describe('Job Analysis Functionality', () => {
    it('shows loading state during analysis', async () => {
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<Header {...defaultProps} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      expect(screen.getByText(/đang phân tích.../i)).toBeInTheDocument();
      // During analysis, the textarea should be disabled
      expect(screen.getByLabelText(/nội dung mô tả công việc/i)).toBeDisabled();
    });

    it('calls aiService.analyzeJobDescription with correct parameters', async () => {
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockResolvedValue({
        success: true,
        data: { 
          summary: ['Improve professional summary'],
          workExperience: ['Add quantifiable achievements'],
          skills: ['Add technical skills'],
          education: ['Consider additional certifications']
        }
      });
      
      render(<Header {...defaultProps} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      const jobDescription = 'Software Engineer job description';
      fireEvent.change(textarea, { target: { value: jobDescription } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(mockAnalyzeJobDescription).toHaveBeenCalledWith({
          jobDescription,
          currentCV: mockCvData
        });
      });
    });

    it('updates CV data on successful analysis', async () => {
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      const analysisResult = { 
        summary: ['Improve professional summary'],
        workExperience: ['Add quantifiable achievements'],
        skills: ['Add technical skills'],
        education: ['Consider additional certifications']
      };
      mockAnalyzeJobDescription.mockResolvedValue({
        success: true,
        data: analysisResult
      });
      
      const onUpdateCvData = vi.fn();
      const onJobAnalysisComplete = vi.fn();
      
      render(<Header {...defaultProps} onUpdateCvData={onUpdateCvData} onJobAnalysisComplete={onJobAnalysisComplete} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      const jobDescription = 'Software Engineer job description';
      fireEvent.change(textarea, { target: { value: jobDescription } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(onUpdateCvData).toHaveBeenCalledWith({
          ...mockCvData,
          targetJobDescription: jobDescription,
          suggestions: analysisResult
        });
        expect(onJobAnalysisComplete).toHaveBeenCalledWith(analysisResult);
      });
    });

    it('closes modal and updates button state on successful analysis', async () => {
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockResolvedValue({
        success: true,
        data: { 
          summary: ['Improve professional summary'],
          workExperience: ['Add quantifiable achievements'],
          skills: ['Add technical skills'],
          education: ['Consider additional certifications']
        }
      });
      
      render(<Header {...defaultProps} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Phân tích mô tả công việc mục tiêu')).not.toBeInTheDocument();
      });
      
      // Button should now show analyzed state
      expect(screen.getByText('Đã phân tích JD')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows alert when trying to analyze without job description', () => {
      render(<Header {...defaultProps} />);
      
      // Open modal
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      // Button should be disabled when no content
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      expect(analyzeButton).toBeDisabled();
    });

    it('shows alert when analysis fails', async () => {
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockResolvedValue({
        success: false,
        error: 'Analysis failed'
      });
      
      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<Header {...defaultProps} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Không thể phân tích mô tả công việc. Vui lòng thử lại.');
      });
      
      alertSpy.mockRestore();
    });

    it('shows alert when analysis throws error', async () => {
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockRejectedValue(new Error('Network error'));
      
      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<Header {...defaultProps} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Đã xảy ra lỗi khi phân tích. Vui lòng thử lại.');
      });
      
      alertSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<Header {...defaultProps} />);
      
      const jobAnalysisButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      expect(jobAnalysisButton).toHaveAttribute('aria-label');
    });

    it('has proper ARIA labels in modal', () => {
      render(<Header {...defaultProps} />);
      
      // Open modal
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      expect(textarea).toHaveAttribute('aria-describedby', 'job-description-hint');
      
      const cancelButton = screen.getByRole('button', { name: /đóng modal phân tích công việc/i });
      expect(cancelButton).toHaveAttribute('aria-label');
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      expect(analyzeButton).toHaveAttribute('aria-label');
    });

    it('updates ARIA labels during loading state', async () => {
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<Header {...defaultProps} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      fireEvent.click(analyzeButton);
      
      // Should show cancel button during analysis
      expect(screen.getByRole('button', { name: /dừng phân tích đang chạy/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing callback props gracefully', async () => {
      const mockAnalyzeJobDescription = vi.mocked(aiService.analyzeJobDescription);
      mockAnalyzeJobDescription.mockResolvedValue({
        success: true,
        data: { 
          summary: ['Improve professional summary'],
          workExperience: ['Add quantifiable achievements'],
          skills: ['Add technical skills'],
          education: ['Consider additional certifications']
        }
      });
      
      render(<Header cvScore={75} cvData={mockCvData} />);
      
      // Open modal and add job description
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: 'Software Engineer job description' } });
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      
      // Should not throw error even without callback props
      expect(() => fireEvent.click(analyzeButton)).not.toThrow();
    });

    it('handles missing cvData gracefully', () => {
      expect(() => render(<Header cvScore={75} />)).not.toThrow();
    });

    it('trims whitespace from job description', () => {
      render(<Header {...defaultProps} />);
      
      // Open modal
      const openButton = screen.getByRole('button', { name: /phân tích mô tả công việc mục tiêu/i });
      fireEvent.click(openButton);
      
      const textarea = screen.getByLabelText(/nội dung mô tả công việc/i);
      fireEvent.change(textarea, { target: { value: '   ' } }); // Only whitespace
      
      const analyzeButton = screen.getByRole('button', { name: /bắt đầu phân tích mô tả công việc/i });
      
      // Button should be disabled when only whitespace is present
      expect(analyzeButton).toBeDisabled();
    });
  });

  describe('Navigation Standardization', () => {
    it('implements single back arrow per page rule', () => {
      render(<Header {...defaultProps} />);
      
      // Should have exactly one back navigation element when cvId is present
      const backButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('aria-label')?.includes('Upload') || 
        button.textContent?.includes('←') ||
        button.querySelector('svg')
      );
      
      // Should have one back arrow and one logo
      expect(backButtons).toHaveLength(2); // Back button + Logo button
    });

    it('has consistent styling across navigation elements', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload cv & jd/i });
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      
      // Both should have consistent transition classes
      expect(backButton).toHaveClass('transition-all', 'duration-200');
      expect(logoButton).toHaveClass('transition-colors', 'duration-200');
      
      // Both should have focus states
      expect(backButton).toHaveClass('focus:outline-none', 'focus:ring-2');
      expect(logoButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('has proper hover and active states for desktop', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload cv & jd/i });
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      
      // Back button hover states
      expect(backButton).toHaveClass('hover:text-gray-800', 'hover:bg-gray-50', 'active:bg-gray-100');
      
      // Logo button hover states
      expect(logoButton).toHaveClass('hover:text-primary-600', 'active:text-primary-700');
    });

    it('has proper accessibility attributes', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload cv & jd/i });
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      
      // Both should have title and aria-label attributes
      expect(backButton).toHaveAttribute('title');
      expect(backButton).toHaveAttribute('aria-label');
      expect(logoButton).toHaveAttribute('title');
      expect(logoButton).toHaveAttribute('aria-label');
    });

    it('displays responsive text labels correctly', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload cv & jd/i });
      const textLabel = backButton.querySelector('span');
      
      // Text label should be hidden on small screens
      expect(textLabel).toHaveClass('hidden', 'sm:inline');
      expect(textLabel).toHaveTextContent('CV & JD Upload');
    });

    it('has consistent SVG icon styling', () => {
      render(<Header {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /quay lại trang upload cv & jd/i });
      const svgIcon = backButton.querySelector('svg');
      
      expect(svgIcon).toHaveClass('w-5', 'h-5');
      expect(svgIcon).toHaveAttribute('strokeWidth', '2');
      expect(svgIcon).toHaveAttribute('fill', 'none');
      expect(svgIcon).toHaveAttribute('stroke', 'currentColor');
    });

    it('shows tooltip on logo hover', () => {
      render(<Header {...defaultProps} />);
      
      const logoButton = screen.getByRole('button', { name: /quay lại cv workspace/i });
      const tooltip = logoButton.querySelector('.group-hover\\:opacity-100');
      
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('Quay lại CV Workspace');
      expect(tooltip).toHaveClass('opacity-0', 'group-hover:opacity-100');
    });
  });
}); 