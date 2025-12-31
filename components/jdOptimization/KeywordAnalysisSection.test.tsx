import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KeywordAnalysisSection } from './KeywordAnalysisSection';

// Test with actual Lucide React icons

const mockMatchedKeywords = ['sales', 'team', 'performance', 'targets', 'training'];
const mockMissingKeywords = {
  highPriority: ['Lãnh đạo', 'Sales pipeline'],
  mediumPriority: ['excel', 'compliance', 'iso', 'metrics']
};

describe('KeywordAnalysisSection Component', () => {
  describe('Rendering', () => {
    it('renders nothing when no keywords provided', () => {
      const { container } = render(
        <KeywordAnalysisSection 
          matchedKeywords={[]}
          missingKeywords={{ highPriority: [], mediumPriority: [] }}
        />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('renders matched keywords section with proper styling', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={mockMatchedKeywords}
          missingKeywords={{ highPriority: [], mediumPriority: [] }}
        />
      );
      
      expect(screen.getByText('5 keyword quan trọng được tìm thấy')).toBeInTheDocument();
      expect(screen.getByText('CV của bạn đã có các keyword sau:')).toBeInTheDocument();
             // Check for the actual SVG icon
       const svgIcon = document.querySelector('.lucide-circle-check-big');
       expect(svgIcon).toBeInTheDocument();
      
      // Check matched keyword pills
      mockMatchedKeywords.forEach(keyword => {
        expect(screen.getByText(keyword)).toBeInTheDocument();
      });
    });

        it('renders missing keywords section with proper styling', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={[]}
          missingKeywords={mockMissingKeywords}
        />
      );
      
      expect(screen.getByText('2 keyword quan trọng còn thiếu')).toBeInTheDocument();
      expect(screen.getByText('CV của bạn còn thiếu các keyword sau:')).toBeInTheDocument();
              // Check for the actual SVG icon
       const alertIcon = document.querySelector('.lucide-triangle-alert');
       expect(alertIcon).toBeInTheDocument();
      
      // Check only high priority keywords (simplified)
      mockMissingKeywords.highPriority.forEach(keyword => {
        expect(screen.getByText(keyword)).toBeInTheDocument();
      });
      
      // Medium priority keywords should NOT be shown (simplified approach)
      mockMissingKeywords.mediumPriority.forEach(keyword => {
        expect(screen.queryByText(keyword)).not.toBeInTheDocument();
      });
    });

    it('renders both sections when both types of keywords are provided', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={mockMatchedKeywords}
          missingKeywords={mockMissingKeywords}
        />
      );
      
      expect(screen.getByText('5 keyword quan trọng được tìm thấy')).toBeInTheDocument();
      expect(screen.getByText('2 keyword quan trọng còn thiếu')).toBeInTheDocument();
    });
  });

  describe('Language Support', () => {
    it('displays Vietnamese text by default', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={['sales']}
          missingKeywords={{ highPriority: ['leadership'], mediumPriority: [] }}
        />
      );
      
      expect(screen.getByText('1 keyword quan trọng được tìm thấy')).toBeInTheDocument();
      expect(screen.getByText('1 keyword quan trọng còn thiếu')).toBeInTheDocument();
    });

    it('displays English text when language prop is en', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={['sales']}
          missingKeywords={{ highPriority: ['leadership'], mediumPriority: [] }}
          language="en"
        />
      );
      
      expect(screen.getByText('1 important keywords found')).toBeInTheDocument();
      expect(screen.getByText('1 important keywords missing')).toBeInTheDocument();
      expect(screen.getByText('Your CV already has these keywords:')).toBeInTheDocument();
      expect(screen.getByText('Your CV is missing these keywords:')).toBeInTheDocument();
    });
  });

    describe('Interactive Features', () => {
    it('shows only critical missing keywords without toggle buttons', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={[]}
          missingKeywords={mockMissingKeywords}
        />
      );
      
      // High priority keywords should be visible
      expect(screen.getByText('Lãnh đạo')).toBeInTheDocument();
      expect(screen.getByText('Sales pipeline')).toBeInTheDocument();
      
      // Medium priority keywords should NOT be visible (simplified)
      expect(screen.queryByText('excel')).not.toBeInTheDocument();
      expect(screen.queryByText('compliance')).not.toBeInTheDocument();
      
      // No toggle buttons should exist
      expect(screen.queryByText('Ưu tiên')).not.toBeInTheDocument();
      expect(screen.queryByText('Ẩn/Hiện')).not.toBeInTheDocument();
    });

    it('displays matched keywords without toggle controls', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={mockMatchedKeywords}
          missingKeywords={{ highPriority: [], mediumPriority: [] }}
        />
      );
      
      // All matched keywords should be visible
      mockMatchedKeywords.forEach(keyword => {
        expect(screen.getByText(keyword)).toBeInTheDocument();
      });
      
      // No toggle button should exist
      expect(screen.queryByText('Ẩn/Hiện')).not.toBeInTheDocument();
    });

    it('focuses on simplicity with no interactive controls', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={mockMatchedKeywords}
          missingKeywords={mockMissingKeywords}
        />
      );
      
      // Should have no clickable buttons
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Styling and Design', () => {
    it('applies correct styling classes for matched keywords', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={['sales']}
          missingKeywords={{ highPriority: [], mediumPriority: [] }}
        />
      );
      
      const keywordPill = screen.getByText('sales').closest('div');
      expect(keywordPill).toHaveClass(
        'flex', 'flex-row', 'justify-center', 'items-center',
        'px-2', 'py-1', 'gap-1',
        'bg-white', 'border', 'border-green-300', 'rounded-full'
      );
    });

    it('uses two-column layout with proper background colors', () => {
      const { container } = render(
        <KeywordAnalysisSection 
          matchedKeywords={['sales']}
          missingKeywords={{ highPriority: ['leadership'], mediumPriority: [] }}
        />
      );
      
      // Check for flex-row layout
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('flex', 'flex-row', 'gap-4');
      
      // Check that both sections exist in two-column layout
      const sections = container.querySelectorAll('.flex-1');
      expect(sections.length).toBe(2);
    });

    it('applies correct styling classes for high priority missing keywords', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={[]}
          missingKeywords={{ highPriority: ['leadership'], mediumPriority: [] }}
        />
      );
      
      const keywordPill = screen.getByText('leadership').closest('div');
      expect(keywordPill).toHaveClass(
        'flex', 'flex-row', 'justify-center', 'items-center',
        'px-2', 'py-1', 'gap-1',
        'bg-white', 'border', 'border-red-300', 'rounded-full'
      );
    });

    it('does not display medium priority keywords (simplified approach)', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={[]}
          missingKeywords={{ highPriority: [], mediumPriority: ['excel'] }}
        />
      );
      
      // Medium priority keywords should not be displayed
      expect(screen.queryByText('excel')).not.toBeInTheDocument();
    });

    it('includes priority dots only for high-priority missing keywords', () => {
      const { container } = render(
        <KeywordAnalysisSection 
          matchedKeywords={[]}
          missingKeywords={mockMissingKeywords}
        />
      );
      
      // High priority dots (red) - only these should exist
      const redDots = container.querySelectorAll('.bg-red-600.rounded-full');
      expect(redDots).toHaveLength(mockMissingKeywords.highPriority.length);
      
      // Medium priority dots (orange) - should not exist (simplified)
      const orangeDots = container.querySelectorAll('.bg-orange-600.rounded-full');
      expect(orangeDots).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={mockMatchedKeywords}
          missingKeywords={mockMissingKeywords}
        />
      );
      
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent('2 keyword quan trọng còn thiếu');
      expect(headings[1]).toHaveTextContent('5 keyword quan trọng được tìm thấy');
    });

    it('has no interactive buttons (simplified design)', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={mockMatchedKeywords}
          missingKeywords={mockMissingKeywords}
        />
      );
      
      // Should have no buttons at all
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty high priority by hiding the missing section entirely', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={[]}
          missingKeywords={{ highPriority: [], mediumPriority: ['excel', 'powerpoint'] }}
        />
      );
      
      // Should not show missing section when no high priority keywords
      expect(screen.queryByText('Từ khóa quan trọng còn thiếu')).not.toBeInTheDocument();
      expect(screen.queryByText('excel')).not.toBeInTheDocument();
      expect(screen.queryByText('powerpoint')).not.toBeInTheDocument();
    });

    it('handles single keyword scenarios', () => {
      render(
        <KeywordAnalysisSection 
          matchedKeywords={['sales']}
          missingKeywords={{ highPriority: ['leadership'], mediumPriority: [] }}
        />
      );
      
      expect(screen.getByText('CV của bạn đã có các keyword sau:')).toBeInTheDocument();
      expect(screen.getByText('CV của bạn còn thiếu các keyword sau:')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <KeywordAnalysisSection 
          matchedKeywords={['sales']}
          missingKeywords={{ highPriority: [], mediumPriority: [] }}
          className="custom-class"
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
}); 