/**
 * Language Toggle Component
 * Ready for future implementation of language switching feature
 * Following CV Builder development tenets: modular, configurable, scalable
 */

import React, { useState, useEffect } from 'react';
import { 
  LanguageConfigManager, 
  SupportedLanguage, 
  LanguagePreference 
} from '../../config/languageConfig';

interface LanguageToggleProps {
  variant?: 'dropdown' | 'buttons' | 'switch';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  onLanguageChange?: (language: SupportedLanguage, preference: LanguagePreference | null) => void;
}

// Language display names
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  vi: 'Tiếng Việt'
};

// Language flags (using emoji)
const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇺🇸',
  vi: '🇻🇳'
};

/**
 * LanguageToggle Component
 * 
 * A flexible language selection component with multiple UI variants.
 * Integrates with the LanguageConfig system for consistent language management.
 * 
 * Features:
 * - Multiple UI variants (dropdown, buttons, switch)
 * - Automatic language detection
 * - User preference persistence
 * - Event-driven updates
 * - Responsive design
 */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'dropdown',
  size = 'md',
  showIcon = true,
  className = '',
  onLanguageChange
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('vi');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const config = LanguageConfigManager.getInstance();

  // Initialize language on mount
  useEffect(() => {
    const preference = config.getUserPreference();
    if (preference) {
      setCurrentLanguage(preference.language);
    } else {
      // Auto-detect from content or use default
      const detected = config.detectLanguageFromContent({});
      setCurrentLanguage(detected.language);
    }
  }, [config]);

  // Handle language change
  const handleLanguageChange = async (language: SupportedLanguage) => {
    setIsLoading(true);
    
    try {
      // Set user preference
      config.setUserPreference(language, 'manual');
      setCurrentLanguage(language);
      
      // Get the preference object
      const preference = config.getUserPreference();
      
      // Trigger callback
      onLanguageChange?.(language, preference);
      
      // Dispatch custom event for global updates
      window.dispatchEvent(new CustomEvent('languageChange', {
        detail: { language, preference }
      }));
      
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block text-left ${className}`}>
        <button
          type="button"
          className={`
            inline-flex items-center justify-center w-full rounded-md border border-gray-300 
            shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
            ${sizeClasses[size]}
          `}
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {showIcon && (
            <span className="w-4 h-4 mr-2 text-gray-500">🌐</span>
          )}
          <span className="mr-1">
            {LANGUAGE_FLAGS[currentLanguage]} {LANGUAGE_NAMES[currentLanguage]}
          </span>
          <span 
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          >
            ▼
          </span>
        </button>

        {isOpen && (
          <div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu">
              {(['en', 'vi'] as SupportedLanguage[]).map((language) => (
                <button
                  key={language}
                  className={`
                    block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 
                    focus:outline-none focus:bg-gray-100
                    ${currentLanguage === language ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                  `}
                  onClick={() => handleLanguageChange(language)}
                  role="menuitem"
                >
                  <span className="flex items-center">
                    <span className="mr-2">{LANGUAGE_FLAGS[language]}</span>
                    {LANGUAGE_NAMES[language]}
                    {currentLanguage === language && (
                      <span className="ml-auto text-blue-600">✓</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Button variant
  if (variant === 'buttons') {
    return (
      <div className={`inline-flex rounded-md shadow-sm ${className}`} role="group">
        {(['en', 'vi'] as SupportedLanguage[]).map((language, index) => (
          <button
            key={language}
            type="button"
            className={`
              relative inline-flex items-center border focus:z-10 focus:outline-none 
              focus:ring-2 focus:ring-blue-500 disabled:opacity-50
              ${sizeClasses[size]}
              ${index === 0 ? 'rounded-l-md' : ''}
              ${index === 1 ? 'rounded-r-md -ml-px' : ''}
              ${currentLanguage === language 
                ? 'bg-blue-600 text-white border-blue-600 z-10' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => handleLanguageChange(language)}
            disabled={isLoading}
          >
            {showIcon && <span className="mr-1">{LANGUAGE_FLAGS[language]}</span>}
            {LANGUAGE_NAMES[language]}
          </button>
        ))}
      </div>
    );
  }

  // Switch variant
  if (variant === 'switch') {
    const isVietnamese = currentLanguage === 'vi';
    
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {showIcon && <span className="w-5 h-5 text-gray-500">🌐</span>}
        
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${!isVietnamese ? 'text-blue-600' : 'text-gray-500'}`}>
            EN
          </span>
          
          <button
            type="button"
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50
              ${isVietnamese ? 'bg-blue-600' : 'bg-gray-200'}
            `}
            onClick={() => handleLanguageChange(isVietnamese ? 'en' : 'vi')}
            disabled={isLoading}
            role="switch"
            aria-checked={isVietnamese}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition
                ${isVietnamese ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
          
          <span className={`text-sm font-medium ${isVietnamese ? 'text-blue-600' : 'text-gray-500'}`}>
            VI
          </span>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Hook for language management
 * 
 * Provides reactive language state and change handlers.
 * Automatically syncs with LanguageConfig and listens for global changes.
 */
export const useLanguageToggle = () => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('vi');
  const [preference, setPreference] = useState<LanguagePreference | null>(null);
  const config = LanguageConfigManager.getInstance();

  useEffect(() => {
    // Initialize
    const userPreference = config.getUserPreference();
    if (userPreference) {
      setCurrentLanguage(userPreference.language);
      setPreference(userPreference);
    } else {
      const detected = config.detectLanguageFromContent({});
      setCurrentLanguage(detected.language);
      setPreference(null);
    }

    // Listen for global language changes
    const handleLanguageChange = (event: CustomEvent) => {
      const { language, preference: newPreference } = event.detail;
      setCurrentLanguage(language);
      setPreference(newPreference);
    };

    // TypeScript type assertion for addEventListener
    window.addEventListener('languageChange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, [config]);

  const changeLanguage = (language: SupportedLanguage) => {
    config.setUserPreference(language, 'manual');
    const newPreference = config.getUserPreference();
    
    setCurrentLanguage(language);
    setPreference(newPreference);
    
    // Dispatch global event
    window.dispatchEvent(new CustomEvent('languageChange', {
      detail: { language, preference: newPreference }
    }));
  };

  return {
    currentLanguage,
    preference,
    changeLanguage,
    supportedLanguages: ['en', 'vi'] as SupportedLanguage[]
  };
}; 