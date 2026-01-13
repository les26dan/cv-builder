import { useState, useEffect, useRef } from 'react';

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
  const mountedRef = useRef(true);
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
      if (!mountedRef.current) return; // Prevent state update if unmounted
      
      const width = window.innerWidth;
      const newDetection: MobileDetectionResult = {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        viewportWidth: width,
        shouldBlockEditor: width < 1024 // Block mobile and small tablets
      };
      
      // Only update and log if detection actually changed
      const hasChanged = (
        detection.isMobile !== newDetection.isMobile ||
        detection.isTablet !== newDetection.isTablet ||
        detection.isDesktop !== newDetection.isDesktop ||
        Math.abs(detection.viewportWidth - newDetection.viewportWidth) > 10
      );
      
      if (hasChanged) {
        setDetection(newDetection);
        
        // Log detection changes for debugging
        console.log('📱 Mobile detection updated:', {
          width,
          isMobile: newDetection.isMobile,
          isTablet: newDetection.isTablet,
          isDesktop: newDetection.isDesktop,
          shouldBlockEditor: newDetection.shouldBlockEditor
        });
      }
    };

    // Initial detection
    updateDetection();

    // Listen for window resize events
    window.addEventListener('resize', updateDetection);
    
    // Listen for orientation changes (mobile devices)
    const handleOrientationChange = () => {
      // Delay to allow orientation change to complete
      setTimeout(() => {
        if (mountedRef.current) {
          updateDetection();
        }
      }, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      mountedRef.current = false; // Mark as unmounted
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return detection;
} 