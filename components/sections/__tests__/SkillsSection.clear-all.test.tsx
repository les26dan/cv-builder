import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillsSection } from '../SkillsSection';

// Mock the confirm dialog
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

describe('SkillsSection - Clear All Functionality', () => {
  const mockOnUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true); // Default to confirming
  });

  it('should show clear all button when skills are present', () => {
    const skillsData = {
      items: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python']
    };

    render(
      <SkillsSection
        data={skillsData}
        onUpdate={mockOnUpdate}
        isActive={true}
      />
    );

    // Clear all button should be visible and positioned at the top
    const clearAllButton = screen.getByRole('button', { name: /xóa tất cả \(5\)/i });
    expect(clearAllButton).toBeInTheDocument();
    expect(clearAllButton).toHaveTextContent('Xóa tất cả (5)');
    
    // Should be in the same container as the instruction text
    const instructionText = screen.getByText('Chọn 5-10 kỹ năng phù hợp nhất với vị trí ứng tuyển.');
    expect(instructionText).toBeInTheDocument();
  });

  it('should not show clear all button when no skills are present', () => {
    const skillsData = {
      items: []
    };

    render(
      <SkillsSection
        data={skillsData}
        onUpdate={mockOnUpdate}
        isActive={true}
      />
    );

    // Clear all button should not be visible
    const clearAllButton = screen.queryByRole('button', { name: /xóa tất cả/i });
    expect(clearAllButton).not.toBeInTheDocument();
  });

  it('should clear all skills when confirmed', async () => {
    const skillsData = {
      items: ['React', 'JavaScript', 'TypeScript']
    };

    render(
      <SkillsSection
        data={skillsData}
        onUpdate={mockOnUpdate}
        isActive={true}
      />
    );

    const clearAllButton = screen.getByRole('button', { name: /xóa tất cả \(3\)/i });
    
    // User confirms the action
    mockConfirm.mockReturnValue(true);
    
    fireEvent.click(clearAllButton);

    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith(
      'Bạn có chắc chắn muốn xóa tất cả kỹ năng? Hành động này không thể hoàn tác.'
    );

    // Should call onUpdate with empty items array
    expect(mockOnUpdate).toHaveBeenCalledWith({
      items: []
    });
  });

  it('should not clear skills when user cancels confirmation', async () => {
    const skillsData = {
      items: ['React', 'JavaScript', 'TypeScript']
    };

    render(
      <SkillsSection
        data={skillsData}
        onUpdate={mockOnUpdate}
        isActive={true}
      />
    );

    const clearAllButton = screen.getByRole('button', { name: /xóa tất cả \(3\)/i });
    
    // User cancels the action
    mockConfirm.mockReturnValue(false);
    
    fireEvent.click(clearAllButton);

    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith(
      'Bạn có chắc chắn muốn xóa tất cả kỹ năng? Hành động này không thể hoàn tác.'
    );

    // Should NOT call onUpdate
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should update count in button text dynamically', () => {
    const skillsData = {
      items: ['React', 'JavaScript']
    };

    const { rerender } = render(
      <SkillsSection
        data={skillsData}
        onUpdate={mockOnUpdate}
        isActive={true}
      />
    );

    // Initially shows count of 2
    expect(screen.getByRole('button', { name: /xóa tất cả \(2\)/i })).toBeInTheDocument();

    // Update with more skills
    const updatedSkillsData = {
      items: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'AWS']
    };

    rerender(
      <SkillsSection
        data={updatedSkillsData}
        onUpdate={mockOnUpdate}
        isActive={true}
      />
    );

    // Should show updated count
    expect(screen.getByRole('button', { name: /xóa tất cả \(6\)/i })).toBeInTheDocument();
  });

  it('should have proper styling and accessibility attributes', () => {
    const skillsData = {
      items: ['React', 'JavaScript', 'TypeScript']
    };

    render(
      <SkillsSection
        data={skillsData}
        onUpdate={mockOnUpdate}
        isActive={true}
      />
    );

    const clearAllButton = screen.getByRole('button', { name: /xóa tất cả \(3\)/i });
    
    // Check accessibility attributes
    expect(clearAllButton).toHaveAttribute('title', 'Xóa tất cả kỹ năng');
    
    // Check styling classes
    expect(clearAllButton).toHaveClass('bg-red-100', 'text-red-600', 'hover:bg-red-200');
  });

  it('should work with object-based skills format', () => {
    const skillsData = {
      items: [
        { name: 'React' },
        { name: 'JavaScript' },
        { name: 'TypeScript' }
      ]
    };

    render(
      <SkillsSection
        data={skillsData}
        onUpdate={mockOnUpdate}
        isActive={true}
      />
    );

    const clearAllButton = screen.getByRole('button', { name: /xóa tất cả \(3\)/i });
    expect(clearAllButton).toBeInTheDocument();

    mockConfirm.mockReturnValue(true);
    fireEvent.click(clearAllButton);

    expect(mockOnUpdate).toHaveBeenCalledWith({
      items: []
    });
  });

  it('should position clear all button correctly in header row', () => {
    const skillsData = {
      items: ['React', 'JavaScript', 'TypeScript']
    };

    render(
      <SkillsSection
        data={skillsData}
        onUpdate={mockOnUpdate}
        isActive={true}
      />
    );

    // Find the container with both instruction text and clear all button
    const instructionText = screen.getByText('Chọn 5-10 kỹ năng phù hợp nhất với vị trí ứng tuyển.');
    const clearAllButton = screen.getByRole('button', { name: /xóa tất cả \(3\)/i });
    
    // Both should be in the document
    expect(instructionText).toBeInTheDocument();
    expect(clearAllButton).toBeInTheDocument();
    
    // The clear all button should have proper positioning classes
    expect(clearAllButton).toHaveClass('shrink-0'); // Prevents shrinking
  });
});