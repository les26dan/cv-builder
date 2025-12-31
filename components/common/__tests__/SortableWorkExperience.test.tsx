import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableWorkExperience } from '../SortableWorkExperience';

// Mock dnd-kit hooks
vi.mock('@dnd-kit/sortable', async () => {
  const actual = await vi.importActual('@dnd-kit/sortable');
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: null,
      isDragging: false
    })
  };
});

const mockExperience = {
  id: 'test-exp-1',
  title: 'Software Engineer',
  company: 'Tech Corp',
  location: 'Ho Chi Minh City',
  startDate: '01/2023',
  endDate: '12/2023',
  current: false,
  bullets: ['Developed applications', 'Led team projects']
};

const defaultProps = {
  experience: mockExperience,
  index: 0,
  children: <div>Test Content</div>,
  onToggleExpanded: vi.fn(),
  isExpanded: true,
  onRemove: vi.fn()
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndContext onDragEnd={() => {}}>
    <SortableContext items={['test-exp-1']} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  </DndContext>
);

describe('SortableWorkExperience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders work experience title and company', () => {
    render(
      <TestWrapper>
        <SortableWorkExperience {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Software Engineer at Tech Corp/)).toBeInTheDocument();
  });

  test('shows grip icon always visible', () => {
    render(
      <TestWrapper>
        <SortableWorkExperience {...defaultProps} isExpanded={true} />
      </TestWrapper>
    );

    // Check for the presence of GripVerticalIcon (using a more reliable selector)
    const gripIcon = document.querySelector('svg');
    expect(gripIcon).toBeInTheDocument();
  });

  test('calls onToggleExpanded when header is clicked', () => {
    const mockToggle = vi.fn();
    render(
      <TestWrapper>
        <SortableWorkExperience {...defaultProps} onToggleExpanded={mockToggle} />
      </TestWrapper>
    );

    const header = screen.getByText(/Software Engineer at Tech Corp/).closest('div');
    if (header) {
      fireEvent.click(header);
      expect(mockToggle).toHaveBeenCalledWith('test-exp-1');
    }
  });

  test('shows delete button when hovered', () => {
    render(
      <TestWrapper>
        <SortableWorkExperience {...defaultProps} isExpanded={true} />
      </TestWrapper>
    );

    const container = screen.getByText(/Software Engineer at Tech Corp/).closest('div');
    if (container) {
      fireEvent.mouseEnter(container);
      expect(screen.getByTitle('Xóa kinh nghiệm làm việc')).toBeInTheDocument();
    }
  });

  test('calls onRemove when delete button is clicked', () => {
    const mockRemove = vi.fn();
    render(
      <TestWrapper>
        <SortableWorkExperience {...defaultProps} isExpanded={true} onRemove={mockRemove} />
      </TestWrapper>
    );

    const container = screen.getByText(/Software Engineer at Tech Corp/).closest('div');
    if (container) {
      fireEvent.mouseEnter(container);
      const deleteButton = screen.getByTitle('Xóa kinh nghiệm làm việc');
      fireEvent.click(deleteButton);
      expect(mockRemove).toHaveBeenCalledWith(0);
    }
  });

  test('renders children when expanded', () => {
    render(
      <TestWrapper>
        <SortableWorkExperience {...defaultProps} isExpanded={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('hides children when collapsed', () => {
    render(
      <TestWrapper>
        <SortableWorkExperience {...defaultProps} isExpanded={false} />
      </TestWrapper>
    );

    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  test('shows fallback title for empty experience', () => {
    const emptyExperience = {
      ...mockExperience,
      title: '',
      company: ''
    };

    render(
      <TestWrapper>
        <SortableWorkExperience {...defaultProps} experience={emptyExperience} />
      </TestWrapper>
    );

    expect(screen.getByText('Kinh nghiệm #1')).toBeInTheDocument();
  });
}); 