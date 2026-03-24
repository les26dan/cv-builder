import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { DraggableSection } from './DraggableSection';

// Mock the dnd-kit hooks
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
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

describe('DraggableSection Component', () => {
  const defaultProps = {
    id: 'test-section',
    onActivate: jest.fn(),
    isActive: false,
    children: <div>Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default title for core sections', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} id="experience" />
        </TestWrapper>
      );
      
      expect(screen.getByText('Kinh nghiệm làm việc')).toBeInTheDocument();
    });

    it('renders with custom title when provided', () => {
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            customTitle="Custom Experience Title"
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('Custom Experience Title')).toBeInTheDocument();
    });

    it('renders content children', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} />
        </TestWrapper>
      );
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies active styling when isActive is true', () => {
      const { container } = render(
        <TestWrapper>
          <DraggableSection {...defaultProps} isActive={true} />
        </TestWrapper>
      );
      
      const sectionElement = container.firstChild;
      expect(sectionElement).toHaveClass('ring-2', 'ring-blue-200', 'border-blue-500');
    });
  });

  describe('Section Title Editing', () => {
    it('shows edit button on hover for renameable sections', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={jest.fn()}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      expect(sectionContainer).toBeInTheDocument();
      
      await user.hover(sectionContainer as HTMLElement);
      
      await waitFor(() => {
        const editButton = screen.getByTitle('Đổi tên phần này');
        expect(editButton).toBeInTheDocument();
      });
    });

    it('does not show edit button for contact section', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="contact" 
            onTitleChange={jest.fn()}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Thông tin liên hệ').closest('div');
      
      await user.hover(sectionContainer!);
      
      await waitFor(() => {
        expect(screen.queryByTitle('Đổi tên phần này')).not.toBeInTheDocument();
      });
    });

    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('saves title when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      await user.clear(input);
      await user.type(input, 'New Experience Title');
      await user.keyboard('{Enter}');
      
      expect(onTitleChange).toHaveBeenCalledWith('experience', 'New Experience Title');
      
      // After Enter, we should exit edit mode and show the title (though the parent component would need to re-render with the new title)
      await waitFor(() => {
        expect(screen.queryByDisplayValue('New Experience Title')).not.toBeInTheDocument();
      });
    });

    it('saves title when input loses focus', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      await user.clear(input);
      await user.type(input, 'Blur Save Title');
      
      // Click outside to trigger blur
      await user.click(document.body);
      
      expect(onTitleChange).toHaveBeenCalledWith('experience', 'Blur Save Title');
    });

    it('cancels editing when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      await user.clear(input);
      await user.type(input, 'Should be cancelled');
      await user.keyboard('{Escape}');
      
      expect(onTitleChange).not.toHaveBeenCalled();
      
      // Should exit edit mode and show original title
      await waitFor(() => {
        expect(screen.getByText('Kinh nghiệm làm việc')).toBeInTheDocument();
      });
    });
  });

  describe('Title Validation', () => {
    it('shows error for empty title', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      await user.clear(input);
      await user.keyboard('{Enter}');
      
      // Error should be displayed and onTitleChange should not be called
      await waitFor(() => {
        expect(screen.getByText('Tên phần không được để trống')).toBeInTheDocument();
      });
      expect(onTitleChange).not.toHaveBeenCalled();
      
      // Should still be in edit mode
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('shows error for title exceeding max length', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      const longTitle = 'This title is definitely longer than thirty characters which is the limit';
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      await user.clear(input);
      await user.type(input, longTitle);
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Tên phần không được quá 30 ký tự')).toBeInTheDocument();
      });
      expect(onTitleChange).not.toHaveBeenCalled();
      
      // Should still be in edit mode
      expect(input).toBeInTheDocument();
    });

    it('validates maximum length on save', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      // Trigger edit mode first
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      
      // Should be able to type more than 30 characters
      await user.clear(input);
      await user.type(input, 'This is a very long title that exceeds thirty characters');
      
      // But validation should trigger on save
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Tên phần không được quá 30 ký tự')).toBeInTheDocument();
      });
      expect(onTitleChange).not.toHaveBeenCalled();
    });

    it('accepts valid title within limits', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      await user.clear(input);
      await user.type(input, 'Valid Title');
      await user.keyboard('{Enter}');
      
      expect(onTitleChange).toHaveBeenCalledWith('experience', 'Valid Title');
      
      // Should exit edit mode after successful save
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Valid Title')).not.toBeInTheDocument();
      });
    });

    it('clears error when user starts typing after validation failure', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      await user.clear(input);
      await user.keyboard('{Enter}');
      
      // Error should appear
      await waitFor(() => {
        expect(screen.getByText('Tên phần không được để trống')).toBeInTheDocument();
      });
      
      // Start typing should clear the error
      await user.type(input, 'N');
      
      await waitFor(() => {
        expect(screen.queryByText('Tên phần không được để trống')).not.toBeInTheDocument();
      });
    });
  });

  describe('Section Controls', () => {
    it('shows drag handle for non-contact sections on hover', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} id="experience" />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('[class*="border"]');
      
      await user.hover(sectionContainer!);
      
      // Check for grip icon (drag handle)
      await waitFor(() => {
        const gripIcon = sectionContainer!.querySelector('svg');
        expect(gripIcon).toBeInTheDocument();
      });
    });

    it('does not show drag handle for contact section', () => {
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} id="contact" />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Thông tin liên hệ').closest('[class*="border"]');
      fireEvent.mouseEnter(sectionContainer!);
      
      // Contact section should not have drag handle
      const gripIcon = sectionContainer!.querySelector('svg[data-testid="grip-icon"]');
      expect(gripIcon).not.toBeInTheDocument();
    });

    it('calls onActivate when section is clicked', async () => {
      const user = userEvent.setup();
      const onActivate = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} onActivate={onActivate} />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Phần khác').closest('[class*="border"]');
      await user.click(sectionContainer!);
      
      expect(onActivate).toHaveBeenCalled();
    });

    it('shows delete button for custom sections', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="custom-123" 
            onDelete={onDelete}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Phần tùy chỉnh').closest('[class*="border"]');
      
      await user.hover(sectionContainer!);
      
      await waitFor(() => {
        const deleteButton = screen.getByTitle('Xóa phần này');
        expect(deleteButton).toBeInTheDocument();
      });
    });

    it('does not show delete button for core sections', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} id="experience" />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('[class*="border"]');
      
      await user.hover(sectionContainer!);
      
      await waitFor(() => {
        expect(screen.queryByTitle('Xóa phần này')).not.toBeInTheDocument();
      });
    });

    it('calls onDelete when delete button is clicked with confirmation', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="custom-123" 
            onDelete={onDelete}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Phần tùy chỉnh').closest('[class*="border"]');
      await user.hover(sectionContainer!);
      
      const deleteButton = await screen.findByTitle('Xóa phần này');
      await user.click(deleteButton);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(onDelete).toHaveBeenCalledWith('custom-123');
      
      // Restore original confirm
      window.confirm = originalConfirm;
    });

    it('does not delete when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      
      // Mock window.confirm to return false
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => false);
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="custom-123" 
            onDelete={onDelete}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Phần tùy chỉnh').closest('[class*="border"]');
      await user.hover(sectionContainer!);
      
      const deleteButton = await screen.findByTitle('Xóa phần này');
      await user.click(deleteButton);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
      
      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('toggles section expansion when expand/collapse button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps}>
            <div data-testid="section-content">Section Content</div>
          </DraggableSection>
        </TestWrapper>
      );
      
      // Initially expanded
      expect(screen.getByTestId('section-content')).toBeInTheDocument();
      
      const collapseButton = screen.getByTitle('Thu gọn');
      await user.click(collapseButton);
      
      // Should be collapsed
      expect(screen.queryByTestId('section-content')).not.toBeInTheDocument();
      
      const expandButton = screen.getByTitle('Mở rộng');
      await user.click(expandButton);
      
      // Should be expanded again
      expect(screen.getByTestId('section-content')).toBeInTheDocument();
    });
  });

  describe('AI Menu Functionality', () => {
    it('shows AI menu when AI button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} id="experience" />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('[class*="border"]');
      await user.hover(sectionContainer!);
      
      const aiButton = await screen.findByTitle('Hỗ trợ AI');
      await user.click(aiButton);
      
      expect(screen.getByText('🪄 Tạo gạch đầu dòng')).toBeInTheDocument();
      expect(screen.getByText('✨ Cải thiện tất cả gạch đầu dòng')).toBeInTheDocument();
    });

    it('closes AI menu when clicking an action', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} id="experience" />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('[class*="border"]');
      await user.hover(sectionContainer!);
      
      const aiButton = await screen.findByTitle('Hỗ trợ AI');
      await user.click(aiButton);
      
      const aiAction = screen.getByText('🪄 Tạo gạch đầu dòng');
      await user.click(aiAction);
      
      expect(screen.queryByText('🪄 Tạo gạch đầu dòng')).not.toBeInTheDocument();
    });
  });

  describe('Section Type Recognition', () => {
    const testCases = [
      { id: 'contact', expectedTitle: 'Thông tin liên hệ' },
      { id: 'summary', expectedTitle: 'Tóm tắt chuyên môn' },
      { id: 'experience', expectedTitle: 'Kinh nghiệm làm việc' },
      { id: 'skills', expectedTitle: 'Kỹ năng' },
      { id: 'education', expectedTitle: 'Học vấn' },
      { id: 'projects-123', expectedTitle: 'Dự án' },
      { id: 'volunteer-456', expectedTitle: 'Hoạt động tình nguyện' },
      { id: 'certifications-789', expectedTitle: 'Chứng chỉ' },
      { id: 'languages-101', expectedTitle: 'Ngôn ngữ' },
      { id: 'hobbies-202', expectedTitle: 'Sở thích' },
      { id: 'custom-303', expectedTitle: 'Phần tùy chỉnh' },
      { id: 'unknown-section', expectedTitle: 'Phần khác' },
    ];

    testCases.forEach(({ id, expectedTitle }) => {
      it(`correctly identifies section type for ${id}`, () => {
        render(
          <TestWrapper>
            <DraggableSection {...defaultProps} id={id} />
          </TestWrapper>
        );
        
        expect(screen.getByText(expectedTitle)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined onTitleChange gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} id="experience" />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      // Should not show edit button when onTitleChange is not provided
      await waitFor(() => {
        expect(screen.queryByTitle('Đổi tên phần này')).not.toBeInTheDocument();
      });
    });

    it('handles undefined onDelete gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DraggableSection {...defaultProps} id="custom-123" />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Phần tùy chỉnh').closest('[class*="border"]');
      await user.hover(sectionContainer!);
      
      // Should not show delete button when onDelete is not provided
      await waitFor(() => {
        expect(screen.queryByTitle('Xóa phần này')).not.toBeInTheDocument();
      });
    });

    it('does not activate section when in title editing mode', async () => {
      const user = userEvent.setup();
      const onActivate = jest.fn();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onActivate={onActivate}
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      // Click on the section container while in edit mode
      const sectionElement = screen.getByDisplayValue('Kinh nghiệm làm việc').closest('[class*="border"]');
      await user.click(sectionElement!);
      
      expect(onActivate).not.toHaveBeenCalled();
    });

    it('handles rapid successive clicks on edit button', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      
      // Click multiple times rapidly
      await user.click(editButton);
      await user.click(editButton);
      await user.click(editButton);
      
      // Should only have one input field
      const inputs = screen.getAllByDisplayValue('Kinh nghiệm làm việc');
      expect(inputs).toHaveLength(1);
    });

    it('handles empty custom title gracefully', () => {
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            customTitle=""
          />
        </TestWrapper>
      );
      
      // Should fall back to default title when custom title is empty
      expect(screen.getByText('Kinh nghiệm làm việc')).toBeInTheDocument();
    });

    it('handles whitespace-only custom title gracefully', () => {
      const { container } = render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            customTitle="   "
          />
        </TestWrapper>
      );
      
      // Should fallback to default title when custom title is only whitespace
      const titleElement = container.querySelector('h3');
      expect(titleElement?.textContent).toBe('Kinh nghiệm làm việc');
    });

    it('handles special characters in custom title', () => {
      const specialTitle = 'Kinh nghiệm & Thành tựu @2024 #1';
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            customTitle={specialTitle}
          />
        </TestWrapper>
      );
      
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it('handles long custom title without breaking layout', () => {
      const longTitle = 'This is a very long custom title that might cause layout issues';
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            customTitle={longTitle}
          />
        </TestWrapper>
      );
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('maintains proper event propagation during edit mode', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      const onActivate = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
            onActivate={onActivate}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      // Verify edit button click stopped propagation (section shouldn't activate)
      expect(onActivate).not.toHaveBeenCalled();
    });

    it('handles mouse leave during edit mode', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      // Mouse leave should not affect edit mode
      await user.unhover(sectionContainer!);
      
      // Should still be in edit mode
      expect(screen.getByDisplayValue('Kinh nghiệm làm việc')).toBeInTheDocument();
    });

    it('prevents double-save on rapid Enter presses', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      await user.clear(input);
      await user.type(input, 'New Title');
      
      // Rapid Enter presses
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');
      
      // Should only be called once
      expect(onTitleChange).toHaveBeenCalledTimes(1);
      expect(onTitleChange).toHaveBeenCalledWith('experience', 'New Title');
    });

    it('handles focus management when edit mode starts', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      
      // Input should be focused and text selected
      expect(input).toHaveFocus();
      expect((input as HTMLInputElement).selectionStart).toBe(0);
      expect((input as HTMLInputElement).selectionEnd).toBe('Kinh nghiệm làm việc'.length);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for form inputs', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="experience" 
            onTitleChange={onTitleChange}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Kinh nghiệm làm việc').closest('div');
      await user.hover(sectionContainer!);
      
      const editButton = await screen.findByTitle('Đổi tên phần này');
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Kinh nghiệm làm việc');
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500');
    });

    it('provides descriptive titles for action buttons', async () => {
      const user = userEvent.setup();
      const onTitleChange = jest.fn();
      const onDelete = jest.fn();
      
      render(
        <TestWrapper>
          <DraggableSection 
            {...defaultProps} 
            id="custom-123" 
            onTitleChange={onTitleChange}
            onDelete={onDelete}
          />
        </TestWrapper>
      );
      
      const sectionContainer = screen.getByText('Phần tùy chỉnh').closest('[class*="border"]');
      await user.hover(sectionContainer!);
      
      await waitFor(() => {
        expect(screen.getByTitle('Đổi tên phần này')).toBeInTheDocument();
        expect(screen.getByTitle('Xóa phần này')).toBeInTheDocument();
        expect(screen.getByTitle('Hỗ trợ AI')).toBeInTheDocument();
        expect(screen.getByTitle('Thu gọn')).toBeInTheDocument();
      });
    });
  });
}); 