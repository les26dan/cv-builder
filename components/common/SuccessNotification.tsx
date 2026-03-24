import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SuccessNotificationProps {
  isVisible: boolean;
  message: string;
  duration?: number; // Duration in milliseconds, default 2000ms
  onComplete?: () => void;
}

export const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  isVisible,
  message,
  duration = 2000,
  onComplete
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // Wait for fade-out animation to complete before calling onComplete
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 300); // 300ms for fade-out animation
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, duration, onComplete]);

  if (!isVisible && !isAnimating) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div 
        className={`
          bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg
          transform transition-all duration-300 ease-in-out
          ${isAnimating && isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-2 opacity-0 scale-95'
          }
        `}
        style={{
          backdropFilter: 'blur(8px)',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium animate-pulse">
            {message}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};
