import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillsSection } from '../SkillsSection';

// Mock the AI service
jest.mock('../../../utils/aiService', () => ({
  aiService: {
    generateSkillSuggestions: jest.fn(),
  },
}));

// Mock CVWorkflowContext
jest.mock('../../../shared/contexts/CVWorkflowContext', () => ({
  useCVWorkflow: () => ({
    cvContent: {
      summary: 'Software Engineer with 5 years experience',
      workExperience: [
        {
          title: 'Frontend Developer',
          company: 'Tech Corp',
          bullets: ['Built React applications', 'Optimized performance']
        }
      ]
    }
  })
}));

// Import aiService properly
import * as aiServiceModule from '../../../utils/aiService';

describe('SkillsSection - AI Suggestions Enhancement', () => {
  const mockOnUpdate = jest.fn();
  const { aiService } = aiServiceModule;

  const defaultProps = {
    data: { items: ['React', 'JavaScript'] },
    onUpdate: mockOnUpdate,
    isActive: true,
    cvData: {
      summary: { content: 'Software Engineer' },
      experience: {
        items: [
          {
            title: 'Frontend Developer',
            company: 'Tech Corp',
            bullets: ['Built React applications']
          }
        ]
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should populate input field instead of directly adding skills to CV', async () => {
    // Mock AI service to return skill suggestions
    aiService.generateSkillSuggestions.mockResolvedValue({
      success: true,
      data: ['TypeScript', 'Node.js', 'GraphQL']
    });

    render(<SkillsSection {...defaultProps} />);

    // Find and click the skill suggestions button
    const suggestButton = screen.getByTestId('ai-assist-skill-suggestions');
    fireEvent.click(suggestButton);

    await waitFor(() => {
      // Verify AI service was called
      expect(aiService.generateSkillSuggestions).toHaveBeenCalled();
    });

    await waitFor(() => {
      // Check that the first suggestion appears in the input field
      const input = screen.getByPlaceholderText(/add skills/i);
      expect(input).toHaveValue('TypeScript');
    });

    // Verify that onUpdate was NOT called (skills not directly added to CV)
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should show helpful message about suggestions', async () => {
    aiService.generateSkillSuggestions.mockResolvedValue({
      success: true,
      data: ['TypeScript', 'Node.js', 'GraphQL']
    });

    render(<SkillsSection {...defaultProps} />);

    const suggestButton = screen.getByTestId('ai-assist-skill-suggestions');
    fireEvent.click(suggestButton);

    await waitFor(() => {
      // Should show a message about the suggestion
      expect(screen.getByText(/suggested.*typescript/i)).toBeInTheDocument();
    });
  });

  it('should allow cycling through suggestions', async () => {
    aiService.generateSkillSuggestions.mockResolvedValue({
      success: true,
      data: ['TypeScript', 'Node.js', 'GraphQL']
    });

    render(<SkillsSection {...defaultProps} />);

    const suggestButton = screen.getByTestId('ai-assist-skill-suggestions');
    
    // First click - should show TypeScript
    fireEvent.click(suggestButton);
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/add skills/i);
      expect(input).toHaveValue('TypeScript');
    });

    // Second click - should show next suggestion
    fireEvent.click(suggestButton);
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/add skills/i);
      expect(input).toHaveValue('Node.js');
    });
  });

  it('should clear suggestions when skill is manually added', async () => {
    aiService.generateSkillSuggestions.mockResolvedValue({
      success: true,
      data: ['TypeScript', 'Node.js']
    });

    render(<SkillsSection {...defaultProps} />);

    const suggestButton = screen.getByTestId('ai-assist-skill-suggestions');
    fireEvent.click(suggestButton);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/add skills/i);
      expect(input).toHaveValue('TypeScript');
    });

    // Add the skill manually
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    // Should clear suggestions and reset for fresh suggestions next time
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({
        items: ['React', 'JavaScript', 'TypeScript']
      });
    });
  });

  it('should handle AI service errors gracefully', async () => {
    aiService.generateSkillSuggestions.mockResolvedValue({
      success: false,
      error: 'API Error'
    });

    render(<SkillsSection {...defaultProps} />);

    const suggestButton = screen.getByTestId('ai-assist-skill-suggestions');
    fireEvent.click(suggestButton);

    await waitFor(() => {
      // Should not crash and not populate input
      const input = screen.getByPlaceholderText(/add skills/i);
      expect(input).toHaveValue('');
    });

    // Should not call onUpdate
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});
