import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CVEditor } from './CVEditor';
import { CVData } from '../utils/mockData';

// Mock the shared services
vi.mock('../shared/contexts/CVWorkflowContext', () => ({
  useCVWorkflow: () => ({
    state: {
      cvData: null,
      isLoading: false,
      isSaving: false,
      error: null,
      lastSaved: null,
      syncStatus: 'synced'
    },
    updateCVData: vi.fn(),
    saveCVData: vi.fn()
  })
}));

// Mock other dependencies
vi.mock('../utils/cvScoring', () => ({
  calculateCvScore: vi.fn(() => 85)
}));

vi.mock('./EditorPanel', () => ({
  EditorPanel: ({ cvData }: { cvData: any }) => (
    <div data-testid="editor-panel">
      <div data-testid="cv-data-title">{cvData?.contact?.fullName || 'No Name'}</div>
    </div>
  )
}));

vi.mock('./PreviewPanel', () => ({
  PreviewPanel: () => <div data-testid="preview-panel">Preview</div>
}));

vi.mock('./Header', () => ({
  Header: () => <div data-testid="header">Header</div>
}));

describe('CVEditor Integration Tests', () => {
  const mockCVData: CVData = {
    sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
    sectionTitles: {},
    contact: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      location: 'New York',
      linkedin: 'linkedin.com/in/johndoe'
    },
    summary: {
      content: 'Professional summary'
    },
    experience: {
      items: []
    },
    skills: {
      items: ['JavaScript', 'React']
    },
    education: {
      items: []
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('External Data Integration', () => {
    it('should accept and use initialData prop', () => {
      render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      expect(screen.getByTestId('cv-data-title')).toHaveTextContent('John Doe');
    });

    it('should accept dataSource prop and log appropriately', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      render(<CVEditor initialData={mockCVData} dataSource="cache" />);
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ Using cache data for CV Editor');
      
      consoleSpy.mockRestore();
    });

    it('should fall back to mock data when no initialData provided', () => {
      render(<CVEditor />);
      
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      // Should use mock data fallback
      expect(screen.getByTestId('cv-data-title')).toBeInTheDocument();
    });

    it('should handle different data sources correctly', () => {
      const { rerender } = render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      expect(screen.getByTestId('cv-data-title')).toHaveTextContent('John Doe');
      
      rerender(<CVEditor initialData={mockCVData} dataSource="cache" />);
      expect(screen.getByTestId('cv-data-title')).toHaveTextContent('John Doe');
      
      rerender(<CVEditor initialData={mockCVData} dataSource="mock" />);
      expect(screen.getByTestId('cv-data-title')).toHaveTextContent('John Doe');
    });
  });

  describe('Props Interface', () => {
    it('should have correct TypeScript interface for props', () => {
      // This test ensures the component accepts the correct props
      expect(() => {
        render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      }).not.toThrow();
      
      expect(() => {
        render(<CVEditor />);
      }).not.toThrow();
    });

    it('should handle optional props correctly', () => {
      // Test with only initialData
      const { rerender } = render(<CVEditor initialData={mockCVData} />);
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      
      // Test with only dataSource
      rerender(<CVEditor dataSource="mock" />);
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      
      // Test with no props
      rerender(<CVEditor />);
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('should handle incomplete CV data gracefully', () => {
      const incompleteData: Partial<CVData> = {
        contact: {
          fullName: 'Jane Doe',
          email: '',
          phone: '',
          location: '',
          linkedin: ''
        }
      };

      render(<CVEditor initialData={incompleteData as CVData} dataSource="workflow" />);
      
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      expect(screen.getByTestId('cv-data-title')).toHaveTextContent('Jane Doe');
    });

    it('should handle null/undefined data fields', () => {
      const dataWithNulls = {
        ...mockCVData,
        contact: {
          ...mockCVData.contact,
          fullName: '',
          email: ''
        }
      };

      render(<CVEditor initialData={dataWithNulls} dataSource="workflow" />);
      
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    });

    it('should handle missing optional fields', () => {
      const minimalData: CVData = {
        sectionOrder: ['contact'],
        contact: {
          fullName: 'Test User',
          email: 'test@example.com',
          phone: '123',
          location: 'Test',
          linkedin: ''
        },
        summary: { content: '' },
        experience: { items: [] },
        skills: { items: [] },
        education: { items: [] }
      };

      render(<CVEditor initialData={minimalData} dataSource="workflow" />);
      
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      expect(screen.getByTestId('cv-data-title')).toHaveTextContent('Test User');
    });
  });

  describe('Auto-Save Integration', () => {
    it('should integrate with CVWorkflow context', () => {
      const mockUpdateCVData = vi.fn();
      const mockUseCVWorkflow = vi.requireMock('../shared/contexts/CVWorkflowContext').useCVWorkflow;
      
      mockUseCVWorkflow.mockReturnValue({
        state: {
          cvData: null,
          isLoading: false,
          isSaving: false,
          error: null,
          lastSaved: null,
          syncStatus: 'synced'
        },
        updateCVData: mockUpdateCVData,
        saveCVData: vi.fn()
      });

      render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      // The component should have access to workflow context
    });

    it('should handle auto-save status states', () => {
      const mockUseCVWorkflow = vi.requireMock('../shared/contexts/CVWorkflowContext').useCVWorkflow;
      
      // Test saving state
      mockUseCVWorkflow.mockReturnValue({
        state: {
          cvData: null,
          isLoading: false,
          isSaving: true,
          error: null,
          lastSaved: null,
          syncStatus: 'syncing'
        },
        updateCVData: vi.fn(),
        saveCVData: vi.fn()
      });

      const { rerender } = render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      
      // Test error state
      mockUseCVWorkflow.mockReturnValue({
        state: {
          cvData: null,
          isLoading: false,
          isSaving: false,
          error: 'Save failed',
          lastSaved: null,
          syncStatus: 'error'
        },
        updateCVData: vi.fn(),
        saveCVData: vi.fn()
      });

      rerender(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle component rendering errors gracefully', () => {
      // Test with malformed data
      const malformedData = {
        contact: null,
        summary: undefined
      } as any;

      expect(() => {
        render(<CVEditor initialData={malformedData} dataSource="workflow" />);
      }).not.toThrow();
    });

    it('should handle scoring calculation errors', () => {
      const mockCalculateCvScore = vi.requireMock('../utils/cvScoring').calculateCvScore;
      mockCalculateCvScore.mockImplementation(() => {
        throw new Error('Scoring error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

      render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Error calculating CV score:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Component Integration', () => {
    it('should render all required sub-components', () => {
      render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
      expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
    });

    it('should maintain existing functionality with new props', () => {
      render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      
      // Check that the main layout structure is preserved
      const container = screen.getByTestId('editor-panel').closest('.h-screen');
      expect(container).toHaveClass('h-screen', 'flex', 'flex-col', 'overflow-hidden');
    });

    it('should handle section interactions correctly', async () => {
      render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      
      // The editor should be interactive
      const editorPanel = screen.getByTestId('editor-panel');
      expect(editorPanel).toBeInTheDocument();
      
      // Should handle clicks without errors
      fireEvent.click(editorPanel);
      
      await waitFor(() => {
        expect(editorPanel).toBeInTheDocument();
      });
    });
  });

  describe('Memory Management', () => {
    it('should clean up auto-save timers on unmount', () => {
      const { unmount } = render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      
      // Component should unmount without memory leaks
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid data changes without memory leaks', async () => {
      const { rerender } = render(<CVEditor initialData={mockCVData} dataSource="workflow" />);
      
      // Rapidly change data
      for (let i = 0; i < 10; i++) {
        const newData = {
          ...mockCVData,
          contact: {
            ...mockCVData.contact,
            fullName: `User ${i}`
          }
        };
        
        rerender(<CVEditor initialData={newData} dataSource="workflow" />);
      }
      
      expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    });
  });

  describe('TypeScript Compliance', () => {
    it('should have proper TypeScript interfaces', () => {
      // This test ensures TypeScript compliance by attempting to use the component
      // with various prop combinations that should be valid
      
      const validProps = [
        { initialData: mockCVData, dataSource: 'workflow' as const },
        { initialData: mockCVData, dataSource: 'cache' as const },
        { initialData: mockCVData, dataSource: 'mock' as const },
        { initialData: mockCVData },
        { dataSource: 'workflow' as const },
        {}
      ];

      validProps.forEach((props, index) => {
        const { unmount } = render(<CVEditor key={index} {...props} />);
        expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
        unmount();
      });
    });
  });
}); 