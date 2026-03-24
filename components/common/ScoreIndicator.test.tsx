import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScoreIndicator } from './ScoreIndicator';

describe('ScoreIndicator', () => {
  describe('Component Rendering', () => {
    it('should render with valid score', () => {
      render(<ScoreIndicator score={75} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should render progress bar container', () => {
      const { container } = render(<ScoreIndicator score={50} />);
      
      const progressContainer = container.querySelector('.w-48.h-2.bg-gray-100.rounded-full');
      expect(progressContainer).toBeInTheDocument();
    });

    it('should render progress bar fill', () => {
      const { container } = render(<ScoreIndicator score={60} />);
      
      const progressFill = container.querySelector('[style*="width: 60%"]');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('Score Color Logic', () => {
    it('should display red color for low scores (< 40)', () => {
      const { container } = render(<ScoreIndicator score={25} />);
      
      const progressFill = container.querySelector('[style*="background-color: rgb(239, 68, 68)"]');
      expect(progressFill).toBeInTheDocument();
      
      const scoreText = screen.getByText('25%');
      expect(scoreText).toHaveClass('text-red-500');
    });

    it('should display orange color for medium scores (40-69)', () => {
      const { container } = render(<ScoreIndicator score={55} />);
      
      const progressFill = container.querySelector('[style*="background-color: rgb(245, 158, 11)"]');
      expect(progressFill).toBeInTheDocument();
      
      const scoreText = screen.getByText('55%');
      expect(scoreText).toHaveClass('text-orange-500');
    });

    it('should display green color for high scores (>= 70)', () => {
      const { container } = render(<ScoreIndicator score={85} />);
      
      const progressFill = container.querySelector('[style*="background-color: rgb(34, 197, 94)"]');
      expect(progressFill).toBeInTheDocument();
      
      const scoreText = screen.getByText('85%');
      expect(scoreText).toHaveClass('text-green-500');
    });
  });

  describe('Edge Cases', () => {
    it('should handle score of 0', () => {
      const { container } = render(<ScoreIndicator score={0} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      const progressFill = container.querySelector('[style*="width: 0%"]');
      expect(progressFill).toBeInTheDocument();
      
      const scoreText = screen.getByText('0%');
      expect(scoreText).toHaveClass('text-red-500');
    });

    it('should handle score of 100', () => {
      const { container } = render(<ScoreIndicator score={100} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
      const progressFill = container.querySelector('[style*="width: 100%"]');
      expect(progressFill).toBeInTheDocument();
      
      const scoreText = screen.getByText('100%');
      expect(scoreText).toHaveClass('text-green-500');
    });

    it('should handle negative scores (should still render)', () => {
      const { container } = render(<ScoreIndicator score={-10} />);
      
      expect(screen.getByText('-10%')).toBeInTheDocument();
      // Negative width might be clamped by CSS, so just check the style exists
      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toBeInTheDocument();
    });

    it('should handle scores over 100 (should still render)', () => {
      const { container } = render(<ScoreIndicator score={150} />);
      
      expect(screen.getByText('150%')).toBeInTheDocument();
      const progressFill = container.querySelector('[style*="width: 150%"]');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('Boundary Values', () => {
    it('should correctly classify score at boundary 40', () => {
      const { container } = render(<ScoreIndicator score={40} />);
      
      const scoreText = screen.getByText('40%');
      expect(scoreText).toHaveClass('text-orange-500');
      
      const progressFill = container.querySelector('[style*="background-color: rgb(245, 158, 11)"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('should correctly classify score at boundary 70', () => {
      const { container } = render(<ScoreIndicator score={70} />);
      
      const scoreText = screen.getByText('70%');
      expect(scoreText).toHaveClass('text-green-500');
      
      const progressFill = container.querySelector('[style*="background-color: rgb(34, 197, 94)"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('should correctly classify score just below boundary 40', () => {
      const { container } = render(<ScoreIndicator score={39} />);
      
      const scoreText = screen.getByText('39%');
      expect(scoreText).toHaveClass('text-red-500');
      
      const progressFill = container.querySelector('[style*="background-color: rgb(239, 68, 68)"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('should correctly classify score just below boundary 70', () => {
      const { container } = render(<ScoreIndicator score={69} />);
      
      const scoreText = screen.getByText('69%');
      expect(scoreText).toHaveClass('text-orange-500');
      
      const progressFill = container.querySelector('[style*="background-color: rgb(245, 158, 11)"]');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should have correct container classes', () => {
      const { container } = render(<ScoreIndicator score={50} />);
      
      const containerDiv = container.firstChild as HTMLElement;
      expect(containerDiv).toHaveClass('flex', 'items-center', 'gap-3');
    });

    it('should have correct progress bar classes', () => {
      const { container } = render(<ScoreIndicator score={50} />);
      
      const progressContainer = container.querySelector('.w-48.h-2.bg-gray-100.rounded-full.overflow-hidden');
      expect(progressContainer).toBeInTheDocument();
    });

    it('should have correct progress fill classes', () => {
      const { container } = render(<ScoreIndicator score={50} />);
      
      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toBeInTheDocument();
      expect(progressFill).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });

    it('should have correct text classes', () => {
      render(<ScoreIndicator score={50} />);
      
      const scoreText = screen.getByText('50%');
      expect(scoreText).toHaveClass('text-base', 'font-bold', 'text-orange-500');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with screen readers', () => {
      render(<ScoreIndicator score={75} />);
      
      // Progress bar should be perceivable
      const scoreText = screen.getByText('75%');
      expect(scoreText).toBeInTheDocument();
    });

    it('should have meaningful content for all score ranges', () => {
      // Low score
      render(<ScoreIndicator score={20} />);
      expect(screen.getByText('20%')).toBeInTheDocument();
      
      // Medium score  
      render(<ScoreIndicator score={50} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
      
      // High score
      render(<ScoreIndicator score={90} />);
      expect(screen.getByText('90%')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should accept number type for score prop', () => {
      // These should compile without TypeScript errors
      expect(() => render(<ScoreIndicator score={75} />)).not.toThrow();
      expect(() => render(<ScoreIndicator score={0} />)).not.toThrow();
      expect(() => render(<ScoreIndicator score={100} />)).not.toThrow();
    });
  });
}); 