import { useState, useEffect } from 'react';

export interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewportWidth: number;
  shouldBlockEditor: boolean;
}

/**
 * Custom hook for mobile device detection and editor blocking logic
 * Based on viewport width breakpoints as specified in Product Spec:
 * - Mobile: < 768px (blocked)
 * - Tablet: 768px - 1023px (blocked)
 * - Large Tablet/Desktop: >= 1024px (allowed)
 */
export function useMobileDetection(): MobileDetectionResult {
  const [detection, setDetection] = useState<MobileDetectionResult>(() => {
    // Initial state - use window dimensions if available
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      viewportWidth: width,
      shouldBlockEditor: width < 1024 // Block mobile and small tablets
    };
  });

  useEffect(() => {
    const updateDetection = () => {
      const width = window.innerWidth;
      const newDetection: MobileDetectionResult = {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        viewportWidth: width,
        shouldBlockEditor: width < 1024 // Block mobile and small tablets
      };
      
      setDetection(newDetection);
      
      // Log detection changes for debugging
      console.log('📱 Mobile detection updated:', {
        width,
        isMobile: newDetection.isMobile,
        isTablet: newDetection.isTablet,
        isDesktop: newDetection.isDesktop,
        shouldBlockEditor: newDetection.shouldBlockEditor
      });
    };

    // Initial detection
    updateDetection();

    // Listen for window resize events
    window.addEventListener('resize', updateDetection);
    
    // Listen for orientation changes (mobile devices)
    window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(updateDetection, 100);
    });

    return () => {
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', updateDetection);
    };
  }, []);

  return detection;
} 