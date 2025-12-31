/**
 * Tests for SuggestionPanel Component
 * Task 3: Inline Suggestion Panel UI System
 * Following OkBuddy development tenets - comprehensive testing with accessibility validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SuggestionPanel } from './SuggestionPanel';
import type { JDOptimizationSuggestion } from '../../types/jdOptimization';

// Mock suggestions data
const mockSuggestions: JDOptimizationSuggestion[] = [
  {
    id: 'suggestion-1',
    sectionId: 'summary',
    sectionType: 'summary',
    originalText: 'Experienced developer with good skills.',
    suggestedText: 'Experienced software developer with strong programming skills in React and Node.js.',
    addedKeywords: ['React', 'Node.js', 'programming'],
    confidence: 85,
    reasoning: 'Added specific technical keywords to improve ATS matching',
    priority: 'high'
  },
  {
    id: 'suggestion-2', 
    sectionId: 'summary',
    sectionType: 'summary',
    originalText: 'I work well in teams.',
    suggestedText: 'Collaborative team player with excellent communication skills.',
    addedKeywords: ['communication', 'collaborative'],
    confidence: 75,
    reasoning: 'Improved professional language and added soft skill keywords',
    priority: 'medium'
  },
  {
    id: 'suggestion-3',
    sectionId: 'summary', 
    sectionType: 'summary',
    originalText: 'I like coding.',
    suggestedText: 'Passionate about software development and continuous learning.',
    addedKeywords: ['software development', 'continuous learning'],
    confidence: 90,
    reasoning: 'More professional tone with industry-relevant keywords',
    priority: 'low'
  }
];

const defaultProps = {
  sectionId: 'summary',
  sectionTitle: 'Tóm tắt chuyên môn',
  suggestions: mockSuggestions,
  language: 'vi' as const,
  onApplySuggestion: vi.fn(),
  onDismissSuggestion: vi.fn(),
  className: ''
};

describe('SuggestionPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders panel with correct title and suggestion count', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      expect(screen.getByText(/Gợi ý từ AI cho Tóm tắt chuyên môn/)).toBeInTheDocument();
      expect(screen.getByText('3 gợi ý')).toBeInTheDocument();
    });

    test('does not render when no suggestions provided', () => {
      render(<SuggestionPanel {...defaultProps} suggestions={[]} />);
      
      expect(screen.queryByText(/Gợi ý từ AI cho/)).not.toBeInTheDocument();
    });

    test('renders in English when language is set to en', () => {
      render(<SuggestionPanel {...defaultProps} language="en" />);
      
      expect(screen.getByText(/AI Suggestions for Tóm tắt chuyên môn/)).toBeInTheDocument();
      expect(screen.getByText('3 suggestions')).toBeInTheDocument();
    });
  });

  describe('Suggestions Display', () => {
    test('shows all suggestions in single section without priority grouping', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      // Priority sections have been removed - verify they don't exist
      expect(screen.queryByText('Gợi ý ưu tiên cao')).not.toBeInTheDocument();
      expect(screen.queryByText('Gợi ý khác')).not.toBeInTheDocument();
      expect(screen.queryByText('1 quan trọng')).not.toBeInTheDocument();
      
      // All suggestions should be displayed in single section
      expect(screen.getByText('3 gợi ý')).toBeInTheDocument();
    });

    test('shows all suggestions regardless of priority', () => {
      const mixedPrioritySuggestions = mockSuggestions.map(s => ({ ...s, priority: 'medium' as const }));
      render(<SuggestionPanel {...defaultProps} suggestions={mixedPrioritySuggestions} />);
      
      // No priority grouping should occur
      expect(screen.queryByText('Gợi ý ưu tiên cao')).not.toBeInTheDocument();
      expect(screen.queryByText('Gợi ý khác')).not.toBeInTheDocument();
    });
  });

  describe('Apply All Functionality', () => {
    test('shows Apply All button when multiple suggestions exist', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Áp dụng tất cả/ })).toBeInTheDocument();
      expect(screen.getByText('PRO')).toBeInTheDocument(); // Premium indicator
    });

    test('does not show Apply All button with single suggestion', () => {
      render(<SuggestionPanel {...defaultProps} suggestions={[mockSuggestions[0]]} />);
      
      expect(screen.queryByRole('button', { name: /Áp dụng tất cả/ })).not.toBeInTheDocument();
    });

    test('shows premium modal when Apply All clicked and user is not premium', async () => {
      const user = userEvent.setup();
      render(<SuggestionPanel {...defaultProps} />);
      
      const applyAllBtn = screen.getByRole('button', { name: /Áp dụng tất cả/ });
      await user.click(applyAllBtn);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Nâng cấp lên Premium')).toBeInTheDocument();
    });

    test('can close premium modal with Escape key', async () => {
      const user = userEvent.setup();
      render(<SuggestionPanel {...defaultProps} />);
      
      const applyAllBtn = screen.getByRole('button', { name: /Áp dụng tất cả/ });
      await user.click(applyAllBtn);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    test('panel is expanded by default', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByLabelText(/Nhấn để thu gọn/)).toBeInTheDocument();
    });

    test('can collapse and expand panel with click', async () => {
      const user = userEvent.setup();
      render(<SuggestionPanel {...defaultProps} />);
      
      const toggleBtn = screen.getByRole('button', { name: /Nhấn để thu gọn/ });
      await user.click(toggleBtn);
      
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Nhấn để mở rộng/)).toBeInTheDocument();
      
      await user.click(toggleBtn);
      
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    test('can collapse and expand with keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SuggestionPanel {...defaultProps} />);
      
      const toggleBtn = screen.getByRole('button', { name: /Nhấn để thu gọn/ });
      toggleBtn.focus();
      
      await user.keyboard('{Enter}');
      
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
      
      await user.keyboard(' '); // Space key
      
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Individual Suggestion Cards', () => {
    test('renders all suggestion cards with correct content', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      // Check original texts
      expect(screen.getByText('Experienced developer with good skills.')).toBeInTheDocument();
      expect(screen.getByText('I work well in teams.')).toBeInTheDocument();
      expect(screen.getByText('I like coding.')).toBeInTheDocument();
      
      // Check suggested texts (content is in HTML so we need to be more specific)
      expect(screen.getByText(/Experienced software developer with strong programming skills/)).toBeInTheDocument();
      expect(screen.getByText(/Collaborative team player with excellent communication skills/)).toBeInTheDocument();
      expect(screen.getByText(/Passionate about software development and continuous learning/)).toBeInTheDocument();
    });

    test('shows suggestions without priority badges', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      // Priority badges have been removed - verify they are not displayed
      expect(screen.queryByText('Quan trọng')).not.toBeInTheDocument();
      expect(screen.queryByText('Trung bình')).not.toBeInTheDocument();  
      expect(screen.queryByText('Thấp')).not.toBeInTheDocument();
    });

    test('shows confidence scores', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      expect(screen.getByText('85% tin cậy')).toBeInTheDocument();
      expect(screen.getByText('75% tin cậy')).toBeInTheDocument();
      expect(screen.getByText('90% tin cậy')).toBeInTheDocument();
    });

    test('shows added keywords', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('programming')).toBeInTheDocument();
      expect(screen.getByText('communication')).toBeInTheDocument();
      expect(screen.getByText('collaborative')).toBeInTheDocument();
    });

    test('shows reasoning for suggestions', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      expect(screen.getByText(/Added specific technical keywords to improve ATS matching/)).toBeInTheDocument();
      expect(screen.getByText(/Improved professional language and added soft skill keywords/)).toBeInTheDocument();
      expect(screen.getByText(/More professional tone with industry-relevant keywords/)).toBeInTheDocument();
    });
  });

  describe('Apply and Dismiss Actions', () => {
    test('calls onApplySuggestion when Apply button clicked', async () => {
      const user = userEvent.setup();
      render(<SuggestionPanel {...defaultProps} />);
      
      const applyButtons = screen.getAllByText('Áp dụng');
      await user.click(applyButtons[0]);
      
      expect(defaultProps.onApplySuggestion).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    test('calls onDismissSuggestion when Dismiss button clicked', async () => {
      const user = userEvent.setup();
      render(<SuggestionPanel {...defaultProps} />);
      
      const dismissButtons = screen.getAllByText('Bỏ qua');
      await user.click(dismissButtons[0]);
      
      expect(defaultProps.onDismissSuggestion).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    test('shows loading state when applying suggestion', async () => {
      const user = userEvent.setup();
      const slowApply = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<SuggestionPanel {...defaultProps} onApplySuggestion={slowApply} />);
      
      const applyButtons = screen.getAllByText('Áp dụng');
      await user.click(applyButtons[0]);
      
      expect(screen.getByText('Đang áp dụng...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Đang áp dụng...')).not.toBeInTheDocument();
      });
    });

    test('shows applied state for completed suggestions', async () => {
      const user = userEvent.setup();
      render(<SuggestionPanel {...defaultProps} />);
      
      const applyButtons = screen.getAllByText('Áp dụng');
      await user.click(applyButtons[0]);
      
      // Wait for the suggestion to be marked as applied
      await waitFor(() => {
        expect(screen.getByText('Đã áp dụng thành công')).toBeInTheDocument();
      });
    });
  });

  describe('Applied Count Tracking', () => {
    test('shows applied count when suggestions are applied', async () => {
      const user = userEvent.setup();
      render(<SuggestionPanel {...defaultProps} />);
      
      const applyButtons = screen.getAllByText('Áp dụng');
      await user.click(applyButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('1 đã áp dụng')).toBeInTheDocument();
      });
    });

    test('updates Apply All button when suggestions are applied', async () => {
      const user = userEvent.setup();
      render(<SuggestionPanel {...defaultProps} />);
      
      // Initially should show Apply All for 3 suggestions
      expect(screen.getByRole('button', { name: /Áp dụng tất cả/ })).toBeInTheDocument();
      
      // Apply one suggestion
      const applyButtons = screen.getAllByText('Áp dụng');
      await user.click(applyButtons[0]);
      
      // Apply All should still be there for remaining suggestions
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Áp dụng tất cả/ })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      // Panel header should be a button with proper ARIA
      const toggleBtn = screen.getByRole('button', { name: /Gợi ý AI cho Tóm tắt chuyên môn/ });
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
      expect(toggleBtn).toHaveAttribute('aria-controls', 'suggestions-summary');
      
      // Suggestions region should have proper role
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Danh sách gợi ý cho Tóm tắt chuyên môn');
      
      // High priority section should have list role
      expect(screen.getByRole('list', { name: 'Gợi ý ưu tiên cao' })).toBeInTheDocument();
    });

    test('suggestion cards have proper article structure', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(3);
      
      // Each article should have proper labelledby and describedby
      articles.forEach((article, index) => {
        expect(article).toHaveAttribute('aria-labelledby', `suggestion-${mockSuggestions[index].id}-title`);
        expect(article).toHaveAttribute('aria-describedby', `suggestion-${mockSuggestions[index].id}-description`);
      });
    });

    test('Apply and Dismiss buttons have descriptive ARIA labels', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      const applyButtons = screen.getAllByRole('button', { name: /Áp dụng gợi ý này/ });
      const dismissButtons = screen.getAllByRole('button', { name: /Bỏ qua gợi ý này/ });
      
      expect(applyButtons).toHaveLength(3);
      expect(dismissButtons).toHaveLength(3);
      
      // Check that ARIA labels include context
      expect(applyButtons[0]).toHaveAttribute('aria-label', expect.stringContaining('Experienced software developer'));
      expect(dismissButtons[0]).toHaveAttribute('aria-label', expect.stringContaining('Experienced developer'));
    });

    test('keywords have proper list structure with ARIA labels', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      // Check that keywords are properly structured as lists
      const keywordLists = screen.getAllByRole('list', { name: /Danh sách từ khóa được thêm/ });
      expect(keywordLists.length).toBeGreaterThan(0);
      
      // Check individual keywords have listitem role
      const keywordItems = screen.getAllByRole('listitem');
      expect(keywordItems.length).toBeGreaterThan(0);
    });

    test('status updates are announced to screen readers', async () => {
      const user = userEvent.setup();
      render(<SuggestionPanel {...defaultProps} />);
      
      const applyButtons = screen.getAllByText('Áp dụng');
      await user.click(applyButtons[0]);
      
      await waitFor(() => {
        const statusElement = screen.getByRole('status', { name: /Gợi ý đã được áp dụng thành công/ });
        expect(statusElement).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    test('shows condensed text on small screens', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      // Check that mobile-specific classes are applied
      expect(screen.getByText('All')).toHaveClass('sm:hidden'); // Mobile version of "Apply All"
      expect(screen.getByText('+')).toHaveClass('sm:hidden'); // Mobile version of "Improve CV"
    });

    test('adjusts padding for different screen sizes', () => {
      render(<SuggestionPanel {...defaultProps} />);
      
      // Check that responsive padding classes are used
      const sections = document.querySelectorAll('.p-3.sm\\:p-4');
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('handles missing suggestion properties gracefully', () => {
      const incompleteSuggestion = {
        id: 'incomplete',
        sectionId: 'summary',
        sectionType: 'summary' as const,
        originalText: 'Test',
        suggestedText: 'Improved test',
        addedKeywords: [],
        confidence: 80,
        reasoning: '',
        priority: 'medium' as const
      };
      
      render(<SuggestionPanel {...defaultProps} suggestions={[incompleteSuggestion]} />);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Improved test')).toBeInTheDocument();
      expect(screen.queryByText('Từ khóa được thêm:')).not.toBeInTheDocument();
      expect(screen.queryByText('Lý do:')).not.toBeInTheDocument();
    });

    test('handles apply and dismiss errors gracefully', async () => {
      const user = userEvent.setup();
      const erroringApply = vi.fn().mockRejectedValue(new Error('Apply failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<SuggestionPanel {...defaultProps} onApplySuggestion={erroringApply} />);
      
      const applyButtons = screen.getAllByText('Áp dụng');
      await user.click(applyButtons[0]);
      
      expect(consoleSpy).toHaveBeenCalledWith('Error applying suggestion:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
}); 