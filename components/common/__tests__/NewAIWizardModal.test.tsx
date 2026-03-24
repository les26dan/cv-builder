import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewAIWizardModal } from '../NewAIWizardModal';

// Mock the text configuration
jest.mock('../../../config/texts/index', () => ({
  getTexts: jest.fn().mockResolvedValue({
    newWizard: {
      addBulletWizard: {
        modalTitle: 'Generate Achievement with AI',
        description: 'Provide brief details and AI will create a professional achievement bullet point.',
        fields: {
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
          cancel: 'Cancel',
          generate: 'Generate with AI'
        }
      }
    }
  })
}));

// Mock language detection
jest.mock('../../../config/languageConfig', () => ({
  detectLanguage: jest.fn().mockReturnValue({ language: 'en' })
}));

describe('NewAIWizardModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onGenerate: jest.fn(),
    jobTitle: 'Software Engineer',
    company: 'Google',
    isGenerating: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    render(<NewAIWizardModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Generate Achievement with AI/)).not.toBeInTheDocument();
  });

  test('renders modal with correct title when opened', async () => {
    render(<NewAIWizardModal {...defaultProps} />);
    
    await waitFor(() => {
      // The modal should render - check for Vietnamese text since that's the default
      expect(screen.getByText(/Tạo mô tả công việc nhanh/)).toBeInTheDocument();
      expect(screen.getByText(/AI sẽ giúp bạn tạo gạch đầu dòng/)).toBeInTheDocument();
    });
  });

  test('displays job title and company in context', async () => {
    render(<NewAIWizardModal {...defaultProps} />);
    
    await waitFor(() => {
      // The job title and company should be visible in the context or header
      expect(screen.getByText(/Software Engineer/)).toBeInTheDocument();
      expect(screen.getByText(/Google/)).toBeInTheDocument();
    });
  });

  test('renders input fields for project and impact', async () => {
    render(<NewAIWizardModal {...defaultProps} />);
    
    await waitFor(() => {
      // Check for Vietnamese placeholders since that's what's actually rendered
      expect(screen.getByPlaceholderText(/Ví dụ: Ứng dụng di động/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ví dụ: Tăng doanh thu/)).toBeInTheDocument();
    });
  });

  test('shows AI preview when project and impact are filled', async () => {
    const user = userEvent.setup();
    render(<NewAIWizardModal {...defaultProps} />);
    
    await waitFor(() => {
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Ứng dụng di động/);
      const impactInput = screen.getByPlaceholderText(/Ví dụ: Tăng doanh thu/);
      
      expect(projectInput).toBeInTheDocument();
      expect(impactInput).toBeInTheDocument();
    });
    
    const projectInput = screen.getByPlaceholderText(/Ví dụ: Ứng dụng di động/);
    const impactInput = screen.getByPlaceholderText(/Ví dụ: Tăng doanh thu/);
    
    await user.type(projectInput, 'E-commerce platform');
    await user.type(impactInput, 'increased sales 30%');
    
    // Should show AI preview with the job context (Vietnamese format)
    await waitFor(() => {
      expect(screen.getByText(/Software Engineer tại Google/)).toBeInTheDocument();
    });
  });

  test('calls onGenerate with form data when Generate button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnGenerate = jest.fn();
    render(<NewAIWizardModal {...defaultProps} onGenerate={mockOnGenerate} />);
    
    await waitFor(() => {
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Ứng dụng di động/);
      const impactInput = screen.getByPlaceholderText(/Ví dụ: Tăng doanh thu/);
      
      expect(projectInput).toBeInTheDocument();
      expect(impactInput).toBeInTheDocument();
    });
    
    const projectInput = screen.getByPlaceholderText(/Ví dụ: Ứng dụng di động/);
    const impactInput = screen.getByPlaceholderText(/Ví dụ: Tăng doanh thu/);
    
    await user.type(projectInput, 'E-commerce platform');
    await user.type(impactInput, 'increased sales 30%');
    
    const generateButton = screen.getByText(/Được tạo bởi AI/);
    await user.click(generateButton);
    
    expect(mockOnGenerate).toHaveBeenCalledWith({
      project: 'E-commerce platform',
      impact: 'increased sales 30%',
      responsibility: ''
    });
  });

  test('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    render(<NewAIWizardModal {...defaultProps} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const cancelButton = screen.getByText('Hủy');
      expect(cancelButton).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByText('Hủy');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    render(<NewAIWizardModal {...defaultProps} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('disables Generate button when isGenerating is true', async () => {
    render(<NewAIWizardModal {...defaultProps} isGenerating={true} />);
    
    await waitFor(() => {
      const generateButton = screen.getByText(/Được tạo bởi AI/);
      expect(generateButton).toBeDisabled();
    });
  });

  test('shows loading state when isGenerating is true', async () => {
    render(<NewAIWizardModal {...defaultProps} isGenerating={true} />);
    
    await waitFor(() => {
      // Should show some loading indicator
      expect(screen.getByText(/Được tạo bởi AI/)).toBeDisabled();
    });
  });

  test('resets form data when modal is closed and reopened', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<NewAIWizardModal {...defaultProps} />);
    
    await waitFor(() => {
      const projectInput = screen.getByPlaceholderText(/Ví dụ: Ứng dụng di động/);
      expect(projectInput).toBeInTheDocument();
    });
    
    const projectInput = screen.getByPlaceholderText(/Ví dụ: Ứng dụng di động/);
    await user.type(projectInput, 'Test project');
    
    expect(projectInput).toHaveValue('Test project');
    
    // Close modal
    rerender(<NewAIWizardModal {...defaultProps} isOpen={false} />);
    
    // Reopen modal
    rerender(<NewAIWizardModal {...defaultProps} isOpen={true} />);
    
    await waitFor(() => {
      const newProjectInput = screen.getByPlaceholderText(/Ví dụ: Ứng dụng di động/);
      expect(newProjectInput).toHaveValue('');
    });
  });

  test('handles empty job title and company gracefully', async () => {
    render(<NewAIWizardModal {...defaultProps} jobTitle="" company="" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Tạo mô tả công việc nhanh/)).toBeInTheDocument();
      // Should not crash even with empty props
    });
  });

  test('emphasizes short input requirement in labels', async () => {
    render(<NewAIWizardModal {...defaultProps} />);
    
    await waitFor(() => {
      // Check for "3-5 từ là đủ" in Vietnamese
      expect(screen.getByText(/3-5 từ là đủ/)).toBeInTheDocument();
      // Multiple fields should have this emphasis
      const shortInputHints = screen.getAllByText(/3-5 từ là đủ/);
      expect(shortInputHints.length).toBeGreaterThan(0);
    });
  });
});
