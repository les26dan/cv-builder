import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { DraggableSection } from './DraggableSection';

// Mock the dnd-kit hooks
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

// Test wrapper component for DndContext
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DndContext onDragEnd={() => { /* no-op for testing */ }}>
    {children}
  </DndContext>
);

describe('DraggableSection - Suggestions Functionality', () => {
  const mockOnApplySuggestion = vi.fn();
  const mockOnDismissSuggestion = vi.fn();
  const mockOnActivate = vi.fn();

  const defaultProps = {
    id: 'test-section',
    onActivate: mockOnActivate,
    isActive: false,
    children: <div>Test Content</div>,
    onApplySuggestion: mockOnApplySuggestion,
    onDismissSuggestion: mockOnDismissSuggestion,
  };

  const mockSuggestions = [
    { keyword: 'React', description: 'JavaScript library for building user interfaces' },
    { keyword: 'TypeScript', description: 'Typed superset of JavaScript' },
    'Node.js',
    { title: 'Frontend Development', description: 'Building user-facing applications' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Suggestions Badge Display', () => {
    it('does not show suggestions badge when no suggestions provided', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.queryByText('Gợi ý')).not.toBeInTheDocument();
    });

    it('does not show suggestions badge when suggestions array is empty', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={[]} />
        </TestWrapper>
      );

      expect(screen.queryByText('Gợi ý')).not.toBeInTheDocument();
    });

    it('shows suggestions badge with correct count when suggestions are provided', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      expect(screen.getByText('Gợi ý')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('shows correct count for single suggestion', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={['Single suggestion']} />
        </TestWrapper>
      );

      expect(screen.getByText('Gợi ý')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('applies correct styling to suggestions badge', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý').closest('button');
      expect(badge).toHaveClass('bg-primary-50', 'text-primary-500', 'text-xs', 'px-2', 'py-1', 'rounded-md');
    });
  });

  describe('Suggestions Popover Interaction', () => {
    it('opens suggestions popover when badge is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('Gợi ý từ mô tả công việc')).toBeInTheDocument();
      });
    });

    it('closes suggestions popover when clicking outside', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('Gợi ý từ mô tả công việc')).toBeInTheDocument();
      });

      // Click outside the popover
      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Gợi ý từ mô tả công việc')).not.toBeInTheDocument();
      });
    });

    it('closes suggestions popover when badge is clicked again', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      
      // First click - should open
      await user.click(badge);
      await waitFor(() => {
        expect(screen.getByText('Gợi ý từ mô tả công việc')).toBeInTheDocument();
      });
      
      // Second click - should close
      await user.click(badge);
      
      // Instead of checking for aria-expanded, let's check that the popover content is no longer visible
      await waitFor(() => {
        expect(screen.queryByText('Gợi ý từ mô tả công việc')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('stops event propagation when badge is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      // onActivate should not be called when clicking the suggestions badge
      expect(mockOnActivate).not.toHaveBeenCalled();
    });
  });

  describe('Suggestions Content Display', () => {
    it('displays all suggestions in the popover', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
        expect(screen.getByText('Node.js')).toBeInTheDocument();
        expect(screen.getByText('Frontend Development')).toBeInTheDocument();
      });
    });

    it('displays descriptions for object suggestions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('JavaScript library for building user interfaces')).toBeInTheDocument();
        expect(screen.getByText('Typed superset of JavaScript')).toBeInTheDocument();
        expect(screen.getByText('Building user-facing applications')).toBeInTheDocument();
      });
    });

    it('handles string suggestions without descriptions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={['Simple string', 'Another string']} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('Simple string')).toBeInTheDocument();
        expect(screen.getByText('Another string')).toBeInTheDocument();
      });
    });

    it('shows target emoji for all suggestions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        const emojiElements = screen.getAllByText('🎯');
        expect(emojiElements).toHaveLength(5); // One in badge + 4 for each suggestion
      });
    });
  });

  describe('Individual Suggestion Actions', () => {
    it('calls onApplySuggestion when apply button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      const applyButtons = screen.getAllByText('Thêm');
      await user.click(applyButtons[0]);

      expect(mockOnApplySuggestion).toHaveBeenCalledWith('test-section', mockSuggestions[0]);
    });

    it('calls onDismissSuggestion when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      const dismissButtons = screen.getAllByText('✕');
      await user.click(dismissButtons[0]);

      expect(mockOnDismissSuggestion).toHaveBeenCalledWith('test-section', mockSuggestions[0]);
    });

    it('handles apply action for string suggestions', async () => {
      const user = userEvent.setup();
      const stringSuggestions = ['React', 'Vue.js'];
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={stringSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      const applyButtons = screen.getAllByText('Thêm');
      await user.click(applyButtons[0]);

      expect(mockOnApplySuggestion).toHaveBeenCalledWith('test-section', 'React');
    });

    it('handles dismiss action for string suggestions', async () => {
      const user = userEvent.setup();
      const stringSuggestions = ['React', 'Vue.js'];
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={stringSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      const dismissButtons = screen.getAllByText('✕');
      await user.click(dismissButtons[1]);

      expect(mockOnDismissSuggestion).toHaveBeenCalledWith('test-section', 'Vue.js');
    });
  });

  describe('Apply All Functionality', () => {
    it('calls onApplySuggestion for all suggestions when "Apply All" is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText(/Thêm tất cả gợi ý/)).toBeInTheDocument();
      });

      const applyAllButton = screen.getByText(/Thêm tất cả gợi ý/);
      await user.click(applyAllButton);

      expect(mockOnApplySuggestion).toHaveBeenCalledTimes(4);
      expect(mockOnApplySuggestion).toHaveBeenCalledWith('test-section', mockSuggestions[0]);
      expect(mockOnApplySuggestion).toHaveBeenCalledWith('test-section', mockSuggestions[1]);
      expect(mockOnApplySuggestion).toHaveBeenCalledWith('test-section', mockSuggestions[2]);
      expect(mockOnApplySuggestion).toHaveBeenCalledWith('test-section', mockSuggestions[3]);
    });

    it('closes popover after applying all suggestions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText(/Thêm tất cả gợi ý/)).toBeInTheDocument();
      });

      const applyAllButton = screen.getByText(/Thêm tất cả gợi ý/);
      await user.click(applyAllButton);

      await waitFor(() => {
        expect(screen.queryByText('Gợi ý từ mô tả công việc')).not.toBeInTheDocument();
      });
    });

    it('does not show apply all button for single suggestion', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={['Single suggestion']} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('Single suggestion')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Thêm tất cả gợi ý/)).not.toBeInTheDocument();
    });
  });

  describe('Suggestions with Missing Callbacks', () => {
    it('handles missing onApplySuggestion callback gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            suggestions={mockSuggestions}
            onApplySuggestion={undefined}
          />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      const applyButtons = screen.getAllByText('Thêm');
      
      // Should not throw error when callback is missing
      expect(() => user.click(applyButtons[0])).not.toThrow();
    });

    it('handles missing onDismissSuggestion callback gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            suggestions={mockSuggestions}
            onDismissSuggestion={undefined}
          />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      const dismissButtons = screen.getAllByText('✕');
      
      // Should not throw error when callback is missing
      expect(() => user.click(dismissButtons[0])).not.toThrow();
    });
  });

  describe('Suggestions Popover Positioning', () => {
    it('applies correct positioning classes to popover', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        const popover = screen.getByText('Gợi ý từ mô tả công việc').closest('.absolute');
        expect(popover).toHaveClass('absolute', 'right-0', 'top-full', 'mt-1');
      });
    });

    it('applies correct styling to popover container', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        const popover = screen.getByText('Gợi ý từ mô tả công việc').closest('.absolute');
        expect(popover).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg', 'border', 'border-gray-200', 'z-50');
      });
    });

    it('applies scrollable styling to suggestions list', async () => {
      const user = userEvent.setup();
      const manySuggestions = Array.from({ length: 10 }, (_, i) => `Suggestion ${i + 1}`);
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={manySuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        const suggestionsList = document.querySelector('.max-h-60.overflow-y-auto');
        expect(suggestionsList).toHaveClass('max-h-60', 'overflow-y-auto');
      });
    });
  });

  describe('Suggestions Button Styling', () => {
    it('applies correct styling to apply buttons', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        const applyButtons = screen.getAllByText('Thêm');
        expect(applyButtons[0]).toHaveClass('bg-primary-500', 'text-white', 'px-3', 'py-1', 'rounded-md', 'text-xs');
      });
    });

    it('applies correct styling to dismiss buttons', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        const dismissButtons = screen.getAllByText('✕');
        expect(dismissButtons[0]).toHaveClass('text-gray-400', 'px-2', 'py-1', 'text-xs');
      });
    });

    it('applies correct styling to apply all button', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        const applyAllButton = screen.getByText(/Thêm tất cả gợi ý/);
        expect(applyAllButton).toHaveClass('w-full', 'bg-primary-500', 'text-white', 'px-3', 'py-2', 'rounded-lg', 'text-sm');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles null suggestions gracefully', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={null as any} />
        </TestWrapper>
      );

      expect(screen.queryByText('Gợi ý')).not.toBeInTheDocument();
    });

    it('handles undefined suggestions gracefully', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={undefined} />
        </TestWrapper>
      );

      expect(screen.queryByText('Gợi ý')).not.toBeInTheDocument();
    });

    it('handles suggestions with null/undefined items', async () => {
      const user = userEvent.setup();
      const mixedSuggestions = ['Valid suggestion', null, undefined, 'Another valid'];
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mixedSuggestions as any} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('Valid suggestion')).toBeInTheDocument();
        expect(screen.getByText('Another valid')).toBeInTheDocument();
      });
    });

    it('handles suggestions with empty objects', async () => {
      const user = userEvent.setup();
      const suggestionWithEmptyObject = [
        { keyword: 'Valid', description: 'Valid description' },
        {},
        { keyword: '', description: '' },
        'String suggestion'
      ];
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={suggestionWithEmptyObject} />
        </TestWrapper>
      );

      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      await waitFor(() => {
        expect(screen.getByText('Valid')).toBeInTheDocument();
        expect(screen.getByText('String suggestion')).toBeInTheDocument();
      });
    });
  });

  describe('Interaction with AI Menu', () => {
    it('closes AI menu when suggestions popover is opened', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            suggestions={mockSuggestions}
            id="experience"
          />
        </TestWrapper>
      );

      // First hover to show AI menu button
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('[class*="border"]');
      await user.hover(sectionContainer!);

      // Click AI menu button
      await waitFor(() => {
        const aiButton = screen.getByTitle('Hỗ trợ AI');
        expect(aiButton).toBeInTheDocument();
      });

      const aiButton = screen.getByTitle('Hỗ trợ AI');
      await user.click(aiButton);

      // Verify AI menu is open
      await waitFor(() => {
        expect(screen.getByText('🪄 Tạo gạch đầu dòng')).toBeInTheDocument();
      });

      // Now click suggestions badge
      const suggestionsButton = screen.getByText('Gợi ý');
      await user.click(suggestionsButton);

      // AI menu should be closed, suggestions should be open
      await waitFor(() => {
        expect(screen.queryByText('🪄 Tạo gạch đầu dòng')).not.toBeInTheDocument();
        expect(screen.getByText('Gợi ý từ mô tả công việc')).toBeInTheDocument();
      });
    });
  });

  // Additional tests for 100% coverage
  describe('Title Editing Functionality', () => {
    const editableProps = {
      ...defaultProps,
      customTitle: 'Custom Title',
      onTitleChange: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('shows custom title when provided', () => {
      render(
        <TestWrapper>
          <DraggableSection {...editableProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('starts editing when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...editableProps} />
        </TestWrapper>
      );

      // Hover to make edit button visible
      const section = screen.getByText('Custom Title').closest('div');
      fireEvent.mouseEnter(section!);

      // Click edit button
      const editButton = screen.getByTitle('Đổi tên phần này');
      await user.click(editButton);

      // Should show input field
      expect(screen.getByDisplayValue('Custom Title')).toBeInTheDocument();
    });

    it('saves title when Enter is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...editableProps} />
        </TestWrapper>
      );

      // Start editing
      const section = screen.getByText('Custom Title').closest('div');
      fireEvent.mouseEnter(section!);
      const editButton = screen.getByTitle('Đổi tên phần này');
      await user.click(editButton);

      // Change title and press Enter
      const input = screen.getByDisplayValue('Custom Title');
      await user.clear(input);
      await user.type(input, 'New Title');
      await user.keyboard('{Enter}');

      expect(editableProps.onTitleChange).toHaveBeenCalledWith('test-section', 'New Title');
    });

    it('cancels editing when Escape is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...editableProps} />
        </TestWrapper>
      );

      // Start editing
      const section = screen.getByText('Custom Title').closest('div');
      fireEvent.mouseEnter(section!);
      const editButton = screen.getByTitle('Đổi tên phần này');
      await user.click(editButton);

      // Press Escape
      const input = screen.getByDisplayValue('Custom Title');
      await user.keyboard('{Escape}');

      // Should not call onTitleChange
      expect(editableProps.onTitleChange).not.toHaveBeenCalled();
      // Should show original title
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('shows error for empty title', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...editableProps} />
        </TestWrapper>
      );

      // Start editing
      const section = screen.getByText('Custom Title').closest('div');
      fireEvent.mouseEnter(section!);
      const editButton = screen.getByTitle('Đổi tên phần này');
      await user.click(editButton);

      // Clear input and try to save
      const input = screen.getByDisplayValue('Custom Title');
      await user.clear(input);
      fireEvent.blur(input);

      expect(screen.getByText('Tên phần không được để trống')).toBeInTheDocument();
    });

    it('shows error for title too long', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...editableProps} />
        </TestWrapper>
      );

      // Start editing
      const section = screen.getByText('Custom Title').closest('div');
      fireEvent.mouseEnter(section!);
      const editButton = screen.getByTitle('Đổi tên phần này');
      await user.click(editButton);

      // Enter long title
      const input = screen.getByDisplayValue('Custom Title');
      await user.clear(input);
      await user.type(input, 'This is a very long title that exceeds the maximum length limit');
      fireEvent.blur(input);

      expect(screen.getByText('Tên phần không được quá 30 ký tự')).toBeInTheDocument();
    });

    it('clears error when user starts typing valid text', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...editableProps} />
        </TestWrapper>
      );

      // Start editing and create error
      const section = screen.getByText('Custom Title').closest('div');
      fireEvent.mouseEnter(section!);
      const editButton = screen.getByTitle('Đổi tên phần này');
      await user.click(editButton);

      const input = screen.getByDisplayValue('Custom Title');
      await user.clear(input);
      fireEvent.blur(input);

      expect(screen.getByText('Tên phần không được để trống')).toBeInTheDocument();

      // Start typing valid text
      await user.type(input, 'Valid');

      await waitFor(() => {
        expect(screen.queryByText('Tên phần không được để trống')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Functionality', () => {
    const deletableProps = {
      ...defaultProps,
      canDelete: true,
      onDelete: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
      // Mock window.confirm
      window.confirm = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('shows delete button when canDelete is true', () => {
      render(
        <TestWrapper>
          <DraggableSection {...deletableProps} />
        </TestWrapper>
      );

      // Hover to make delete button visible
      const section = screen.getByText('Phần khác').closest('div');
      fireEvent.mouseEnter(section!);

      expect(screen.getByLabelText('Xóa phần này')).toBeInTheDocument();
    });

    it('calls onDelete when confirmed', async () => {
      (window.confirm as vi.Mock).mockReturnValue(true);
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...deletableProps} />
        </TestWrapper>
      );

      // Hover and click delete
      const section = screen.getByText('Phần khác').closest('div');
      fireEvent.mouseEnter(section!);
      const deleteButton = screen.getByLabelText('Xóa phần này');
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(deletableProps.onDelete).toHaveBeenCalledWith('test-section');
    });

    it('does not call onDelete when cancelled', async () => {
      (window.confirm as vi.Mock).mockReturnValue(false);
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...deletableProps} />
        </TestWrapper>
      );

      // Hover and click delete
      const section = screen.getByText('Phần khác').closest('div');
      fireEvent.mouseEnter(section!);
      const deleteButton = screen.getByLabelText('Xóa phần này');
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(deletableProps.onDelete).not.toHaveBeenCalled();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('toggles expanded state when expand button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps}>
            <div>Section Content</div>
          </DraggableSection>
        </TestWrapper>
      );

      // Initially expanded - content should be visible
      expect(screen.getByText('Section Content')).toBeInTheDocument();

      // Click collapse button
      const collapseButton = screen.getByLabelText('Thu gọn phần này');
      await user.click(collapseButton);

      // Content should be hidden
      expect(screen.queryByText('Section Content')).not.toBeInTheDocument();

      // Click expand button
      const expandButton = screen.getByLabelText('Mở rộng phần này');
      await user.click(expandButton);

      // Content should be visible again
      expect(screen.getByText('Section Content')).toBeInTheDocument();
    });
  });

  describe('AI Menu Functionality', () => {
    it('opens and closes AI menu when AI button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} />
        </TestWrapper>
      );

      // Hover to make AI button visible
      const section = screen.getByText('Phần khác').closest('div');
      fireEvent.mouseEnter(section!);

      // Click AI button
      const aiButton = screen.getByLabelText('Hỗ trợ AI');
      await user.click(aiButton);

      // Menu should be open
      expect(screen.getByText('✨ Cải thiện nội dung')).toBeInTheDocument();

      // Click again to close
      await user.click(aiButton);

      // Menu should be closed
      await waitFor(() => {
        expect(screen.queryByText('✨ Cải thiện nội dung')).not.toBeInTheDocument();
      });
    });

    it('handles AI action clicks', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} />
        </TestWrapper>
      );

      // Open AI menu
      const section = screen.getByText('Phần khác').closest('div');
      fireEvent.mouseEnter(section!);
      const aiButton = screen.getByLabelText('Hỗ trợ AI');
      await user.click(aiButton);

      // Click an action
      const actionButton = screen.getByText('✨ Cải thiện nội dung');
      await user.click(actionButton);

      expect(consoleSpy).toHaveBeenCalledWith('AI Action: ✨ Cải thiện nội dung for section test-section');
      
      consoleSpy.mockRestore();
    });

    it('closes suggestions when AI menu is opened', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mockSuggestions} />
        </TestWrapper>
      );

      // Open suggestions first
      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      expect(screen.getByText('Gợi ý từ mô tả công việc')).toBeInTheDocument();

      // Open AI menu
      const section = screen.getByText('Phần khác').closest('div');
      fireEvent.mouseEnter(section!);
      const aiButton = screen.getByLabelText('Hỗ trợ AI');
      await user.click(aiButton);

      // Suggestions should be closed
      await waitFor(() => {
        expect(screen.queryByText('Gợi ý từ mô tả công việc')).not.toBeInTheDocument();
      });
    });
  });

  describe('Section Title Generation', () => {
    it('generates correct titles for different section types', () => {
      const testCases = [
        { id: 'projects-1', expected: 'Dự án' },
        { id: 'volunteer-1', expected: 'Hoạt động tình nguyện' },
        { id: 'certifications-1', expected: 'Chứng chỉ' },
        { id: 'languages-1', expected: 'Ngôn ngữ' },
        { id: 'hobbies-1', expected: 'Sở thích' },
        { id: 'custom-1', expected: 'Phần tùy chỉnh' },
        { id: 'unknown-section', expected: 'Phần khác' },
      ];

      testCases.forEach(({ id, expected }) => {
        const { unmount } = render(
          <TestWrapper>
            <DraggableSection {...defaultProps} id={id} />
          </TestWrapper>
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('uses custom title when provided and not empty', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} id="projects-1" customTitle="My Projects" />
        </TestWrapper>
      );

      expect(screen.getByText('My Projects')).toBeInTheDocument();
      expect(screen.queryByText('Dự án')).not.toBeInTheDocument();
    });

    it('falls back to default title when custom title is empty', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} id="projects-1" customTitle="   " />
        </TestWrapper>
      );

      expect(screen.getByText('Dự án')).toBeInTheDocument();
    });
  });

  describe('Suggestion Filtering', () => {
    it('filters out suggestions with invalid display text', () => {
      const invalidSuggestions = [
        { keyword: '' },
        { title: '' },
        {},
        { keyword: null },
        { title: undefined },
      ];

      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={invalidSuggestions} />
        </TestWrapper>
      );

      // Should not show suggestions badge since all are invalid
      expect(screen.queryByText('Gợi ý')).not.toBeInTheDocument();
    });

    it('shows only valid suggestions in popover', async () => {
      const mixedSuggestions = [
        'Valid String',
        { keyword: 'Valid Keyword', description: 'Valid description' },
        { keyword: '' }, // Invalid
        {}, // Invalid
        null, // Invalid
        'Another Valid String'
      ];

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={mixedSuggestions} />
        </TestWrapper>
      );

      // Should show badge with count of valid suggestions only
      expect(screen.getByText('3')).toBeInTheDocument();

      // Open suggestions
      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      // Should only show valid suggestions
      expect(screen.getByText('Valid String')).toBeInTheDocument();
      expect(screen.getByText('Valid Keyword')).toBeInTheDocument();
      expect(screen.getByText('Another Valid String')).toBeInTheDocument();
    });

    it('handles edge case with object that becomes [object Object]', async () => {
      // Create an object that would result in '[object Object]' when converted to string
      const edgeCaseSuggestions: any[] = [
        'Valid String',
        { toString: () => '[object Object]' }, // This would be filtered out in render
        { keyword: 'Valid Keyword' }
      ];

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} suggestions={edgeCaseSuggestions} />
        </TestWrapper>
      );

      // Open suggestions
      const badge = screen.getByText('Gợi ý');
      await user.click(badge);

      // Should only show valid suggestions, not the [object Object] one
      expect(screen.getByText('Valid String')).toBeInTheDocument();
      expect(screen.getByText('Valid Keyword')).toBeInTheDocument();
      expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    });
  });

  describe('Input Focus Management', () => {
    it('focuses and selects input when starting to edit title', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} customTitle="Test" onTitleChange={vi.fn()} />
        </TestWrapper>
      );

      // Start editing
      const section = screen.getByText('Test').closest('div');
      fireEvent.mouseEnter(section!);
      const editButton = screen.getByTitle('Đổi tên phần này');
      await user.click(editButton);

      // Input should be focused and selected (check if it's the active element)
      const input = screen.getByDisplayValue('Test');
      expect(input).toHaveFocus();
      expect(input).toHaveProperty('selectionStart', 0);
      expect(input).toHaveProperty('selectionEnd', 4);
    });
  });
}); 