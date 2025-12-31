/**
 * JD Optimization Panel Error Handling Tests
 * Following OkBuddy development tenets - critical error handling validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { JDOptimizationPanel } from './JDOptimizationPanel';

describe('JDOptimizationPanel - Error Handling', () => {
  const mockCVData = {
    contact: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    workExperience: [
      {
        title: 'Software Developer',
        company: 'Tech Corp'
      }
    ]
  };

  it('handles network errors gracefully during JD submission', async () => {
    const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
    
    render(
      <JDOptimizationPanel 
        cvData={mockCVData}
        language="en"
        onJDSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Optimize CV for Job'));
    
    const textarea = screen.getByPlaceholderText(/Paste job description/);
    const validJD = 'Looking for a software developer with React and TypeScript experience.';
    
    fireEvent.change(textarea, { target: { value: validJD } });
    fireEvent.click(screen.getByText('Analyze & Generate Suggestions'));
    
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('shows fallback message when API fails', async () => {
    const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Unable to analyze JD. Please try again.'));
    
    render(
      <JDOptimizationPanel 
        cvData={mockCVData}
        language="en"
        onJDSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Optimize CV for Job'));
    
    const textarea = screen.getByPlaceholderText(/Paste job description/);
    fireEvent.change(textarea, { target: { value: 'Valid job description content' } });
    fireEvent.click(screen.getByText('Analyze & Generate Suggestions'));
    
    await waitFor(() => {
      expect(screen.getByText(/Unable to analyze JD/)).toBeInTheDocument();
    });
  });

  it('prevents multiple submissions during processing', async () => {
    const mockOnSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <JDOptimizationPanel 
        cvData={mockCVData}
        language="en"
        onJDSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Optimize CV for Job'));
    
    const textarea = screen.getByPlaceholderText(/Paste job description/);
    fireEvent.change(textarea, { target: { value: 'Valid job description content' } });
    
    const submitButton = screen.getByText('Analyze & Generate Suggestions');
    fireEvent.click(submitButton);
    
    // Button should be disabled during processing
    expect(submitButton).toBeDisabled();
    
    // Try to click again - should not call submit twice
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('sanitizes malicious input to prevent XSS', () => {
    render(
      <JDOptimizationPanel 
        cvData={mockCVData}
        language="en"
      />
    );

    fireEvent.click(screen.getByText('Optimize CV for Job'));
    
    const textarea = screen.getByPlaceholderText(/Paste job description/) as HTMLTextAreaElement;
    const maliciousInput = 'Job description <script>alert("xss")</script> <img src="x" onerror="alert(1)"> with requirements';
    
    fireEvent.change(textarea, { target: { value: maliciousInput } });
    
    // Should remove script tags but keep regular content
    expect(textarea.value).toBe('Job description  <img src="x" onerror="alert(1)"> with requirements');
    expect(textarea.value).not.toContain('<script>');
  });

  it('handles incomplete CV data gracefully', () => {
    const incompleteCVData = {
      contact: null,
      workExperience: undefined
    };

    render(
      <JDOptimizationPanel 
        cvData={incompleteCVData}
        language="en"
      />
    );

    // Should show prerequisite message without crashing
    expect(screen.getByText(/Complete your CV to unlock/)).toBeInTheDocument();
    expect(screen.getByText(/Please complete/)).toBeInTheDocument();
  });

  it('handles null CV data without crashing', () => {
    render(
      <JDOptimizationPanel 
        cvData={null}
        language="en"
      />
    );

    // Should show prerequisite message for null data
    expect(screen.getByText(/Complete your CV to unlock/)).toBeInTheDocument();
  });

  it('provides retry functionality after errors', async () => {
    const mockOnSubmit = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);
    
    render(
      <JDOptimizationPanel 
        cvData={mockCVData}
        language="en"
        onJDSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Optimize CV for Job'));
    
    const textarea = screen.getByPlaceholderText(/Paste job description/);
    fireEvent.change(textarea, { target: { value: 'Valid job description content' } });
    
    // First attempt fails
    fireEvent.click(screen.getByText('Analyze & Generate Suggestions'));
    
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
    
    // Clear error by changing input
    fireEvent.change(textarea, { target: { value: 'Valid job description content updated' } });
    
    // Retry should work
    fireEvent.click(screen.getByText('Analyze & Generate Suggestions'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(2);
    });
  });

  it('maintains user input during error states', async () => {
    const mockOnSubmit = vi.fn().mockRejectedValue(new Error('API error'));
    
    render(
      <JDOptimizationPanel 
        cvData={mockCVData}
        language="en"
        onJDSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Optimize CV for Job'));
    
    const textarea = screen.getByPlaceholderText(/Paste job description/) as HTMLTextAreaElement;
    const userInput = 'User typed this job description';
    
    fireEvent.change(textarea, { target: { value: userInput } });
    fireEvent.click(screen.getByText('Analyze & Generate Suggestions'));
    
    await waitFor(() => {
      expect(screen.getByText(/API error/)).toBeInTheDocument();
    });
    
    // User input should still be there
    expect(textarea.value).toBe(userInput);
  });
}); 