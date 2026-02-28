import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MathCaptcha from '../MathCaptcha';

// Mock fetch
global.fetch = jest.fn();

describe('MathCaptcha Component', () => {
  const mockOnChange = jest.fn();
  const mockOnValidation = jest.fn();

  const mockCaptchaResponse = {
    sessionId: 'test-session-id',
    problem: {
      num1: 5,
      num2: 3,
      operation: '+'
    }
  };

  const mockValidationResponse = {
    valid: true,
    message: 'CAPTCHA hợp lệ'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCaptchaResponse)
    });
  });

  it('shows loading state initially', async () => {
    // Mock a delayed response to capture loading state
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: jest.fn().mockResolvedValue(mockCaptchaResponse)
        }), 100)
      )
    );

    render(
      <MathCaptcha
        value=""
        onChange={mockOnChange}
        onValidation={mockOnValidation}
      />
    );
    
    // Should show loading initially
    expect(screen.getByText('Đang tải CAPTCHA...')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('renders the math problem after loading', async () => {
    await act(async () => {
      render(
        <MathCaptcha
          value=""
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('+')).toBeInTheDocument();
      expect(screen.getByText('=')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  it('fetches CAPTCHA from API on mount', async () => {
    await act(async () => {
      render(
        <MathCaptcha
          value=""
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/captcha');
    });
  });

  it('renders answer input field after loading', async () => {
    await act(async () => {
      render(
        <MathCaptcha
          value=""
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Nhập đáp án');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  it('calls onChange when input value changes', async () => {
    await act(async () => {
      render(
        <MathCaptcha
          value=""
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Nhập đáp án');
      act(() => {
        fireEvent.change(input, { target: { value: '8' } });
      });
      expect(mockOnChange).toHaveBeenCalledWith('8');
    });
  });

  it('validates answer with server when value changes', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockCaptchaResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockValidationResponse)
      });

    await act(async () => {
      render(
        <MathCaptcha
          value="8"
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'test-session-id',
          answer: '8',
        }),
      });
    });

    await waitFor(() => {
      expect(mockOnValidation).toHaveBeenCalledWith(true, 'test-session-id');
    });
  });

  it('has a refresh button that generates new problem', async () => {
    await act(async () => {
      render(
        <MathCaptcha
          value=""
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    await waitFor(() => {
      const refreshButton = screen.getByRole('button');
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toHaveAttribute('title', 'Làm mới câu hỏi');
    });

    const refreshButton = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(refreshButton);
    });
    
    // Should call fetch again for new CAPTCHA
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  it('handles fetch errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      render(
        <MathCaptcha
          value=""
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    // Should not crash and should still show loading state
    expect(screen.getByText('Đang tải CAPTCHA...')).toBeInTheDocument();
  });

  it('handles invalid server response gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Server error' })
    });

    await act(async () => {
      render(
        <MathCaptcha
          value=""
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    // Should not crash and should still show loading state
    expect(screen.getByText('Đang tải CAPTCHA...')).toBeInTheDocument();
  });

  it('calls onValidation with false when validation fails', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockCaptchaResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: false, message: 'Sai đáp án' })
      });

    await act(async () => {
      render(
        <MathCaptcha
          value="7"
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    await waitFor(() => {
      expect(mockOnValidation).toHaveBeenCalledWith(false, 'test-session-id');
    });
  });

  it('displays error message when provided', async () => {
    await act(async () => {
      render(
        <MathCaptcha
          value=""
          onChange={mockOnChange}
          onValidation={mockOnValidation}
          error="CAPTCHA không hợp lệ"
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText('CAPTCHA không hợp lệ')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', async () => {
    await act(async () => {
      render(
        <MathCaptcha
          value=""
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Nhập đáp án');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('placeholder', 'Nhập đáp án');
      
      const refreshButton = screen.getByRole('button');
      expect(refreshButton).toHaveAttribute('title', 'Làm mới câu hỏi');
      expect(refreshButton).toHaveAttribute('type', 'button');
    });
  });

  it('resets validation when new problem is generated', async () => {
    await act(async () => {
      render(
        <MathCaptcha
          value=""
          onChange={mockOnChange}
          onValidation={mockOnValidation}
        />
      );
    });
    
    await waitFor(() => {
      const refreshButton = screen.getByRole('button');
      act(() => {
        fireEvent.click(refreshButton);
      });
    });
    
    // Should call onChange with empty string and onValidation with false
    expect(mockOnChange).toHaveBeenCalledWith('');
    expect(mockOnValidation).toHaveBeenCalledWith(false);
  });
}); 