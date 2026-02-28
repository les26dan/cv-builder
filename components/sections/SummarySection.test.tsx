import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { SummarySection } from './SummarySection';
import { useState } from 'react';

// Mock the AIAssistButton component
vi.mock('../common/AIAssistButton', () => ({
  AIAssistButton: ({ label, onClick, disabled }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`ai-assist-tao-tom-tat-voi-ai`}
    >
      {label}
    </button>
  ),
}));

// Mock AI service
vi.mock('../../utils/aiService', () => ({
  aiService: {
    generateSummary: vi.fn().mockResolvedValue({
      success: true,
      data: 'Với hơn 3 năm kinh nghiệm làm việc trong lĩnh vực phát triển phần mềm, tôi đã tích lũy được nhiều kỹ năng và kinh nghiệm quý báu.'
    }),
    generateEnhancedSummary: vi.fn().mockResolvedValue({
      success: true,
      data: 'Với hơn 3 năm kinh nghiệm làm việc trong lĩnh vực phát triển phần mềm, tôi đã tích lũy được nhiều kỹ năng và kinh nghiệm quý báu.'
    }),
    improveSummary: vi.fn().mockResolvedValue({
      success: true,
      data: 'Tôi cam kết mang lại giá trị cao nhất cho tổ chức thông qua kỹ năng chuyên môn và tinh thần làm việc tích cực.'
    })
  }
}));

// Test wrapper component
const SummarySectionWrapper = ({ initialData = {}, cvData, onUpdate, onNavigateToSection }: any) => {
  const [data, setData] = useState({
    content: '',
    ...initialData
  });

  const handleUpdate = (newData: any) => {
    setData(newData);
    if (onUpdate) onUpdate(newData);
  };

  return (
    <SummarySection 
      data={data} 
      onUpdate={handleUpdate} 
      isActive={true}
      cvData={cvData}
      onNavigateToSection={onNavigateToSection}
    />
  );
};

describe('SummarySection Component - AI-Powered', () => {
  const mockOnUpdate = vi.fn();
  const mockOnNavigateToSection = vi.fn();
  
  const defaultProps = {
    data: { content: '' },
    onUpdate: mockOnUpdate,
    isActive: true,
  };

  const mockCVDataWithExperience = {
    experience: {
      items: [{
        id: 'exp-1',
        title: 'Software Developer',
        company: 'Tech Corp',
        bullets: ['Developed features']
      }]
    }
  };

  const mockCVDataWithoutExperience = {
    experience: {
      items: []
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Smart Guidance for Empty State', () => {
    test('shows guidance banner when summary and experience are empty', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithoutExperience}
          onNavigateToSection={mockOnNavigateToSection}
        />
      );

      expect(screen.getByText('Bắt đầu dễ dàng hơn!')).toBeInTheDocument();
      expect(screen.getByText(/Hãy bắt đầu với kinh nghiệm làm việc/)).toBeInTheDocument();
      expect(screen.getByText('Đi đến Kinh nghiệm làm việc')).toBeInTheDocument();
    });

    test('navigates to experience section when guidance button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithoutExperience}
          onNavigateToSection={mockOnNavigateToSection}
        />
      );

      const navigateBtn = screen.getByText('Đi đến Kinh nghiệm làm việc');
      await user.click(navigateBtn);

      expect(mockOnNavigateToSection).toHaveBeenCalledWith('experience');
    });

    test('shows direct input option even in guidance mode', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithoutExperience}
          onNavigateToSection={mockOnNavigateToSection}
        />
      );

      expect(screen.getByText('Hoặc bạn có thể viết tóm tắt trực tiếp')).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText(/Viết tóm tắt về kinh nghiệm/);
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Normal Mode - AI-First Approach', () => {
    test('renders guidance text for AI assistance', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithExperience}
        />
      );

      expect(screen.getByText(/Viết 2-4 câu ngắn gọn & đầy năng lượng/)).toBeInTheDocument();
    });

    test('renders textarea for content input', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithExperience}
        />
      );

      const textarea = screen.getByPlaceholderText(/Tóm tắt ngắn gọn về kinh nghiệm/);
      expect(textarea).toBeInTheDocument();
    });

    test('shows generate AI button when content is empty', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithExperience}
        />
      );

      expect(screen.getByText('Tạo tóm tắt với AI')).toBeInTheDocument();
    });

    test('shows improve AI button when content exists', () => {
      const propsWithContent = {
        ...defaultProps,
        data: { content: 'Existing summary content' },
        cvData: mockCVDataWithExperience
      };

      render(<SummarySection {...propsWithContent} />);

      expect(screen.getByText('Cải thiện tóm tắt')).toBeInTheDocument();
    });
  });

  describe('Content Input and Updates', () => {
    test('updates content when typing in textarea', async () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithExperience}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New summary content' } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: 'New summary content'
      });
    });

    test('textarea is disabled during AI generation', async () => {
      render(
        <SummarySectionWrapper
          onUpdate={mockOnUpdate}
          cvData={mockCVDataWithExperience}
        />
      );

      const textarea = screen.getByRole('textbox');
      const generateButton = screen.getByText('Tạo tóm tắt với AI');
      
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(textarea).toBeDisabled();
      });
    });
  });

  describe('AI-Powered Content Generation', () => {
    test('generates summary content when AI button is clicked', async () => {
      render(
        <SummarySectionWrapper
          onUpdate={mockOnUpdate}
          cvData={mockCVDataWithExperience}
        />
      );

      const generateButton = screen.getByText('Tạo tóm tắt với AI');
      fireEvent.click(generateButton);

      // Should show loading state
      expect(screen.getByText(/Đang tạo nội dung/)).toBeInTheDocument();

      // Fast forward time to complete generation
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.stringContaining('Với hơn 3 năm kinh nghiệm')
          })
        );
      });
    });

    test('improves existing summary when improve button is clicked', async () => {
      render(
        <SummarySectionWrapper 
          initialData={{ content: 'Existing summary content with enough words to meet minimum requirements and proper punctuation.' }}
          onUpdate={mockOnUpdate} 
          cvData={mockCVDataWithExperience}
        />
      );

      const improveButton = screen.getByText('Cải thiện tóm tắt');
      fireEvent.click(improveButton);

      // Should show loading state
      expect(screen.getByText(/Đang tạo nội dung/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.stringContaining('Tôi cam kết mang lại giá trị')
          })
        );
      });
    });

    test('shows loading overlay during AI generation', async () => {
      render(
        <SummarySectionWrapper
          onUpdate={mockOnUpdate}
          cvData={mockCVDataWithExperience}
        />
      );

      const generateButton = screen.getByText('Tạo tóm tắt với AI');
      fireEvent.click(generateButton);

      expect(screen.getByText(/Đang tạo nội dung/)).toBeInTheDocument();
      
      // Check for loading spinner
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });

    test('handles AI generation errors gracefully', async () => {
      // Mock AI service to return error
      const { aiService } = await import('../../utils/aiService');
      aiService.generateEnhancedSummary = vi.fn().mockResolvedValueOnce({
        success: false,
        error: 'API Error'
      });

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {
        // Mock implementation for alert
      });

      render(
        <SummarySectionWrapper
          onUpdate={mockOnUpdate}
          cvData={mockCVDataWithExperience}
        />
      );

      const generateButton = screen.getByText('Tạo tóm tắt với AI');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Không thể tạo tóm tắt. Vui lòng thử lại.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('User Experience', () => {
    test('maintains focus on user experience over validation', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithExperience}
        />
      );

      // No validation messages should be present
      expect(screen.queryByText(/lỗi/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/warning/i)).not.toBeInTheDocument();
      
      // Focus should be on AI assistance
      expect(screen.getByText('Tạo tóm tắt với AI')).toBeInTheDocument();
    });

    test('allows any content without validation restrictions', async () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithExperience}
        />
      );

      const textarea = screen.getByRole('textbox');
      
      // Test various content types - all should be accepted
      const testInputs = [
        'Short',
        'A very long summary that exceeds typical character limits but should still be accepted because we trust our AI to generate optimal content',
        'Content without punctuation',
        '   ',  // whitespace only
        'Special chars !@#$%^&*()',
      ];

      for (const input of testInputs) {
        fireEvent.change(textarea, { target: { value: input } });
        expect(mockOnUpdate).toHaveBeenCalledWith({ content: input });
      }
    });

    test('provides helpful guidance without restrictions', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithExperience}
        />
      );

      const guidanceText = screen.getByText(/Viết 2-4 câu ngắn gọn & đầy năng lượng/);
      expect(guidanceText).toBeInTheDocument();
      
      // This is guidance, not validation
      expect(guidanceText.tagName).toBe('P');
      expect(guidanceText).not.toHaveClass('error', 'warning');
    });
  });

  describe('Edge Cases', () => {
    test('handles missing cvData gracefully', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={undefined}
        />
      );

      // Should still render without crashing
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('handles empty experience items', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={{ experience: { items: [] } }}
          onNavigateToSection={mockOnNavigateToSection}
        />
      );

      // Should show guidance for empty experience
      expect(screen.getByText('Bắt đầu dễ dàng hơn!')).toBeInTheDocument();
    });

    test('works without onNavigateToSection callback', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithoutExperience}
        />
      );

      // Should render without crashing even without navigation callback
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('textarea has proper labeling', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithExperience}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder');
    });

    test('loading state is announced', async () => {
      render(
        <SummarySectionWrapper
          onUpdate={mockOnUpdate}
          cvData={mockCVDataWithExperience}
        />
      );

      const generateButton = screen.getByText('Tạo tóm tắt với AI');
      fireEvent.click(generateButton);

      const loadingText = screen.getByText(/Đang tạo nội dung/);
      expect(loadingText).toBeInTheDocument();
    });

    test('navigation button has descriptive text', () => {
      render(
        <SummarySection
          {...defaultProps}
          cvData={mockCVDataWithoutExperience}
          onNavigateToSection={mockOnNavigateToSection}
        />
      );

      const navButton = screen.getByText('Đi đến Kinh nghiệm làm việc');
      expect(navButton).toBeInTheDocument();
      expect(navButton.tagName).toBe('BUTTON');
    });
  });
}); 