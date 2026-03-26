'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { checkAuthentication } from '../lib/auth';
// 🚀 PERFORMANCE: Use non-blocking auth for better UX
import { checkAuthenticationNonBlocking } from '../lib/auth-cache';
import dynamic from 'next/dynamic';

// Dynamic imports for performance optimization
const UserDrawer = dynamic(() => import('./common/UserDrawer').then(mod => ({ default: mod.UserDrawer })), {
  ssr: false,
  loading: () => null
});

const FeedbackModal = dynamic(() => import('./common/FeedbackModal').then(mod => ({ default: mod.FeedbackModal })), {
  ssr: false,
  loading: () => null
});
import { detectLanguage, type SupportedLanguage } from '../config/languageConfig';
import { getTexts } from '../config/texts/index';
import AICreditsCounter from './AICreditsCounter';

interface UserSession {
  id: string;
  email: string;
  name: string;
  provider: string;
  role?: 'admin' | 'user';
}

interface SharedHeaderProps {
  // Optional logo text override
  logoText?: string;
  // Show/hide feedback button
  showFeedback?: boolean;
  // Page-specific styling
  variant?: 'landing' | 'auth' | 'app' | 'editor';
  // Custom navigation elements
  children?: React.ReactNode;
  // Back navigation
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonTitle?: string;
  // Auto-save status (for CV Editor)
  showAutoSave?: boolean;
  autoSaveStatus?: 'saving' | 'saved' | 'error' | 'offline' | 'guest';
  // CV Editor specific props
  cvScore?: number;
  cvData?: any;
  onUpdateCvData?: (data: any) => void;
}

export default function SharedHeader({ 
  logoText = 'OkBuddy',
  showFeedback = true,
  variant = 'landing',
  children,
  showBackButton = false,
  onBackClick,
  backButtonTitle = 'Quay lại',
  showAutoSave = false,
  autoSaveStatus = 'saved',
  cvScore,
  cvData,
  onUpdateCvData
}: SharedHeaderProps) {
  // Authentication state
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserDrawer, setShowUserDrawer] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('en');
  const [workspaceTexts, setWorkspaceTexts] = useState<any>(null);
  const [feedbackTexts, setFeedbackTexts] = useState<any>(null);
  const [accountTexts, setAccountTexts] = useState<any>(null);
  const [navigationTexts, setNavigationTexts] = useState<any>(null);

  useEffect(() => {
    // 🚀 PERFORMANCE: Use non-blocking authentication check
    const checkAuthStatus = () => {
      // Try non-blocking first (returns immediately if cached)
      const cachedAuth = checkAuthenticationNonBlocking();
      
      if (cachedAuth) {
        // We have cached auth result - use it immediately
        if (cachedAuth.isAuthenticated && cachedAuth.user) {
          setUser(cachedAuth.user);
        }
        setIsLoading(false);
        console.log('🚀 SharedHeader: Using cached auth result');
      } else {
        // No cached result - start background auth check but don't block UI
        setIsLoading(false); // Don't block the UI
        console.log('🌐 SharedHeader: Starting background auth check');
        
        // Background auth check (non-blocking)
        checkAuthentication().then(authResult => {
          if (authResult.isAuthenticated && authResult.user) {
            setUser(authResult.user);
            console.log('✅ SharedHeader: Background auth completed');
          }
        }).catch(error => {
          console.error('❌ SharedHeader: Background auth failed:', error);
          // Don't show errors to user - just remain in logged-out state
        });
      }
    };

    checkAuthStatus();

    // Initialize language configuration using the detection system
    const initLanguage = async () => {
      const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
      let language: SupportedLanguage;
      
      if (savedLanguage && ['vi', 'en'].includes(savedLanguage)) {
        language = savedLanguage;
      } else {
        // Use language detection system
        const detectedLanguage = detectLanguage();
        language = detectedLanguage.language;
        localStorage.setItem('okbuddy_language', language);
      }
      
      setCurrentLanguage(language);
      
      // Load workspace texts for the detected language
      try {
        const texts = await getTexts('workspace', language);
        setWorkspaceTexts(texts);
      } catch (error) {
        console.error('Failed to load workspace texts:', error);
        // Fallback to English
        const fallbackTexts = await getTexts('workspace', 'en');
        setWorkspaceTexts(fallbackTexts);
      }
      
      // Load feedback texts for the detected language
      try {
        const feedbackTexts = await getTexts('feedback', language);
        setFeedbackTexts(feedbackTexts);
      } catch (error) {
        console.error('Failed to load feedback texts:', error);
        // Fallback to English
        const fallbackFeedbackTexts = await getTexts('feedback', 'en');
        setFeedbackTexts(fallbackFeedbackTexts);
      }
      
      // Load account texts for the detected language
      try {
        const accountTexts = await getTexts('account', language);
        setAccountTexts(accountTexts);
      } catch (error) {
        console.error('Failed to load account texts:', error);
        // Fallback to English
        const fallbackAccountTexts = await getTexts('account', 'en');
        setAccountTexts(fallbackAccountTexts);
      }
      
      // Load navigation texts for the detected language
      try {
        const navigationTexts = await getTexts('navigation', language);
        setNavigationTexts(navigationTexts);
      } catch (error) {
        console.error('Failed to load navigation texts:', error);
        // Fallback to English
        const fallbackNavigationTexts = await getTexts('navigation', 'en');
        setNavigationTexts(fallbackNavigationTexts);
      }
    };
    
    initLanguage();
  }, []);

  // Event handlers
  const handleLoginClick = () => {
    window.location.href = '/login';
  };

  const handleSignupClick = () => {
    window.location.href = '/register';
  };

  const handleFeedbackClick = () => {
    setShowFeedbackModal(true);
  };

  const handleCloseFeedback = () => {
    setShowFeedbackModal(false);
  };

  const handleAvatarClick = () => {
    setShowUserDrawer(true);
  };

  const getUserInitial = () => {
    if (!user) return 'U';
    return user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
  };

  const handleLanguageChange = async (language: 'vi' | 'en') => {
    setCurrentLanguage(language);
    localStorage.setItem('okbuddy_language', language);
    
    // Reload texts for the new language
    try {
      const texts = await getTexts('workspace', language);
      setWorkspaceTexts(texts);
    } catch (error) {
      console.error('Failed to load workspace texts:', error);
    }
    
    try {
      const feedbackTexts = await getTexts('feedback', language);
      setFeedbackTexts(feedbackTexts);
    } catch (error) {
      console.error('Failed to load feedback texts:', error);
    }
    
    try {
      const accountTexts = await getTexts('account', language);
      setAccountTexts(accountTexts);
    } catch (error) {
      console.error('Failed to load account texts:', error);
    }
    
    try {
      const navigationTexts = await getTexts('navigation', language);
      setNavigationTexts(navigationTexts);
    } catch (error) {
      console.error('Failed to load navigation texts:', error);
    }
  };

  // Back navigation handler
  const handleBackClick = () => {
    // Auto-save current CV data before navigation (for CV Editor)
    if (cvData && onUpdateCvData) {
      onUpdateCvData(cvData);
    }
    
    if (onBackClick) {
      onBackClick();
    } else {
      // Default back behavior
      window.history.back();
    }
  };

  // Get auto-save status display
  const getAutoSaveDisplay = () => {
    // Use dynamic texts if available, otherwise fallback to English
    const autosaveTexts = workspaceTexts?.autosave || {
      saving: 'Saving...',
      saved: 'Auto-saved',
      error: 'Save error',
      offline: 'Offline mode',
      guestWarning: 'Your progress is not saved'
    };
    
    switch (autoSaveStatus) {
      case 'saving':
        return `⏳ ${autosaveTexts.saving}`;
      case 'saved':
        return `✓ ${autosaveTexts.saved}`;
      case 'error':
        return `❌ ${autosaveTexts.error}`;
      case 'offline':
        return `📴 ${autosaveTexts.offline}`;
      case 'guest':
        return `! ${autosaveTexts.guestWarning}`;
      default:
        return `✓ ${autosaveTexts.saved}`;
    }
  };

  // Get auto-save status color
  const getAutoSaveStyle = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'bg-blue-50 text-blue-600 border-blue-500/20';
      case 'saved':
        return 'bg-green-50 text-green-600 border-green-500/20';
      case 'error':
        return 'bg-red-50 text-red-600 border-red-500/20';
      case 'offline':
        return 'bg-yellow-50 text-yellow-600 border-yellow-500/20';
      case 'guest':
        return 'bg-orange-50 text-orange-600 border-orange-500/20';
      default:
        return 'bg-green-50 text-green-600 border-green-500/20';
    }
  };

  const handleLogoClick = () => {
    if (variant === 'landing') {
      // Marketing site behavior - scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to home page
      window.location.href = '/';
    }
  };

  // Conditional styling based on variant
  const getHeaderClasses = () => {
    const baseClasses = "flex flex-row justify-between items-center w-full bg-white";
    
    switch (variant) {
      case 'landing':
        return `${baseClasses} px-4 sm:px-6 lg:px-10 h-20 border border-[#E2E8F0]`;
      case 'auth':
        return `${baseClasses} h-16 sm:h-20 px-4 sm:px-6 lg:px-10 border-b border-gray-100 shadow-sm`;
      case 'app':
        return `${baseClasses} px-4 sm:px-6 h-16 border-b border-gray-200`;
      case 'editor':
        return `${baseClasses} px-6 py-4 border-b border-gray-200`;
      default:
        return `${baseClasses} px-4 sm:px-6 lg:px-10 h-20 border border-[#E2E8F0]`;
    }
  };

  const getLogoClasses = () => {
    const baseClasses = "font-inter font-bold text-[#0277BD] hover:text-primary-600 active:text-[#0277BD] transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md px-2 py-1";
    
    switch (variant) {
      case 'landing':
        return `${baseClasses} text-2xl leading-[29px]`;
      case 'auth':
        return `${baseClasses} text-xl sm:text-2xl`;
      case 'app':
        return `${baseClasses} text-xl`;
      case 'editor':
        return `${baseClasses} text-2xl`;
      default:
        return `${baseClasses} text-2xl leading-[29px]`;
    }
  };

  return (
    <header className={getHeaderClasses()}>
      {/* Left Section - Back button and Logo */}
      <div className="flex items-center gap-6">
        {/* Back Button */}
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            title={backButtonTitle}
            aria-label={backButtonTitle}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        
        {/* Logo */}
        <button 
          onClick={handleLogoClick}
          className={getLogoClasses()}
          title="OkBuddy - Trang chủ"
          aria-label="OkBuddy - Trang chủ"
        >
          {logoText}
        </button>
      </div>

      {/* Center Section - Spacer */}
      <div className="flex-1"></div>

      {/* Right Section - Navigation, Auto-save, Feedback, Auth */}
      {children ? (
        children
      ) : (
        <div className="flex flex-row justify-center items-center gap-4">
          {/* Auto-save Status COMPLETELY REMOVED - Now shown in PreviewPanel */}

          {/* Navigation Items */}
          <div className="hidden sm:flex flex-row justify-center items-center gap-4">
            {/* Feedback Button - Moved to first position */}
            {showFeedback && (
              <button
                onClick={handleFeedbackClick}
                className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md px-2 py-1"
                aria-label={navigationTexts?.aria?.feedback || feedbackTexts?.aria?.feedbackButton || "Send feedback"}
              >
                {navigationTexts?.header?.feedback || feedbackTexts?.buttonLabel || 'Have a feedback?'}
              </button>
            )}

            {/* Career / Join Us */}
            <button
              onClick={() => window.location.href = '/career'}
              className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md px-2 py-1"
              aria-label={navigationTexts?.aria?.career || "Career opportunities"}
            >
              {navigationTexts?.header?.career || 'Career / Join Us'}
            </button>

            {/* CV Workspace - Updated text */}
            <button
              onClick={() => window.location.href = '/cv-workspace'}
              className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md px-2 py-1"
              aria-label={navigationTexts?.aria?.workspace || "CV Workspace"}
            >
              {navigationTexts?.header?.workspace || 'Your Resumes'}
            </button>

            {/* Elegant Separator */}
            <div className="text-gray-300 text-lg font-light">|</div>
          </div>

          {/* AI Credits Counter */}
          <AICreditsCounter 
            userId={user?.id}
            variant="header"
            showLabel={true}
            className="hidden sm:flex"
          />

          {/* Auth Buttons / User Avatar */}
          <div className="flex flex-row justify-center items-center gap-4">
            {isLoading ? (
              // Loading state
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              // Authenticated user - Show avatar
              <button
                onClick={handleAvatarClick}
                className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                title={`${user.name || user.email} - Nhấn để mở menu`}
                aria-label="Mở menu người dùng"
              >
                {getUserInitial()}
              </button>
            ) : (
              // Unauthenticated user - Show login/register buttons
              <>
                {/* Login Button */}
                <button 
                  onClick={handleLoginClick}
                  className="flex flex-row justify-center items-center w-[100px] h-10 bg-white border border-[#0277BD] rounded-lg hover:bg-[#E1F5FE] transition-colors"
                >
                  <span className="font-inter font-medium text-sm leading-[17px] text-[#0277BD]">
                    {accountTexts?.nav?.login || 'Log In'}
                  </span>
                </button>

                {/* Signup Button */}
                <button 
                  onClick={handleSignupClick}
                  className="flex flex-row justify-center items-center w-[120px] h-10 bg-[#0277BD] rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <span className="font-inter font-medium text-sm leading-[17px] text-white">
                    {accountTexts?.nav?.signup || 'Sign Up'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* User Drawer */}
      <UserDrawer
        isOpen={showUserDrawer}
        onClose={() => setShowUserDrawer(false)}
        user={user}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={handleCloseFeedback}
        userEmail={user?.email}
        currentLanguage={currentLanguage}
      />
    </header>
  );
}