import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditorPanel } from './EditorPanel';

// Mock the ScoreIndicator component
vi.mock('./common/ScoreIndicator', () => ({
  ScoreIndicator: ({ score }: { score: number }) => (
    <div data-testid="score-indicator">
      <div data-testid="progress-bar" style={{ width: `${score}%` }}></div>
      <span data-testid="score-text">{score}%</span>
    </div>
  )
}));

// Mock other dependencies
vi.mock('../utils/aiService', () => ({
  aiService: {
    generateSummary: vi.fn(),
    generateBullets: vi.fn(),
    suggestSkills: vi.fn(),
    analyzeJobDescription: vi.fn(),
    improveContent: vi.fn()
  }
}));

vi.mock('../shared/contexts/CVWorkflowContext', () => ({
  useCVWorkflow: () => ({
    cvData: {
      id: 'test-cv',
      contact: { fullName: 'Test User', email: 'test@test.com', phone: '', location: '' },
      summary: { content: '' },
      experience: { items: [] },
      skills: { items: [] },
      education: { items: [] }
    },
    updateCVData: vi.fn(),
    isLoading: false
  })
}));

const mockProps = {
  cvData: {
    id: 'test-cv',
    contact: { fullName: 'Test User', email: 'test@test.com', phone: '', location: '' },
    summary: { content: '' },
    experience: { items: [] },
    skills: { items: [] },
    education: { items: [] }
  },
  onUpdateSection: vi.fn(),
  onSectionOrderChange: vi.fn(),
  activeSection: null,
  setActiveSection: vi.fn(),
  cvScore: 75
};

describe('EditorPanel UI Layout Changes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CV Score Inline Layout', () => {
    it('should render CV Score inline with main title', () => {
      render(<EditorPanel {...mockProps} />);
      
      // Check that both title and CV score are in the same container
      const headerContainer = screen.getByText('Chỉnh sửa CV').closest('div');
      expect(headerContainer).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('should display main title prominently', () => {
      render(<EditorPanel {...mockProps} />);
      
      const mainTitle = screen.getByRole('heading', { name: 'Chỉnh sửa CV' });
      expect(mainTitle).toHaveClass('text-lg', 'font-medium');
    });

    it('should display CV Score label less prominently', () => {
      render(<EditorPanel {...mockProps} />);
      
      const scoreLabel = screen.getByText('Độ hoàn thiện CV');
      expect(scoreLabel).toHaveClass('text-sm', 'text-gray-500');
    });

    it('should render ScoreIndicator component with correct score', () => {
      render(<EditorPanel {...mockProps} cvScore={80} />);
      
      const scoreIndicator = screen.getByTestId('score-indicator');
      expect(scoreIndicator).toBeInTheDocument();
      
      const scoreText = screen.getByTestId('score-text');
      expect(scoreText).toHaveTextContent('80%');
    });

    it('should have proper spacing between CV score elements', () => {
      render(<EditorPanel {...mockProps} />);
      
      const scoreContainer = screen.getByText('Độ hoàn thiện CV').closest('div');
      expect(scoreContainer).toHaveClass('flex', 'items-center', 'gap-3');
    });

    it('should not display unnecessary description text', () => {
      render(<EditorPanel {...mockProps} />);
      
      // These texts should have been removed
      expect(screen.queryByText('Cập nhật thêm thông tin để tăng khả năng được nhà tuyển dụng chú ý')).not.toBeInTheDocument();
      expect(screen.queryByText('💡 Sử dụng tính năng AI để đạt điểm tối đa 100%')).not.toBeInTheDocument();
    });
  });

  describe('JD Analysis Section Consolidation', () => {
    it('should render JD analysis section with single CTA button', () => {
      render(<EditorPanel {...mockProps} />);
      
      const jdSection = screen.getByText('Phân tích JD & Tối ưu hóa').closest('[data-jd-analysis-section]');
      expect(jdSection).toBeInTheDocument();
    });

    it('should display main analyze button in header', () => {
      render(<EditorPanel {...mockProps} />);
      
      // Should have only one "Phân tích" button
      const analyzeButtons = screen.getAllByText('Phân tích');
      expect(analyzeButtons).toHaveLength(1);
      
      const analyzeButton = analyzeButtons[0];
      expect(analyzeButton).toHaveClass('px-4', 'py-2', 'text-sm', 'font-medium');
    });

    it('should not display deprecated "Phân tích lại" button', () => {
      render(<EditorPanel {...mockProps} />);
      
      // "Phân tích lại" button should be removed
      expect(screen.queryByText('Phân tích lại')).not.toBeInTheDocument();
    });

    it('should have analyze button positioned inline with section title', () => {
      render(<EditorPanel {...mockProps} />);
      
      const titleElement = screen.getByText('Phân tích JD & Tối ưu hóa');
      const headerContainer = titleElement.closest('div')?.parentElement;
      expect(headerContainer).toHaveClass('flex', 'items-center', 'justify-between');
      
      const analyzeButton = screen.getByText('Phân tích');
      expect(headerContainer).toContainElement(analyzeButton);
    });

    it('should disable analyze button when no JD input', () => {
      render(<EditorPanel {...mockProps} />);
      
      const analyzeButton = screen.getByText('Phân tích');
      expect(analyzeButton).toBeDisabled();
    });

    it('should enable analyze button when JD input is provided', () => {
      render(<EditorPanel {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText('Dán mô tả công việc vào đây để nhận được gợi ý tối ưu hóa CV từ AI...');
      fireEvent.change(textarea, { target: { value: 'Sample job description' } });
      
      const analyzeButton = screen.getByText('Phân tích');
      expect(analyzeButton).not.toBeDisabled();
    });

    it('should show loading state when analyzing', () => {
      render(<EditorPanel {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText('Dán mô tả công việc vào đây để nhận được gợi ý tối ưu hóa CV từ AI...');
      fireEvent.change(textarea, { target: { value: 'Sample job description' } });
      
      const analyzeButton = screen.getByText('Phân tích');
      fireEvent.click(analyzeButton);
      
      // Should show loading text and spinner
      expect(screen.getByText('Đang phân tích...')).toBeInTheDocument();
    });

    it('should not render duplicate action section at bottom', () => {
      render(<EditorPanel {...mockProps} />);
      
      // There should be no separate action button section at the bottom
      const allAnalyzeButtons = screen.getAllByRole('button');
      const analyzeButtonsCount = allAnalyzeButtons.filter(button => 
        button.textContent === 'Phân tích' || button.textContent === 'Đang phân tích...'
      ).length;
      
      expect(analyzeButtonsCount).toBe(1);
    });
  });

  describe('Layout Efficiency', () => {
    it('should have compact header layout', () => {
      const { container } = render(<EditorPanel {...mockProps} />);
      
      // The header should be more compact with flex layout
      const headerSection = container.querySelector('.bg-white.rounded-lg.shadow-sm');
      expect(headerSection).toBeInTheDocument();
      
      const headerContent = headerSection?.querySelector('.p-6.border-b.border-gray-200');
      expect(headerContent).toBeInTheDocument();
    });

    it('should maintain proper visual hierarchy', () => {
      render(<EditorPanel {...mockProps} />);
      
      // Main title should be larger than CV score label
      const mainTitle = screen.getByText('Chỉnh sửa CV');
      const scoreLabel = screen.getByText('Độ hoàn thiện CV');
      
      expect(mainTitle).toHaveClass('text-lg');
      expect(scoreLabel).toHaveClass('text-sm');
    });

    it('should save vertical space by consolidating elements', () => {
      const { container } = render(<EditorPanel {...mockProps} />);
      
      // Should not have separate large card containers for CV score
      const cardContainers = container.querySelectorAll('.border.border-gray-200.rounded-xl.p-5');
      expect(cardContainers).toHaveLength(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain layout integrity with different score values', () => {
      const { rerender } = render(<EditorPanel {...mockProps} cvScore={25} />);
      
      let scoreIndicator = screen.getByTestId('score-indicator');
      expect(scoreIndicator).toBeInTheDocument();
      
      rerender(<EditorPanel {...mockProps} cvScore={85} />);
      
      scoreIndicator = screen.getByTestId('score-indicator');
      expect(scoreIndicator).toBeInTheDocument();
    });

    it('should handle dynamic content without layout shifts', () => {
      render(<EditorPanel {...mockProps} />);
      
      // Layout should remain stable
      const headerContainer = screen.getByText('Chỉnh sửa CV').closest('div');
      expect(headerContainer).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });

  describe('Accessibility Improvements', () => {
    it('should maintain proper heading hierarchy', () => {
      render(<EditorPanel {...mockProps} />);
      
      const mainHeading = screen.getByRole('heading', { name: 'Chỉnh sửa CV' });
      expect(mainHeading.tagName).toBe('H2');
    });

    it('should provide clear button labeling', () => {
      render(<EditorPanel {...mockProps} />);
      
      const analyzeButton = screen.getByRole('button', { name: 'Phân tích' });
      expect(analyzeButton).toBeInTheDocument();
    });

    it('should maintain semantic structure', () => {
      render(<EditorPanel {...mockProps} />);
      
      // Score label should be semantically connected to the indicator
      const scoreLabel = screen.getByText('Độ hoàn thiện CV');
      const scoreIndicator = screen.getByTestId('score-indicator');
      
      expect(scoreLabel.closest('div')).toContainElement(scoreIndicator);
    });
  });
}); 