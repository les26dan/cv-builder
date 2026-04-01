'use client';

import React, { useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import { getTexts } from '../../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../../config/languageConfig';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentLanguage?: SupportedLanguage;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  currentLanguage
}) => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [texts, setTexts] = useState<any>(null);

  // Load texts based on current language
  useEffect(() => {
    const loadTexts = async () => {
      try {
        const effectiveLanguage = currentLanguage || detectLanguage().language;
        const feedbackTexts = await getTexts('feedback', effectiveLanguage);
        setTexts(feedbackTexts);
      } catch (error) {
        console.error('Failed to load feedback texts:', error);
        // Fallback to Vietnamese
        try {
          const feedbackTexts = await getTexts('feedback', 'vi');
          setTexts(feedbackTexts);
        } catch (fallbackError) {
          console.error('Failed to load fallback texts:', fallbackError);
        }
      }
    };

    if (isOpen) {
      loadTexts();
    }
  }, [isOpen, currentLanguage]);

  // Auto-populate email if user is logged in
  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFeedback('');
      if (!userEmail) {
        setEmail('');
      }
      setIsSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen, userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Feedback submitted:', {
        feedback: feedback.trim(),
        email: email.trim() || 'anonymous',
        timestamp: new Date().toISOString()
      });
      
      setIsSubmitted(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = feedback.length;
  const isOverLimit = characterCount > 5000;
  const isValid = feedback.trim().length > 0 && !isOverLimit;

  if (!isOpen) return null;
  
  // Don't render until texts are loaded
  if (!texts) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 font-inter">
            {texts.title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            aria-label={texts.aria.closeButton}
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            /* Success Message */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-inter">
                {texts.success.title}
              </h3>
              <p className="text-gray-600 font-inter">
                {texts.success.message}
              </p>
            </div>
          ) : (
            /* Feedback Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Description */}
              <div>
                <p className="text-gray-600 mb-4 font-inter">
                  {texts.description}
                </p>
              </div>

              {/* Feedback Textarea */}
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                  {texts.form.feedbackLabel} <span className="text-red-500">{texts.form.feedbackRequired}</span>
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={texts.form.feedbackPlaceholder}
                  className={`w-full h-40 px-4 py-3 border rounded-lg font-inter resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors ${
                    isOverLimit 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-primary'
                  }`}
                  required
                />
                <div className="flex justify-between items-center mt-2">
                  <div className={`text-sm font-inter ${
                    isOverLimit ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {characterCount}/{texts.form.characterLimit} {texts.form.characterCount}
                  </div>
                  {isOverLimit && (
                    <div className="text-sm text-red-500 font-inter">
                      {texts.form.overLimit} {characterCount - 5000} {texts.form.characterCount}
                    </div>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                  {texts.form.emailLabel} {userEmail ? texts.form.emailLoggedIn : texts.form.emailOptional}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={userEmail ? userEmail : texts.form.emailPlaceholder}
                  disabled={!!userEmail}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg font-inter focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 focus:border-primary transition-colors ${
                    userEmail ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                />
                <p className="text-sm text-gray-500 mt-1 font-inter">
                  {userEmail 
                    ? texts.form.emailHelpLoggedIn
                    : texts.form.emailHelp
                  }
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 font-inter"
                >
                  {texts.buttons.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 font-inter ${
                    isValid && !isSubmitting
                      ? 'bg-primary text-white hover:bg-primary-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {texts.buttons.submitting}
                    </div>
                  ) : (
                    texts.buttons.submit
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};