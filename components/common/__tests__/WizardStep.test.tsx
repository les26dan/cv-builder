import React from 'react';
import { render, screen } from '@testing-library/react';
import { WizardStep } from '../WizardStep';

describe('WizardStep Component', () => {
  const defaultProps = {
    title: 'Test Step Title',
    description: 'Test step description',
    children: <div>Test content</div>
  };

  test('renders title and description correctly', () => {
    render(<WizardStep {...defaultProps} />);
    
    expect(screen.getByText('Test Step Title')).toBeInTheDocument();
    expect(screen.getByText('Test step description')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('does not show AI badge by default', () => {
    render(<WizardStep {...defaultProps} />);
    
    expect(screen.queryByText(/Tạo mô tả công việc với AI/)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI sẽ giúp bạn tạo/)).not.toBeInTheDocument();
  });

  test('shows AI badge when showAIBadge is true', () => {
    render(<WizardStep {...defaultProps} showAIBadge={true} />);
    
    expect(screen.getByText(/Tạo mô tả công việc với AI/)).toBeInTheDocument();
    expect(screen.getByText(/AI sẽ giúp bạn tạo gạch đầu dòng chuyên nghiệp/)).toBeInTheDocument();
    
    // Check for sparkles icon
    const sparklesIcon = screen.getByRole('img', { hidden: true });
    expect(sparklesIcon).toBeInTheDocument();
  });

  test('applies correct styling structure', () => {
    const { container } = render(<WizardStep {...defaultProps} showAIBadge={true} />);
    
    // Check main container has space-y-4 class
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('space-y-4');
    
    // Check AI badge styling
    const aiBadge = screen.getByText(/Tạo mô tả công việc với AI/).closest('div');
    expect(aiBadge).toHaveClass('bg-blue-50', 'border', 'border-blue-100', 'rounded-md');
  });

  test('renders children content properly', () => {
    const complexChildren = (
      <div>
        <input type="text" placeholder="Test input" />
        <button>Test button</button>
      </div>
    );
    
    render(
      <WizardStep {...defaultProps}>
        {complexChildren}
      </WizardStep>
    );
    
    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test button' })).toBeInTheDocument();
  });

  test('handles empty title and description', () => {
    render(
      <WizardStep title="" description="" showAIBadge={false}>
        <div>Content only</div>
      </WizardStep>
    );
    
    expect(screen.getByText('Content only')).toBeInTheDocument();
    // Empty title and description should still render without crashing
  });

  test('uses correct color scheme for AI badge', () => {
    render(<WizardStep {...defaultProps} showAIBadge={true} />);
    
    const aiTitle = screen.getByText(/Tạo mô tả công việc với AI/);
    expect(aiTitle).toHaveClass('text-[#0277BD]');
    
    const sparklesIcon = screen.getByRole('img', { hidden: true });
    expect(sparklesIcon).toHaveClass('text-[#0277BD]');
  });
});
