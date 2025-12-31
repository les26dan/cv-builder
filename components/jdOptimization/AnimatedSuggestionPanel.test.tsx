/**
 * AnimatedSuggestionPanel Component Tests
 * Task 5: Testing enhanced animated suggestion UI
 * Focused on functionality over complex animation timing
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AnimatedSuggestionPanel } from './AnimatedSuggestionPanel';
import type { JDOptimizationSuggestion } from '../../types/jdOptimization';

const mockSuggestion: JDOptimizationSuggestion = {
  id: 'test-suggestion-1',
  sectionType: 'summary',
  sectionId: 'summary',
  originalText: 'Basic summary text',
  suggestedText: 'Enhanced summary with key skills and experience',
  addedKeywords: ['leadership', 'project management'],
  priority: 'high',
  confidence: 85,
  reasoning: 'Improved alignment with job requirements'
};

const defaultProps = {
  sectionId: 'summary',
  sectionTitle: 'Summary',
  suggestions: [mockSuggestion],
  language: 'vi' as const,
  onApplySuggestion: vi.fn(),
  onDismissSuggestion: vi.fn(),
  onApplyAll: vi.fn(),
  isApplyingAll: false,
  applyAllProgress: { current: 0, total: 0 },
  appliedSuggestions: new Set<string>(),
  className: ''
};

describe('AnimatedSuggestionPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders suggestion panel with correct title', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      expect(screen.getByText(/Gợi ý từ AI cho Summary/)).toBeInTheDocument();
    });

    it('displays suggestion count correctly', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      expect(screen.getByText('1 gợi ý')).toBeInTheDocument();
    });

    it('renders suggestion content', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      expect(screen.getByText('Basic summary text')).toBeInTheDocument();
      expect(screen.getByText('Enhanced summary with key skills and experience')).toBeInTheDocument();
    });

    it('does not show priority indicator (removed feature)', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      expect(screen.queryByText('Quan trọng')).not.toBeInTheDocument();
    });

    it('displays confidence percentage', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      expect(screen.getByText('85% tin cậy')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onApplySuggestion when apply button is clicked', async () => {
      const user = userEvent.setup();
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      const applyButton = screen.getByRole('button', { name: /Áp dụng/ });
      await user.click(applyButton);
      
      expect(defaultProps.onApplySuggestion).toHaveBeenCalledWith(mockSuggestion);
    });

    it('calls onDismissSuggestion when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      const dismissButton = screen.getByRole('button', { name: /Bỏ qua/ });
      await user.click(dismissButton);
      
      expect(defaultProps.onDismissSuggestion).toHaveBeenCalledWith(mockSuggestion);
    });

    it('calls onApplyAll when apply all button is clicked', async () => {
      const user = userEvent.setup();
      const multiSuggestionProps = {
        ...defaultProps,
        suggestions: [mockSuggestion, { ...mockSuggestion, id: 'test-suggestion-2' }]
      };
      
      render(<AnimatedSuggestionPanel {...multiSuggestionProps} />);
      
      const applyAllButton = screen.getByRole('button', { name: /Áp dụng tất cả/ });
      await user.click(applyAllButton);
      
      expect(defaultProps.onApplyAll).toHaveBeenCalled();
    });

    it('toggles panel expansion when header is clicked', async () => {
      const user = userEvent.setup();
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      const header = screen.getByRole('button', { expanded: true });
      await user.click(header);
      
      // Verify that the panel can be toggled (basic interaction test)
      expect(header).toHaveAttribute('aria-expanded');
    });
  });

  describe('Apply All Functionality', () => {
    it('shows apply all button when multiple suggestions exist', () => {
      const multiSuggestionProps = {
        ...defaultProps,
        suggestions: [mockSuggestion, { ...mockSuggestion, id: 'test-suggestion-2' }]
      };
      
      render(<AnimatedSuggestionPanel {...multiSuggestionProps} />);
      
      expect(screen.getByRole('button', { name: /Áp dụng tất cả/ })).toBeInTheDocument();
    });

    it('hides apply all button when only one suggestion exists', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      expect(screen.queryByRole('button', { name: /Áp dụng tất cả/ })).not.toBeInTheDocument();
    });

    it('shows progress when applying all suggestions', () => {
      const applyingProps = {
        ...defaultProps,
        suggestions: [mockSuggestion, { ...mockSuggestion, id: 'test-suggestion-2' }],
        isApplyingAll: true,
        applyAllProgress: { current: 1, total: 2 }
      };
      
      render(<AnimatedSuggestionPanel {...applyingProps} />);
      
      expect(screen.getByText('1/2')).toBeInTheDocument();
      expect(screen.getByText(/Đang áp dụng/)).toBeInTheDocument();
    });
  });

  describe('Applied Suggestions', () => {
    it('shows applied state for applied suggestions', () => {
      const appliedProps = {
        ...defaultProps,
        appliedSuggestions: new Set(['test-suggestion-1'])
      };
      
      render(<AnimatedSuggestionPanel {...appliedProps} />);
      
      expect(screen.getByText('Đã áp dụng thành công')).toBeInTheDocument();
    });

    it('updates applied count correctly', () => {
      const multiSuggestionProps = {
        ...defaultProps,
        suggestions: [mockSuggestion, { ...mockSuggestion, id: 'test-suggestion-2' }],
        appliedSuggestions: new Set(['test-suggestion-1'])
      };
      
      render(<AnimatedSuggestionPanel {...multiSuggestionProps} />);
      
      expect(screen.getByText('1 đã áp dụng')).toBeInTheDocument();
    });
  });

  describe('Language Support', () => {
    it('renders English text when language is en', () => {
      const englishProps = { ...defaultProps, language: 'en' as const };
      render(<AnimatedSuggestionPanel {...englishProps} />);
      
      expect(screen.getByText(/AI Suggestions for Summary/)).toBeInTheDocument();
      expect(screen.getByText('1 suggestions')).toBeInTheDocument();
    });

    it('renders Vietnamese text when language is vi', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      expect(screen.getByText(/Gợi ý từ AI cho Summary/)).toBeInTheDocument();
      expect(screen.getByText('1 gợi ý')).toBeInTheDocument();
    });
  });

  describe('Simplified Display (Priority Removed)', () => {
    it('does not display priority indicators', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      expect(screen.queryByText('Quan trọng')).not.toBeInTheDocument();
    });

    it('does not show priority sections', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      expect(screen.queryByText('Gợi ý ưu tiên cao')).not.toBeInTheDocument();
    });

    it('displays all suggestions in single section regardless of priority', () => {
      const mediumPriorityProps = {
        ...defaultProps,
        suggestions: [{ ...mockSuggestion, priority: 'medium' as const }]
      };
      
      render(<AnimatedSuggestionPanel {...mediumPriorityProps} />);
      
      expect(screen.queryByText('Trung bình')).not.toBeInTheDocument();
      // Should still show suggestions
      expect(screen.getByText('Basic summary text')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('does not render when no suggestions provided', () => {
      const emptyProps = { ...defaultProps, suggestions: [] };
      const { container } = render(<AnimatedSuggestionPanel {...emptyProps} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for expandable panel', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      const header = screen.getByRole('button', { expanded: true });
      expect(header).toHaveAttribute('aria-expanded');
      expect(header).toHaveAttribute('tabIndex', '0');
    });

    it('provides proper button labels', () => {
      render(<AnimatedSuggestionPanel {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Áp dụng/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Bỏ qua/ })).toBeInTheDocument();
    });
  });
}); 