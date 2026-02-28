/**
 * Analytics React Hook for OkBuddy
 * Provides convenient React hooks for event tracking throughout the application
 */

import { useEffect, useRef, useCallback } from 'react';
import { analytics } from '../shared/services/analyticsService';
import { STATSIG_EVENTS } from '../config/statsig';

/**
 * Hook for tracking page views
 * Automatically tracks when component mounts
 */
export function usePageView(pageName: string, additionalProperties?: Record<string, any>) {
  useEffect(() => {
    // Ensure analytics is initialized before tracking
    analytics.initialize().then(() => {
      analytics.trackPageView(pageName, additionalProperties);
    }).catch((error) => {
      console.warn('[Analytics] Failed to initialize before page view:', error);
    });
  }, [pageName, additionalProperties]);
}

/**
 * Hook for tracking section visibility using Intersection Observer
 * Tracks when sections come into viewport
 */
export function useSectionTracking(
  sectionName: string,
  threshold = 0.5,
  additionalProperties?: Record<string, any>
) {
  const ref = useRef<HTMLElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            analytics.track('section_viewed_' + sectionName.toLowerCase().replace(/\s+/g, '_'), {
              section_name: sectionName,
              viewport_percentage: Math.round(entry.intersectionRatio * 100),
              ...additionalProperties
            });
            hasTracked.current = true;
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [sectionName, threshold, additionalProperties]);

  return ref;
}

/**
 * Hook for tracking scroll depth
 * Tracks when user reaches 25%, 50%, 75%, 100% scroll depth
 */
export function useScrollTracking() {
  const milestones = useRef(new Set<number>());

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / documentHeight) * 100);

      // Track milestones
      [25, 50, 75, 100].forEach(milestone => {
        if (scrollPercent >= milestone && !milestones.current.has(milestone)) {
          milestones.current.add(milestone);
          analytics.track(STATSIG_EVENTS.SCROLL_DEPTH_REACHED, {
            scroll_depth: milestone,
            time_to_depth: Date.now() - performance.timeOrigin,
            page_height: document.documentElement.scrollHeight,
            viewport_height: window.innerHeight
          });
        }
      });
    };

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);
}

/**
 * Hook for tracking CTA clicks
 * Returns a function to track button clicks with enhanced context
 */
export function useCTATracking() {
  return useCallback((
    ctaText: string,
    ctaPosition: string,
    additionalProperties?: Record<string, any>
  ) => {
    analytics.track(STATSIG_EVENTS.HERO_CTA_CLICKED, {
      cta_text: ctaText,
      cta_position: ctaPosition,
      click_coordinates: additionalProperties?.clickEvent ? {
        x: additionalProperties.clickEvent.clientX,
        y: additionalProperties.clickEvent.clientY
      } : undefined,
      ...additionalProperties
    });
  }, []);
}

/**
 * Hook for tracking form interactions
 * Provides functions for tracking form events
 */
export function useFormTracking(formName: string) {
  return {
    trackFormStart: useCallback(() => {
      analytics.trackFormEvent(formName, 'started');
    }, [formName]),
    
    trackFormComplete: useCallback((additionalProperties?: Record<string, any>) => {
      analytics.trackFormEvent(formName, 'completed', additionalProperties);
    }, [formName]),
    
    trackFormAbandon: useCallback((abandonmentStage?: string) => {
      analytics.trackFormEvent(formName, 'abandoned', { 
        abandonment_stage: abandonmentStage 
      });
    }, [formName]),
    
    trackFormError: useCallback((errorType: string, errorMessage: string) => {
      analytics.trackFormEvent(formName, 'error', { 
        error_type: errorType,
        error_message: errorMessage 
      });
    }, [formName])
  };
}

/**
 * Hook for tracking user interactions with elements
 * Returns a function to track interactions
 */
export function useInteractionTracking() {
  return useCallback((
    elementType: string,
    action: string,
    context: string,
    additionalProperties?: Record<string, any>
  ) => {
    analytics.trackInteraction(elementType, action, context, additionalProperties);
  }, []);
}

/**
 * Hook for tracking performance metrics
 * Provides functions for performance tracking
 */
export function usePerformanceTracking() {
  return {
    trackLoadTime: useCallback((metricName: string, loadTime: number, threshold?: number) => {
      analytics.trackPerformance(metricName, loadTime, threshold);
    }, []),
    
    trackApiResponse: useCallback((endpoint: string, responseTime: number, success: boolean) => {
      analytics.track('api_response_tracked', {
        endpoint,
        response_time: responseTime,
        success,
        threshold_exceeded: responseTime > 2000 // 2 second threshold
      });
    }, [])
  };
}

/**
 * Hook for tracking exit intent
 * Tracks when user shows intent to leave the page
 */
export function useExitIntentTracking() {
  useEffect(() => {
    let hasTracked = false;
    
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasTracked) {
        hasTracked = true;
        analytics.track(STATSIG_EVENTS.EXIT_INTENT_DETECTED, {
          exit_type: 'mouse_leave',
          time_on_page: Date.now() - performance.timeOrigin,
          scroll_depth: Math.round((window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
        });
      }
    };

    const handleBeforeUnload = () => {
      if (!hasTracked) {
        hasTracked = true;
        analytics.track(STATSIG_EVENTS.EXIT_INTENT_DETECTED, {
          exit_type: 'navigation',
          time_on_page: Date.now() - performance.timeOrigin
        });
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}

/**
 * Hook for tracking conversion events
 * Provides function for tracking conversions with value
 */
export function useConversionTracking() {
  return useCallback((
    goalName: string,
    value?: number,
    currency?: string,
    additionalProperties?: Record<string, any>
  ) => {
    analytics.trackConversion(goalName, value, currency, additionalProperties);
  }, []);
}

/**
 * Hook for tracking error events
 * Provides function for tracking errors with context
 */
export function useErrorTracking() {
  return useCallback((
    errorType: string,
    errorMessage: string,
    context?: Record<string, any>
  ) => {
    analytics.trackError(errorType, errorMessage, context);
  }, []);
}

/**
 * Hook to track when component mounts/unmounts
 * Useful for engagement tracking
 */
export function useComponentLifecycle(componentName: string) {
  const mountTime = useRef(Date.now());

  useEffect(() => {
    // Track component mount
    analytics.track('component_mounted', {
      component_name: componentName,
      mount_time: mountTime.current
    });

    return () => {
      // Track component unmount and time spent
      const timeSpent = Date.now() - mountTime.current;
      analytics.track('component_unmounted', {
        component_name: componentName,
        time_spent: timeSpent
      });
    };
  }, [componentName]);
}

/**
 * Hook for user authentication state tracking
 * Tracks login/logout events
 */
export function useAuthTracking() {
  return {
    trackLogin: useCallback((method: 'email' | 'google' | 'linkedin', userId?: string) => {
      analytics.updateUser({
        userID: userId || 'authenticated',
        custom: { loginMethod: method }
      });
      analytics.track(STATSIG_EVENTS.LOGIN_COMPLETED, {
        login_method: method,
        user_id: userId
      });
    }, []),
    
    trackLogout: useCallback(() => {
      analytics.track('user_logged_out', {
        session_duration: Date.now() - performance.timeOrigin
      });
      analytics.updateUser({ userID: 'anonymous' });
    }, []),
    
    trackRegistration: useCallback((method: 'email' | 'google' | 'linkedin', userId?: string) => {
      analytics.updateUser({
        userID: userId || 'new_user',
        custom: { registrationMethod: method, isNew: true }
      });
      analytics.track(STATSIG_EVENTS.REGISTER_COMPLETED, {
        registration_method: method,
        user_id: userId
      });
    }, [])
  };
}

export default {
  usePageView,
  useSectionTracking,
  useScrollTracking,
  useCTATracking,
  useFormTracking,
  useInteractionTracking,
  usePerformanceTracking,
  useExitIntentTracking,
  useConversionTracking,
  useErrorTracking,
  useComponentLifecycle,
  useAuthTracking
};