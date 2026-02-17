/**
 * Navigation utility for handling CTA clicks according to Product Spec
 * Routes users to CV & JD Upload screen instead of email subscription
 */

// Unified routes within the same domain
const CV_UPLOAD_URL = '/cv-upload';
const CV_WORKSPACE_URL = '/cv-workspace';
const LOGIN_URL = '/login';
const REGISTER_URL = '/register';

/**
 * Handles primary CTA clicks - routes to CV Upload flow
 * According to Product Spec: "All main 'Get Started' CTAs will route to CV & JD Upload screen"
 * GUEST SESSION UPDATE: Unauthenticated users now go directly to CV Upload for template/upload flow
 */
export const handlePrimaryCTA = async (): Promise<void> => {
  try {
    // Check if user is authenticated
    const isAuthenticated = await checkAuthStatus();
    
    if (!isAuthenticated) {
      // GUEST SESSION: For unauthenticated users, redirect to CV Upload (guest mode)
      console.log('🎯 Guest Session: Redirecting unauthenticated user to CV Upload');
      window.location.href = CV_UPLOAD_URL;
    } else {
      // For authenticated users, go to workspace to see existing CVs
      console.log('🔧 Authenticated user: Redirecting to CV Workspace');
      window.location.href = CV_WORKSPACE_URL;
    }
  } catch (error) {
    console.error('Error handling primary CTA:', error);
    // GUEST SESSION FALLBACK: Route to CV Upload instead of register for better UX
    console.log('🎯 Guest Session Fallback: Redirecting to CV Upload');
    window.location.href = CV_UPLOAD_URL;
  }
};

/**
 * Handles secondary CTA clicks - routes to login page
 */
export const handleSecondaryCTA = (): void => {
  window.location.href = LOGIN_URL;
};

/**
 * Routes authenticated users to CV upload page
 */
export const routeToCVUpload = (): void => {
  window.location.href = CV_UPLOAD_URL;
};

/**
 * Routes authenticated users to CV workspace
 */
export const routeToCVWorkspace = (): void => {
  window.location.href = CV_WORKSPACE_URL;
};

/**
 * Checks if user is currently authenticated
 * Returns true if user has valid session, false otherwise
 */
const checkAuthStatus = async (): Promise<boolean> => {
  try {
    // Check for user session in localStorage
    const userSession = localStorage.getItem('userSession');
    
    if (!userSession) {
      return false;
    }
    
    // Try to parse the session data
    try {
      const sessionData = JSON.parse(userSession);
      return !!(sessionData && sessionData.id);
    } catch (parseError) {
      console.error('Error parsing user session:', parseError);
      // Clear invalid session data
      localStorage.removeItem('userSession');
      return false;
    }
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Tracks CTA click events for analytics
 * @param ctaLocation - Location identifier for the CTA (e.g., 'hero_section', 'problem_ats')
 */
export const trackCTAClick = (ctaLocation: string): void => {
  // Analytics tracking implementation
  try {
    // Log to console for development
    console.log(`CTA clicked: ${ctaLocation}`);
    
    // Future analytics implementation
    // gtag('event', 'cta_click', {
    //   cta_location: ctaLocation,
    //   timestamp: new Date().toISOString()
    // });
  } catch (error) {
    console.error('Error tracking CTA click:', error);
  }
}; 