import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { EditorPanel } from '../EditorPanel';
import { CVWorkflowDataService } from '../../shared/services/cvWorkflowDataService';
import JDOptimizationService from '../../services/jdOptimizationService';

// Mock CVWorkflowDataService
vi.mock('../../shared/services/cvWorkflowDataService', () => ({
  CVWorkflowDataService: {
    getInstance: vi.fn(() => ({
      saveJDAnalysis: vi.fn().mockResolvedValue({ success: true }),
      loadJDAnalysis: vi.fn().mockResolvedValue({ success: false, error: 'No analysis found' })
    }))
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

const defaultProps = {
  cvData: {
    sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
    contact: {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '0123456789',
      location: 'Test City'
    },
    summary: { content: 'Test summary' },
    experience: { items: [] },
    skills: { items: ['React', 'TypeScript'] },
    education: { items: [] }
  },
  onUpdateSection: vi.fn(),
  onSectionOrderChange: vi.fn(),
  activeSection: null as string | null,
  setActiveSection: vi.fn(),
  cvScore: 75,
  suggestions: {},
  onApplySuggestion: vi.fn(),
  onDismissSuggestion: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue(null);
});

describe('EditorPanel Component - JD Analysis Implementation', () => {
  describe('JD Analysis UI Components', () => {
    it('renders JD analysis section header', async () => {
      await act(async () => {
        render(<EditorPanel {...defaultProps} />);
      });
      
      expect(screen.getByText('Phân tích JD & Tối ưu hóa')).toBeInTheDocument();
    });

    it('renders JD input textarea', async () => {
      await act(async () => {
        render(<EditorPanel {...defaultProps} />);
      });
      
      const textarea = screen.getByPlaceholderText(/dán mô tả công việc/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('maxLength', '3000');
    });

    it('renders analyze button', async () => {
      await act(async () => {
        render(<EditorPanel {...defaultProps} />);
      });
      
      const analyzeButtons = screen.getAllByRole('button', { name: /phân tích/i });
      expect(analyzeButtons.length).toBeGreaterThan(0);
      expect(analyzeButtons[0]).toBeInTheDocument();
    });

    it('renders character counter', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<EditorPanel {...defaultProps} />);
      });
      
      const textarea = screen.getByPlaceholderText(/dán mô tả công việc/i);
      
      await act(async () => {
        await user.type(textarea, 'Test job description');
      });
      
      expect(screen.getByText(/19.*3000/)).toBeInTheDocument();
    });
  });

  describe('JD Analysis Functionality', () => {
    it('handles JD input and triggers analysis', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<EditorPanel {...defaultProps} />);
      });
      
      const textarea = screen.getByPlaceholderText(/dán mô tả công việc/i);
      const analyzeButton = screen.getAllByRole('button', { name: /phân tích/i })[0];
      
      await act(async () => {
        await user.type(textarea, 'React developer with TypeScript experience');
        await user.click(analyzeButton);
      });
      
      // Should trigger loading state
      await waitFor(() => {
        expect(screen.getByText(/đang phân tích/i)).toBeInTheDocument();
      });
    });

    it('displays analysis results after successful analysis', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          analysisId: 'test-analysis-1',
          suggestions: { summary: [{
              id: 'sug-1',
              type: 'enhance',
              suggestedText: 'Add React and TypeScript expertise',
              reason: 'Missing key technical skills'
            }]
          },
          missingKeywords: ['React', 'TypeScript']
        })
      });
      
      await act(async () => {
        render(<EditorPanel {...defaultProps} />);
      });
      
      const textarea = screen.getByPlaceholderText(/dán mô tả công việc/i);
      const analyzeButton = screen.getAllByRole('button', { name: /phân tích/i })[0];
      
      await act(async () => {
        await user.type(textarea, 'React developer position');
        await user.click(analyzeButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/gợi ý tối ưu/i)).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock failed API response
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      await act(async () => {
        render(<EditorPanel {...defaultProps} />);
      });
      
      const textarea = screen.getByPlaceholderText(/dán mô tả công việc/i);
      const analyzeButton = screen.getAllByRole('button', { name: /phân tích/i })[0];
      
      await act(async () => {
        await user.type(textarea, 'Test job description');
        await user.click(analyzeButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/không thể phân tích/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence', () => {
    it('saves analysis results to localStorage', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          analysisId: 'test-analysis-1',
          suggestions: { summary: [] },
          missingKeywords: []
        })
      });
      
      await act(async () => {
        render(<EditorPanel {...defaultProps} />);
      });
      
      const textarea = screen.getByPlaceholderText(/dán mô tả công việc/i);
      const analyzeButton = screen.getAllByRole('button', { name: /phân tích/i })[0];
      
      await act(async () => {
        await user.type(textarea, 'Test job description');
        await user.click(analyzeButton);
      });
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for form elements', async () => {
      await act(async () => {
        render(<EditorPanel {...defaultProps} />);
      });
      
      const textarea = screen.getByPlaceholderText(/dán mô tả công việc/i);
      expect(textarea).toHaveAttribute('aria-label');
    });

    it('announces loading state to screen readers', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<EditorPanel {...defaultProps} />);
      });
      
      const textarea = screen.getByPlaceholderText(/dán mô tả công việc/i);
      const analyzeButton = screen.getAllByRole('button', { name: /phân tích/i })[0];
      
      await act(async () => {
        await user.type(textarea, 'Test job description');
        await user.click(analyzeButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/đang phân tích/i)).toHaveAttribute('aria-live');
      });
    });
  });
}); 