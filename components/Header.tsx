'use client';

import { useState, useEffect } from 'react';
import { landingPage } from '../config/texts/index';
import { handleSecondaryCTA } from '../utils/navigation';
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
import { checkAuthentication } from '../lib/auth';
import { detectLanguage, type SupportedLanguage } from '../config/languageConfig';

interface UserSession {
  id: string;
  email: string;
  name: string;
  provider: string;
  role?: 'admin' | 'user';
}

export default function Header() {
  const { header } = landingPage;
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserDrawer, setShowUserDrawer] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('en');

  useEffect(() => {
    // Check authentication status on component mount with retry logic
    let retryCount = 0;
    const maxRetries = 2;

    const checkAuthStatus = async () => {
      try {
        const authResult = await checkAuthentication();
        if (authResult.isAuthenticated && authResult.user) {
          setUser(authResult.user);
        } else if (authResult.error === 'Authentication check timed out' && retryCount < maxRetries) {
          // Retry on timeout
          retryCount++;
          console.log(`Auth check timeout, retrying... (${retryCount}/${maxRetries})`);
          setTimeout(checkAuthStatus, 1000); // Retry after 1 second
          return; // Don't set loading to false yet
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Auth check error, retrying... (${retryCount}/${maxRetries})`);
          setTimeout(checkAuthStatus, 1000);
          return;
        }
      } finally {
        // Only set loading to false if we're not retrying
        if (retryCount >= maxRetries || retryCount === 0) {
          setIsLoading(false);
        }
      }
    };

    checkAuthStatus();

    // Initialize language configuration using the detection system
    const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
    if (savedLanguage && ['vi', 'en'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Use language detection system
      const detectedLanguage = detectLanguage();
      setCurrentLanguage(detectedLanguage.language);
      localStorage.setItem('okbuddy_language', detectedLanguage.language);
    }
  }, []);

  const handleLoginClick = () => {
    handleSecondaryCTA(); // Routes to /login
  };

  const handleSignupClick = () => {
    window.location.href = '/register'; // Routes to /register
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

  const handleLanguageChange = (language: 'vi' | 'en') => {
    setCurrentLanguage(language);
    // Language change implementation would go here
    // For now, just update localStorage
    localStorage.setItem('okbuddy_language', language);
  };

  return (
    <header className="flex flex-row justify-between items-center px-4 sm:px-6 lg:px-10 w-full h-20 bg-white border border-[#E2E8F0]">
      {/* Logo */}
      <button 
        onClick={() => {
          // Marketing site behavior - reload page or scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="font-inter font-bold text-2xl leading-[29px] text-[#0277BD] hover:text-primary-600 active:text-[#0277BD] transition-colors duration-200 bg-none border-none cursor-pointer px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
        title="OkBuddy - Trang chủ"
        aria-label="OkBuddy - Trang chủ"
      >
        {header.logo}
      </button>

      {/* Navigation Links - Hidden as per task requirements */}
      <nav className="hidden">
        <a href="#features" className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-[#0277BD] transition-colors">
          {header.nav.features}
        </a>
        <a href="#pricing" className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-[#0277BD] transition-colors">
          {header.nav.pricing}
        </a>
        <a href="#about" className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-[#0277BD] transition-colors">
          {header.nav.about}
        </a>
      </nav>

      {/* Navigation & Auth Section */}
      <div className="flex flex-row justify-center items-center gap-4">
        {/* Feedback Button */}
        <button
          onClick={handleFeedbackClick}
          className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-[#0277BD] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md px-2 py-1"
          aria-label="Gửi feedback"
        >
          Feedback
        </button>
        
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
                {header.auth.login}
              </span>
            </button>

            {/* Signup Button */}
            <button 
              onClick={handleSignupClick}
              className="flex flex-row justify-center items-center w-[120px] h-10 bg-[#0277BD] rounded-lg hover:bg-primary-600 transition-colors"
            >
              <span className="font-inter font-medium text-sm leading-[17px] text-white">
                {header.auth.signup}
              </span>
            </button>
          </>
        )}
        </div>
      </div>

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