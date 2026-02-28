import React from 'react';

interface SocialLoginButtonProps {
  provider: 'google' | 'facebook' | 'github' | 'linkedin';
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onClick,
  disabled = false,
  children
}) => {
  const getProviderStyles = () => {
    const baseStyles = "flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    switch (provider) {
      case 'google':
        return `${baseStyles} border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500`;
      case 'facebook':
        return `${baseStyles} border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
      case 'github':
        return `${baseStyles} border-gray-800 bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-500`;
      case 'linkedin':
        return `${baseStyles} border-blue-700 bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-500`;
      default:
        return `${baseStyles} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
    }
  };

  const getProviderIcon = () => {
    // Simple text icons for now
    switch (provider) {
      case 'google':
        return 'G';
      case 'facebook':
        return 'f';
      case 'github':
        return 'GH';
      case 'linkedin':
        return 'in';
      default:
        return '?';
    }
  };

  return (
    <button
      type="button"
      className={getProviderStyles()}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Sign in with ${provider}`}
    >
      <span className="mr-2">{getProviderIcon()}</span>
      {children || `Continue with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
    </button>
  );
};

export default SocialLoginButton; 