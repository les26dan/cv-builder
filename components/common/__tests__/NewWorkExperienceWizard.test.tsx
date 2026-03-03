import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewWorkExperienceWizard } from '../NewWorkExperienceWizard';

// Mock the text configuration
jest.mock('../../../config/texts/index', () => ({
  getTexts: jest.fn().mockResolvedValue({
    newWizard: {
      modalTitle: 'Add Work Experience',
      steps: {
        basicInfo: {
          title: 'Enter Basic Information',
          description: 'AI will automatically create professional job descriptions from this information.'
        },
        optionalDetails: {
          title: 'Add Details (Optional)',
          description: 'Add more information so AI can create more detailed job descriptions.'
        }
      },
      fields: {
        jobTitle: {
          label: 'Job Title',
          placeholder: 'e.g., Software Engineer'
        },
        company: {
          label: 'Company',
          placeholder: 'e.g., Google'
        },
        project: {
          label: 'Project/Achievement',
          placeholder: 'Brief description (3-5 words)'
        },
        impact: {
          label: 'Impact/Result',
          placeholder: 'Brief result (3-5 words)'
        }
      },
      buttons: {
        back: 'Back',
        next: 'Next',
        saveWithAI: 'Save with AI',
        saveWithoutAI: 'Save without AI'
      }
    }
  })
}));

// Mock language detection
jest.mock('../../../config/languageConfig', () => ({
  detectLanguage: jest.fn().mockReturnValue({ language: 'en' })
}));

// Mock job title suggestions
jest.mock('../../../utils/jobTitleSuggestions', () => ({
  filterJobTitles: jest.fn().mockReturnValue(['Software Engineer', 'Product Manager', 'Designer'])
}));

describe('NewWorkExperienceWizard Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    isGenerating: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    render(<NewWorkExperienceWizard {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Add Work Experience/)).not.toBeInTheDocument();
  });

  test('renders step 1 by default when opened', async () => {
    render(<NewWorkExperienceWizard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Enter Basic Information/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., Software Engineer/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., Google/)).toBeInTheDocument();
    });
  });

  test('shows progress indicator with 2 steps', async () => {
    render(<NewWorkExperienceWizard {...defaultProps} />);
    
    await waitFor(() => {
      // Should show step 1 of 2
      expect(screen.getByText(/1/)).toBeInTheDocument();
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });
  });

  test('displays job title suggestions', async () => {
    const user = userEvent.setup();
    render(<NewWorkExperienceWizard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
      expect(screen.getByText('Designer')).toBeInTheDocument();
    });
  });

  test('allows clicking on job title suggestions', async () => {
    const user = userEvent.setup();
    render(<NewWorkExperienceWizard {...defaultProps} />);
    
    await waitFor(() => {
      const suggestion = screen.getByText('Software Engineer');
      expect(suggestion).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Software Engineer'));
    
    const jobTitleInput = screen.getByPlaceholderText(/e.g., Software Engineer/);
    expect(jobTitleInput).toHaveValue('Software Engineer');
  });

  test('shows AI preview when both job title and company are filled', async () => {
    const user = userEvent.setup();
    render(<NewWorkExperienceWizard {...defaultProps} />);
    
    await waitFor(() => {
      const jobTitleInput = screen.getByPlaceholderText(/e.g., Software Engineer/);
      const companyInput = screen.getByPlaceholderText(/e.g., Google/);
      
      expect(jobTitleInput).toBeInTheDocument();
      expect(companyInput).toBeInTheDocument();
    });
    
    const jobTitleInput = screen.getByPlaceholderText(/e.g., Software Engineer/);
    const companyInput = screen.getByPlaceholderText(/e.g., Google/);
    
    await user.type(jobTitleInput, 'Software Engineer');
    await user.type(companyInput, 'Google');
    
    // Should show AI preview
    await waitFor(() => {
      expect(screen.getByText(/Software Engineer at Google/)).toBeInTheDocument();
    });
  });

  test('navigates to step 2 when Next is clicked with valid data', async () => {
    const user = userEvent.setup();
    render(<NewWorkExperienceWizard {...defaultProps} />);
    
    await waitFor(() => {
      const jobTitleInput = screen.getByPlaceholderText(/e.g., Software Engineer/);
      const companyInput = screen.getByPlaceholderText(/e.g., Google/);
      
      expect(jobTitleInput).toBeInTheDocument();
      expect(companyInput).toBeInTheDocument();
    });
    
    const jobTitleInput = screen.getByPlaceholderText(/e.g., Software Engineer/);
    const companyInput = screen.getByPlaceholderText(/e.g., Google/);
    
    await user.type(jobTitleInput, 'Software Engineer');
    await user.type(companyInput, 'Google');
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    // Should now show step 2
    await waitFor(() => {
      expect(screen.getByText(/Add Details/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Brief description/)).toBeInTheDocument();
    });
  });

  test('does not navigate to step 2 if required fields are empty', async () => {
    const user = userEvent.setup();
    render(<NewWorkExperienceWizard {...defaultProps} />);
    
    await waitFor(() => {
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeInTheDocument();
    });
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    // Should still be on step 1
    expect(screen.getByText(/Enter Basic Information/)).toBeInTheDocument();
  });

  test('goes back to step 1 when Back is clicked on step 2', async () => {
    const user = userEvent.setup();
    render(<NewWorkExperienceWizard {...defaultProps} />);
    
    // Fill step 1 and navigate to step 2
    await waitFor(() => {
      const jobTitleInput = screen.getByPlaceholderText(/e.g., Software Engineer/);
      const companyInput = screen.getByPlaceholderText(/e.g., Google/);
      
      expect(jobTitleInput).toBeInTheDocument();
      expect(companyInput).toBeInTheDocument();
    });
    
    const jobTitleInput = screen.getByPlaceholderText(/e.g., Software Engineer/);
    const companyInput = screen.getByPlaceholderText(/e.g., Google/);
    
    await user.type(jobTitleInput, 'Software Engineer');
    await user.type(companyInput, 'Google');
    
    await user.click(screen.getByText('Next'));
    
    // Now on step 2
    await waitFor(() => {
      expect(screen.getByText(/Add Details/)).toBeInTheDocument();
    });
    
    // Click back
    await user.click(screen.getByText('Back'));
    
    // Should be back on step 1
    expect(screen.getByText(/Enter Basic Information/)).toBeInTheDocument();
  });

  test('calls onSave with AI when Save with AI is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSave = jest.fn();
    render(<NewWorkExperienceWizard {...defaultProps} onSave={mockOnSave} />);
    
    // Fill required fields and navigate to step 2
    await waitFor(() => {
      const jobTitleInput = screen.getByPlaceholderText(/e.g., Software Engineer/);
      const companyInput = screen.getByPlaceholderText(/e.g., Google/);
      
      expect(jobTitleInput).toBeInTheDocument();
      expect(companyInput).toBeInTheDocument();
    });
    
    const jobTitleInput = screen.getByPlaceholderText(/e.g., Software Engineer/);
    const companyInput = screen.getByPlaceholderText(/e.g., Google/);
    
    await user.type(jobTitleInput, 'Software Engineer');
    await user.type(companyInput, 'Google');
    
    await user.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Save with AI')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Save with AI'));
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Software Engineer',
        company: 'Google',
        aiGenerated: true
      })
    );
  });

  test('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    render(<NewWorkExperienceWizard {...defaultProps} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('disables buttons when isGenerating is true', async () => {
    render(<NewWorkExperienceWizard {...defaultProps} isGenerating={true} />);
    
    await waitFor(() => {
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });
});
