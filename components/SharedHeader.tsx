'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { checkAuthentication } from '../lib/auth';
import { UserDrawer } from './common/UserDrawer';
import { FeedbackModal } from './common/FeedbackModal';

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
  variant?: 'landing' | 'auth' | 'app';
  // Custom navigation elements
  children?: React.ReactNode;
}

export default function SharedHeader({ 
  logoText = 'OkBuddy',
  showFeedback = true,
  variant = 'landing',
  children 
}: SharedHeaderProps) {
  // Authentication state
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserDrawer, setShowUserDrawer] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('vi');

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuthStatus = async () => {
      try {
        const authResult = await checkAuthentication();
        if (authResult.isAuthenticated && authResult.user) {
          setUser(authResult.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Check for saved language preference
    const savedLanguage = localStorage.getItem('okbuddy_language') as 'vi' | 'en';
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
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

  const handleLanguageChange = (language: 'vi' | 'en') => {
    setCurrentLanguage(language);
    localStorage.setItem('okbuddy_language', language);
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
      default:
        return `${baseClasses} text-2xl leading-[29px]`;
    }
  };

  return (
    <header className={getHeaderClasses()}>
      {/* Logo */}
      <button 
        onClick={handleLogoClick}
        className={getLogoClasses()}
        title="OkBuddy - Trang chủ"
        aria-label="OkBuddy - Trang chủ"
      >
        {logoText}
      </button>

      {/* Custom content or default navigation */}
      {children ? (
        children
      ) : (
        <div className="flex flex-row justify-center items-center gap-4">
          {/* Feedback Button */}
          {showFeedback && (
            <button
              onClick={handleFeedbackClick}
              className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md px-2 py-1"
              aria-label="Gửi feedback"
            >
              Feedback
            </button>
          )}

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
                    Log In
                  </span>
                </button>

                {/* Signup Button */}
                <button 
                  onClick={handleSignupClick}
                  className="flex flex-row justify-center items-center w-[120px] h-10 bg-[#0277BD] rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <span className="font-inter font-medium text-sm leading-[17px] text-white">
                    Sign Up
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