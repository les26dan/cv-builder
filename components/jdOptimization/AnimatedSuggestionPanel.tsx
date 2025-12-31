/**
 * Animated Suggestion Panel Component
 * Task 5: Enhanced animations and transitions for suggestion system
 * Following OkBuddy development tenets - smooth, professional animations
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Sparkles, CheckCircle, X, TrendingUp } from 'lucide-react';
import { viJDOptimizationTexts } from '../../config/texts/vi/jdOptimization';
import { enJDOptimizationTexts } from '../../config/texts/en/jdOptimization';

interface JDOptimizationSuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  reasoning?: string;
  originalText?: string;
  suggestedText?: string;
  applied?: boolean;
}

interface AnimatedSuggestionPanelProps {
  sectionId: string;
  sectionTitle: string;
  suggestions: JDOptimizationSuggestion[];
  language?: 'vi' | 'en';
  onApplySuggestion: (suggestion: JDOptimizationSuggestion) => void;
  onDismissSuggestion: (suggestion: JDOptimizationSuggestion) => void;
  onApplyAll?: () => Promise<void>;
  isApplyingAll?: boolean;
  applyAllProgress?: { current: number; total: number };
  appliedSuggestions?: Set<string>;
  className?: string;
}

export const AnimatedSuggestionPanel: React.FC<AnimatedSuggestionPanelProps> = ({
  sectionId,
  sectionTitle,
  suggestions,
  language = 'vi',
  onApplySuggestion,
  onDismissSuggestion,
  onApplyAll,
  isApplyingAll = false,
  applyAllProgress = { current: 0, total: 0 },
  appliedSuggestions = new Set(),
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded
  const [isVisible, setIsVisible] = useState(false);
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const [justApplied, setJustApplied] = useState<Set<string>>(new Set());
  const [showApplyAllCelebration, setShowApplyAllCelebration] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const texts = language === 'vi' ? viJDOptimizationTexts : enJDOptimizationTexts;

  // Panel entrance animation - Must be before any early returns
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Apply All completion celebration - Must be before any early returns
  useEffect(() => {
    if (isApplyingAll && applyAllProgress.current === applyAllProgress.total && applyAllProgress.total > 0) {
      setShowApplyAllCelebration(true);
      const timer = setTimeout(() => setShowApplyAllCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isApplyingAll, applyAllProgress]);

  // Early return must come AFTER all hooks
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const handleApplySuggestion = async (suggestion: JDOptimizationSuggestion) => {
    setAnimatingItems(prev => new Set(prev).add(suggestion.id));
    
    try {
      await onApplySuggestion(suggestion);
      setJustApplied(prev => new Set(prev).add(suggestion.id));
      
      // Remove from animating after a delay
      setTimeout(() => {
        setAnimatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(suggestion.id);
          return newSet;
        });
      }, 500);
      
      // Remove from just applied after animation
      setTimeout(() => {
        setJustApplied(prev => {
          const newSet = new Set(prev);
          newSet.delete(suggestion.id);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
      throw error;
    }
  };

  const remainingSuggestions = suggestions.filter(s => !appliedSuggestions.has(s.id));
  const appliedCount = suggestions.length - remainingSuggestions.length;

  return (
    <div 
      ref={panelRef}
      className={`transform transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`}
    >
      <div className="border border-blue-200 rounded-xl mt-4 overflow-hidden shadow-sm bg-white">
        {/* Enhanced Panel Header with Animations */}
        <div 
          className={`flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer transition-all duration-300 border-b border-blue-100 ${
            isExpanded ? 'hover:from-blue-100 hover:to-indigo-100' : 'hover:from-blue-75 hover:to-indigo-75'
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                <ChevronDown className="w-4 h-4 text-blue-600" />
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900">
                {language === 'vi' ? 'Gợi ý từ AI cho' : 'AI Suggestions for'} {sectionTitle}
              </h3>
              <div className="flex items-center gap-2 sm:gap-4 text-xs text-blue-700 flex-wrap">
                <span className="transition-all duration-200 hover:text-blue-800">
                  {suggestions.length} {language === 'vi' ? 'gợi ý' : 'suggestions'}
                </span>
                {appliedCount > 0 && (
                  <span className="text-green-600 transition-all duration-200 animate-pulse">
                    {appliedCount} {language === 'vi' ? 'đã áp dụng' : 'applied'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {remainingSuggestions.length > 1 && onApplyAll && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyAll();
                }}
                disabled={isApplyingAll}
                className={`relative flex items-center gap-1 sm:gap-2 px-3 py-2 text-xs font-medium rounded-full transition-all duration-300 transform hover:scale-105 ${
                  isApplyingAll 
                    ? 'opacity-75 cursor-not-allowed scale-95' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isApplyingAll ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">
                      {language === 'vi' ? 'Đang áp dụng...' : 'Applying...'}
                    </span>
                    <div className="text-xs bg-white/20 px-1 rounded">
                      {applyAllProgress.current}/{applyAllProgress.total}
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {language === 'vi' ? 'Áp dụng tất cả' : 'Apply All'}
                    </span>
                    <span className="sm:hidden">All</span>
                    <span className="bg-yellow-400 text-yellow-900 px-1 py-0.5 text-xs rounded font-bold animate-pulse">
                      PRO
                    </span>
                  </>
                )}
                
                {/* Apply All Progress Bar */}
                {isApplyingAll && applyAllProgress.total > 0 && (
                  <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-300"
                      style={{ 
                        width: `${(applyAllProgress.current / applyAllProgress.total) * 100}%` 
                      }}
                    />
                  </div>
                )}
              </button>
            )}
            
            <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full transition-all duration-200 hover:bg-blue-200">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              <span className="hidden sm:inline">
                {language === 'vi' ? 'Cải thiện CV' : 'Improve CV'}
              </span>
              <span className="sm:hidden">+</span>
            </div>
          </div>
        </div>

        {/* Animated Suggestions List */}
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {/* All Suggestions in Single Section */}
          <div className="p-3 sm:p-4 space-y-3">
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={suggestion.id}
                  className={`transform transition-all duration-500 ease-out ${
                    isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <AnimatedSuggestionCard
                    suggestion={suggestion}
                    language={language}
                    onApply={() => handleApplySuggestion(suggestion)}
                    onDismiss={() => onDismissSuggestion(suggestion)}
                    isApplied={appliedSuggestions.has(suggestion.id)}
                    isAnimating={animatingItems.has(suggestion.id)}
                    justApplied={justApplied.has(suggestion.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Apply All Celebration */}
        {showApplyAllCelebration && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center z-10 rounded-xl">
            <div className="bg-white rounded-lg p-6 shadow-xl transform animate-bounce">
              <div className="text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="font-bold text-green-600">
                  {language === 'vi' ? 'Hoàn thành!' : 'Complete!'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'vi' ? 'Tất cả gợi ý đã được áp dụng' : 'All suggestions applied'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface AnimatedSuggestionCardProps {
  suggestion: JDOptimizationSuggestion;
  language: 'vi' | 'en';
  onApply: () => void;
  onDismiss: () => void;
  isApplied: boolean;
  isAnimating: boolean;
  justApplied: boolean;
}

const AnimatedSuggestionCard: React.FC<AnimatedSuggestionCardProps> = ({
  suggestion,
  language,
  onApply,
  onDismiss,
  isApplied,
  isAnimating,
  justApplied
}) => {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply();
    } finally {
      setIsApplying(false);
    }
  };

  if (isApplied) {
    return (
      <div 
        className={`bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 transition-all duration-500 ${
          justApplied ? 'scale-105 shadow-lg' : 'scale-100 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">
            {language === 'vi' ? 'Đã áp dụng thành công' : 'Successfully applied'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ${
        isAnimating ? 'transform scale-105 shadow-lg border-blue-300' : 'hover:shadow-md'
      }`}
    >
      {/* Text Comparison */}
      <div className="p-3 sm:p-4 space-y-4">
        {/* Original Text */}
        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r transition-all duration-200 hover:bg-red-75">
          <p className="text-xs font-semibold text-red-800 mb-2 uppercase tracking-wide">
            {language === 'vi' ? 'Hiện tại' : 'Current'}
          </p>
          <p className="text-sm text-red-700 leading-relaxed">
            {suggestion.originalText}
          </p>
        </div>

        {/* Suggested Text */}
        <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r transition-all duration-200 hover:bg-green-75">
          <p className="text-xs font-semibold text-green-800 mb-2 uppercase tracking-wide">
            {language === 'vi' ? 'Đề xuất' : 'Suggested'}
          </p>
          <p className="text-sm text-green-700 leading-relaxed">
            {suggestion.suggestedText}
          </p>
        </div>
      </div>

      {/* Reasoning */}
      {suggestion.reasoning && (
        <div className="px-3 sm:px-4 pb-3">
          <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded transition-all duration-200 hover:bg-gray-100">
            <span className="font-medium">{language === 'vi' ? 'Lý do:' : 'Reasoning:'}</span> {suggestion.reasoning}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-3 sm:p-4 pt-0 bg-gray-50">
        <button
          onClick={onDismiss}
          className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all duration-200 transform hover:scale-105"
        >
          <X className="w-3 h-3" />
          {language === 'vi' ? 'Bỏ qua' : 'Dismiss'}
        </button>
        
        <button
          onClick={handleApply}
          disabled={isApplying || isAnimating}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 transform ${
            isApplying || isAnimating
              ? 'opacity-50 cursor-not-allowed scale-95'
              : 'bg-primary-500 text-white hover:bg-primary-700 hover:scale-105 shadow-sm hover:shadow-md'
          }`}
        >
          {isApplying || isAnimating ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              <span>
                {language === 'vi' ? 'Đang áp dụng...' : 'Applying...'}
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3" />
              {language === 'vi' ? 'Áp dụng' : 'Apply'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AnimatedSuggestionPanel; 