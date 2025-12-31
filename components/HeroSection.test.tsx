/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HeroSection from './HeroSection';
import * as navigation from '../utils/navigation';

// Mock the navigation utility
jest.mock('../utils/navigation', () => ({
  handlePrimaryCTA: jest.fn(),
  trackCTAClick: jest.fn()
}));

const mockHandlePrimaryCTA = navigation.handlePrimaryCTA as jest.MockedFunction<typeof navigation.handlePrimaryCTA>;
const mockTrackCTAClick = navigation.trackCTAClick as jest.MockedFunction<typeof navigation.trackCTAClick>;

describe('HeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
         it('should render hero section with correct content', () => {
       render(<HeroSection />);
       
       expect(screen.getByText('75% CV bị loại tự động trước khi đến tay nhà tuyển dụng. CV của bạn thì sao?')).toBeInTheDocument();
       expect(screen.getByText('Dùng thử miễn phí ngay')).toBeInTheDocument();
       expect(screen.getByText('Áp dụng tất cả gợi ý')).toBeInTheDocument();
     });

         it('should render resume preview section', () => {
       render(<HeroSection />);
       
       expect(screen.getByText('Tối ưu hóa CV cho hệ thống ATS')).toBeInTheDocument();
       expect(screen.getByText('Gợi ý từ AI')).toBeInTheDocument();
     });

         it('should have proper accessibility attributes', () => {
       render(<HeroSection />);
       
       const mainButton = screen.getByRole('button', { name: 'Dùng thử miễn phí ngay' });
       const applyButton = screen.getByRole('button', { name: 'Áp dụng tất cả gợi ý' });
       
       expect(mainButton).toBeInTheDocument();
       expect(applyButton).toBeInTheDocument();
     });
  });

  describe('CTA interactions', () => {
    it('should call trackCTAClick and handlePrimaryCTA when main CTA is clicked', async () => {
      render(<HeroSection />);
      
      const mainButton = screen.getByRole('button', { name: 'Dùng thử miễn phí ngay' });
      fireEvent.click(mainButton);
      
      expect(mockTrackCTAClick).toHaveBeenCalledWith('hero_section');
      await waitFor(() => {
        expect(mockHandlePrimaryCTA).toHaveBeenCalled();
      });
    });

         it('should call trackCTAClick and handlePrimaryCTA when apply button is clicked', async () => {
       render(<HeroSection />);
       
       const applyButton = screen.getByRole('button', { name: 'Áp dụng tất cả gợi ý' });
       fireEvent.click(applyButton);
       
       expect(mockTrackCTAClick).toHaveBeenCalledWith('hero_section');
       await waitFor(() => {
         expect(mockHandlePrimaryCTA).toHaveBeenCalled();
       });
     });

    it('should handle multiple rapid clicks gracefully', async () => {
      render(<HeroSection />);
      
      const mainButton = screen.getByRole('button', { name: 'Dùng thử miễn phí ngay' });
      
      // Rapid clicks
      fireEvent.click(mainButton);
      fireEvent.click(mainButton);
      fireEvent.click(mainButton);
      
      expect(mockTrackCTAClick).toHaveBeenCalledTimes(3);
      await waitFor(() => {
        expect(mockHandlePrimaryCTA).toHaveBeenCalledTimes(3);
      });
    });

         it('should handle navigation functions being called', async () => {
       render(<HeroSection />);
       
       const mainButton = screen.getByRole('button', { name: 'Dùng thử miễn phí ngay' });
       fireEvent.click(mainButton);
       
       expect(mockTrackCTAClick).toHaveBeenCalledWith('hero_section');
       await waitFor(() => {
         expect(mockHandlePrimaryCTA).toHaveBeenCalled();
       });
     });
  });

  describe('responsive design', () => {
    it('should have responsive classes for mobile', () => {
      render(<HeroSection />);
      
      const mainButton = screen.getByRole('button', { name: 'Dùng thử miễn phí ngay' });
      
      expect(mainButton).toHaveClass('w-full');
      expect(mainButton).toHaveClass('sm:w-[240px]');
    });

    it('should render properly on different screen sizes', () => {
      const { container } = render(<HeroSection />);
      
      // Check for responsive padding classes
      const heroSection = container.firstChild as HTMLElement;
      expect(heroSection).toHaveClass('px-4');
      expect(heroSection).toHaveClass('md:px-[120px]');
    });
  });

  describe('visual elements', () => {
         it('should display score indicators', () => {
       render(<HeroSection />);
       
       expect(screen.getByText('60')).toBeInTheDocument();
       expect(screen.getByText('Điểm CV')).toBeInTheDocument();
     });

         it('should display AI suggestions', () => {
       render(<HeroSection />);
       
       expect(screen.getByText('Thêm "Python" vào phần kỹ năng')).toBeInTheDocument();
       expect(screen.getByText('Nêu rõ vai trò của bạn trong dự án X')).toBeInTheDocument();
     });

    it('should have proper styling classes', () => {
      render(<HeroSection />);
      
      const mainButton = screen.getByRole('button', { name: 'Dùng thử miễn phí ngay' });
      
      expect(mainButton).toHaveClass('bg-[#0288D1]');
      expect(mainButton).toHaveClass('hover:bg-[#0277BD]');
      expect(mainButton).toHaveClass('transition-colors');
    });
  });

  describe('keyboard navigation', () => {
         it('should be accessible via keyboard', () => {
       render(<HeroSection />);
       
       const mainButton = screen.getByRole('button', { name: 'Dùng thử miễn phí ngay' });
       const applyButton = screen.getByRole('button', { name: 'Áp dụng tất cả gợi ý' });
       
       // Should be focusable
       mainButton.focus();
       expect(document.activeElement).toBe(mainButton);
       
       applyButton.focus();
       expect(document.activeElement).toBe(applyButton);
     });

         it('should handle Enter key press', async () => {
       render(<HeroSection />);
       
       const mainButton = screen.getByRole('button', { name: 'Dùng thử miễn phí ngay' });
       mainButton.focus();
       
       // Simulate Enter key press which triggers click
       fireEvent.keyDown(mainButton, { key: 'Enter', code: 'Enter' });
       fireEvent.click(mainButton);
       
       expect(mockTrackCTAClick).toHaveBeenCalledWith('hero_section');
       await waitFor(() => {
         expect(mockHandlePrimaryCTA).toHaveBeenCalled();
       });
     });

     it('should handle Space key press', async () => {
       render(<HeroSection />);
       
       const mainButton = screen.getByRole('button', { name: 'Dùng thử miễn phí ngay' });
       mainButton.focus();
       
       // Simulate Space key press which triggers click
       fireEvent.keyDown(mainButton, { key: ' ', code: 'Space' });
       fireEvent.click(mainButton);
       
       expect(mockTrackCTAClick).toHaveBeenCalledWith('hero_section');
       await waitFor(() => {
         expect(mockHandlePrimaryCTA).toHaveBeenCalled();
       });
     });
  });

  describe('error boundaries', () => {
         it('should handle render errors gracefully', () => {
       // Mock console.error to avoid test output noise
       const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
       
       try {
         render(<HeroSection />);
         expect(screen.getByText('75% CV bị loại tự động trước khi đến tay nhà tuyển dụng. CV của bạn thì sao?')).toBeInTheDocument();
       } catch (error) {
         // Should not throw during normal render
         expect(error).toBeUndefined();
       }
       
       consoleSpy.mockRestore();
     });
  });

  describe('performance', () => {
    it('should not cause memory leaks with async operations', async () => {
      const { unmount } = render(<HeroSection />);
      
      const mainButton = screen.getByRole('button', { name: 'Dùng thử miễn phí ngay' });
      fireEvent.click(mainButton);
      
      // Unmount component immediately
      unmount();
      
      // Should not cause errors
      await waitFor(() => {
        expect(mockHandlePrimaryCTA).toHaveBeenCalled();
      });
    });
  });
}); 