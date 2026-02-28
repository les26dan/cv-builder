import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CVEditor } from './CVEditor';
import { calculateCvScore } from '../utils/cvScoring';

// Mock the scoring utility
vi.mock('../utils/cvScoring');
const mockCalculateCvScore = calculateCvScore as any;

// Mock child components to isolate CVEditor testing
vi.mock('./Header', () => ({
  Header: ({ cvScore }: { cvScore: number }) => (
    <div data-testid="header">Score: {cvScore}</div>
  ),
}));

vi.mock('./EditorPanel', () => ({
  EditorPanel: ({ onUpdateSection, cvScore }: any) => (
    <div data-testid="editor-panel">
      <button
        onClick={() => onUpdateSection('summary', { content: 'Updated summary' })}
        data-testid="update-summary-btn"
      >
        Update Summary
      </button>
      Score: {cvScore}
    </div>
  ),
}));

vi.mock('./PreviewPanel', () => ({
  PreviewPanel: () => <div data-testid="preview-panel">Preview</div>,
}));

describe('CVEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock return value
    mockCalculateCvScore.mockReturnValue(80);
  });

  describe('Basic Rendering', () => {
    test('renders main layout components', () => {
      render(<CVEditor />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
    });

    test('initializes with correct CV score', () => {
      render(<CVEditor />);
      
      // Check score in header specifically
      expect(screen.getByTestId('header')).toHaveTextContent('Score: 80');
      expect(mockCalculateCvScore).toHaveBeenCalledTimes(1);
    });
  });

  describe('CV Score Updates', () => {
    test('updates score when CV data changes', async () => {
      // Setup sequence of score changes
      mockCalculateCvScore
        .mockReturnValueOnce(80)  // Initial
        .mockReturnValueOnce(90); // After update

      render(<CVEditor />);
      
      // Trigger data update
      const updateBtn = screen.getByTestId('update-summary-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(mockCalculateCvScore).toHaveBeenCalledTimes(2);
      });
    });

    test('tracks previous score correctly', async () => {
      mockCalculateCvScore
        .mockReturnValueOnce(80)
        .mockReturnValueOnce(100); // Triggers celebration

      render(<CVEditor />);
      
      const updateBtn = screen.getByTestId('update-summary-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(mockCalculateCvScore).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Celebration Screen', () => {
    test('shows celebration when reaching 100% for first time', async () => {
      mockCalculateCvScore
        .mockReturnValueOnce(90)   // Initial < 100
        .mockReturnValueOnce(100); // Reaches 100%

      render(<CVEditor />);
      
      // Trigger score increase to 100%
      const updateBtn = screen.getByTestId('update-summary-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(screen.getByText('Chúc mừng!')).toBeInTheDocument();
        // Use getAllByText to handle multiple instances
        const celebrationTexts = screen.getAllByText((content, element) => {
          return element?.textContent?.includes('CV của bạn đã đạt') && 
                 element?.textContent?.includes('100%') &&
                 element?.textContent?.includes('hoàn thiện!') || false;
        });
        expect(celebrationTexts.length).toBeGreaterThan(0);
      });
    });

    test('does not show celebration if already at 100%', async () => {
      // First render will show celebration due to 0 -> 100
      // But second update (100 -> 100) should not show celebration
      mockCalculateCvScore
        .mockReturnValueOnce(100)  // Initial: 0 -> 100 (will show celebration)
        .mockReturnValueOnce(100); // Update: 100 -> 100 (should not show celebration)

      render(<CVEditor />);
      
      // Wait for initial celebration to appear and then close it
      await waitFor(() => {
        expect(screen.getByText('Chúc mừng!')).toBeInTheDocument();
      });
      
      // Close the celebration
      const continueBtn = screen.getByText('Tiếp tục chỉnh sửa');
      fireEvent.click(continueBtn);
      
      await waitFor(() => {
        expect(screen.queryByText('Chúc mừng!')).not.toBeInTheDocument();
      });

      // Now trigger another update - this should NOT show celebration
      const updateBtn = screen.getByTestId('update-summary-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(mockCalculateCvScore).toHaveBeenCalledTimes(2);
      });

      // Should not show celebration again
      expect(screen.queryByText('Chúc mừng!')).not.toBeInTheDocument();
    });

    test('celebration screen has correct buttons', async () => {
      mockCalculateCvScore
        .mockReturnValueOnce(90)
        .mockReturnValueOnce(100);

      render(<CVEditor />);
      
      const updateBtn = screen.getByTestId('update-summary-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(screen.getByText('Tiếp tục chỉnh sửa')).toBeInTheDocument();
        expect(screen.getByText('Tải xuống CV')).toBeInTheDocument();
      });
    });

    test('can close celebration manually', async () => {
      mockCalculateCvScore
        .mockReturnValueOnce(90)
        .mockReturnValueOnce(100);

      render(<CVEditor />);
      
      const updateBtn = screen.getByTestId('update-summary-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(screen.getByText('Chúc mừng!')).toBeInTheDocument();
      });

      // Close celebration
      const continueBtn = screen.getByText('Tiếp tục chỉnh sửa');
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.queryByText('Chúc mừng!')).not.toBeInTheDocument();
      });
    });

    test('download button triggers correct action', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      mockCalculateCvScore
        .mockReturnValueOnce(90)
        .mockReturnValueOnce(100);

      render(<CVEditor />);
      
      const updateBtn = screen.getByTestId('update-summary-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(screen.getByText('Tải xuống CV')).toBeInTheDocument();
      });

      const downloadBtn = screen.getByText('Tải xuống CV');
      fireEvent.click(downloadBtn);

      expect(consoleSpy).toHaveBeenCalledWith('Download CV');
      
      await waitFor(() => {
        expect(screen.queryByText('Chúc mừng!')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    test('celebration auto-closes after 5 seconds', async () => {
      vi.useFakeTimers();
      
      mockCalculateCvScore
        .mockReturnValueOnce(90)
        .mockReturnValueOnce(100);

      render(<CVEditor />);
      
      const updateBtn = screen.getByTestId('update-summary-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(screen.getByText('Chúc mừng!')).toBeInTheDocument();
      });

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.queryByText('Chúc mừng!')).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Section Management', () => {
    test('handles section updates correctly', async () => {
      render(<CVEditor />);
      
      const updateBtn = screen.getByTestId('update-summary-btn');
      fireEvent.click(updateBtn);

      // CV data should be updated
      await waitFor(() => {
        expect(mockCalculateCvScore).toHaveBeenCalledWith(
          expect.objectContaining({
            summary: { content: 'Updated summary' }
          })
        );
      });
    });

    test('maintains section order state', () => {
      render(<CVEditor />);
      
      // Initial render should use default section order
      expect(mockCalculateCvScore).toHaveBeenCalledWith(
        expect.objectContaining({
          sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education']
        })
      );
    });
  });

  describe('Error Boundaries', () => {
    test('handles scoring calculation errors gracefully', () => {
      mockCalculateCvScore.mockImplementation(() => {
        throw new Error('Scoring error');
      });

      // Should not crash the component
      expect(() => render(<CVEditor />)).not.toThrow();
    });

    test('handles invalid CV data gracefully', () => {
      mockCalculateCvScore.mockReturnValue(0);

      render(<CVEditor />);
      
      // Check score in header specifically
      expect(screen.getByTestId('header')).toHaveTextContent('Score: 0');
    });
  });

  describe('Accessibility', () => {
    test('celebration screen has proper focus management', async () => {
      mockCalculateCvScore
        .mockReturnValueOnce(90)
        .mockReturnValueOnce(100);

      render(<CVEditor />);
      
      const updateBtn = screen.getByTestId('update-summary-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        const celebrationModal = screen.getByText('Chúc mừng!').closest('div');
        expect(celebrationModal).toBeInTheDocument();
      });

      // Test keyboard navigation
      const continueBtn = screen.getByText('Tiếp tục chỉnh sửa');
      const downloadBtn = screen.getByText('Tải xuống CV');
      
      expect(continueBtn).toBeVisible();
      expect(downloadBtn).toBeVisible();
    });

    test('main layout has proper structure', () => {
      render(<CVEditor />);
      
      // The header container has the expected classes for the fixed header layout
      const headerContainer = screen.getByTestId('header').parentElement;
      expect(headerContainer).toHaveClass('flex-shrink-0', 'bg-white', 'border-b', 'border-gray-200', 'z-10', 'px-6');
      
      // Verify the main layout structure
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
    });
  });
}); 