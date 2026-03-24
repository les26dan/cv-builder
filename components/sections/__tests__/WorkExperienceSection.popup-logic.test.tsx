import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkExperienceSection } from '../WorkExperienceSection';

// Mock AI service
jest.mock('../../../utils/aiService', () => ({
  aiService: {
    generateBulletFromWizard: jest.fn(),
  },
}));

// Mock components
jest.mock('../../common/NewWorkExperienceWizard', () => ({
  NewWorkExperienceWizard: ({ isOpen, onSave, onClose }: any) => 
    isOpen ? (
      <div data-testid="work-experience-wizard">
        <button onClick={() => onSave({ 
          title: 'Test Job',
          company: 'Test Company',
          project: 'Test Project',
          impact: 'Test Impact' 
        })}>
          Save Experience
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}));

jest.mock('../../common/NewAIWizardModal', () => ({
  NewAIWizardModal: ({ isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="ai-wizard-modal">
        <button onClick={onClose}>Close AI Wizard</button>
      </div>
    ) : null
}));

describe('WorkExperienceSection - Popup Logic Fixes', () => {
  const mockOnUpdate = jest.fn();
  const mockOnProvideAddFunction = jest.fn();

  const defaultProps = {
    data: { items: [] },
    onUpdate: mockOnUpdate,
    isActive: true,
    cvData: {
      id: 'test-cv-1',
      summary: { content: 'Test summary' },
    },
    onProvideAddFunction: mockOnProvideAddFunction,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide add function only once to prevent auto-popup', () => {
    render(<WorkExperienceSection {...defaultProps} />);

    // Verify that onProvideAddFunction is called exactly once
    expect(mockOnProvideAddFunction).toHaveBeenCalledTimes(1);
    expect(mockOnProvideAddFunction).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should not trigger auto-popup after completing wizard', async () => {
    const { rerender } = render(<WorkExperienceSection {...defaultProps} />);

    // Get the add function
    const addFunction = mockOnProvideAddFunction.mock.calls[0][0];
    
    // Call add function to open wizard
    addFunction();
    
    await waitFor(() => {
      expect(screen.getByTestId('work-experience-wizard')).toBeInTheDocument();
    });

    // Complete the wizard by saving
    fireEvent.click(screen.getByText('Save Experience'));

    await waitFor(() => {
      // Wizard should close
      expect(screen.queryByTestId('work-experience-wizard')).not.toBeInTheDocument();
    });

    // Verify that onUpdate was called (experience was added)
    expect(mockOnUpdate).toHaveBeenCalled();

    // Re-render component to simulate state change that previously caused auto-popup
    rerender(<WorkExperienceSection {...defaultProps} data={{ items: [{ 
      id: 'test-1',
      title: 'Test Job',
      company: 'Test Company',
      bullets: ['Test bullet']
    }] }} />);

    // Wait a moment to ensure no auto-popup occurs
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify no wizard auto-opened
    expect(screen.queryByTestId('work-experience-wizard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-wizard-modal')).not.toBeInTheDocument();
  });

  it('should maintain stable add function reference', () => {
    const { rerender } = render(<WorkExperienceSection {...defaultProps} />);

    const firstCall = mockOnProvideAddFunction.mock.calls[0][0];

    // Re-render with different props
    rerender(<WorkExperienceSection {...defaultProps} isActive={false} />);

    // onProvideAddFunction should still only be called once (same stable reference)
    expect(mockOnProvideAddFunction).toHaveBeenCalledTimes(1);
    
    // The function reference should remain stable
    expect(firstCall).toBe(mockOnProvideAddFunction.mock.calls[0][0]);
  });

  it('should reset function provision flag on CV ID change', () => {
    const { rerender } = render(<WorkExperienceSection {...defaultProps} />);

    expect(mockOnProvideAddFunction).toHaveBeenCalledTimes(1);

    // Change CV ID (simulating new CV load)
    rerender(<WorkExperienceSection 
      {...defaultProps} 
      cvData={{ ...defaultProps.cvData, id: 'different-cv-id' }} 
    />);

    // Should provide function again for new CV
    expect(mockOnProvideAddFunction).toHaveBeenCalledTimes(2);
  });

  it('should handle wizard completion without auto-popup cascade', async () => {
    render(<WorkExperienceSection {...defaultProps} />);

    const addFunction = mockOnProvideAddFunction.mock.calls[0][0];
    
    // Open wizard
    addFunction();
    
    await waitFor(() => {
      expect(screen.getByTestId('work-experience-wizard')).toBeInTheDocument();
    });

    // Save experience
    fireEvent.click(screen.getByText('Save Experience'));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    // Verify no cascading popups occur
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(screen.queryByTestId('work-experience-wizard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-wizard-modal')).not.toBeInTheDocument();
  });
});
