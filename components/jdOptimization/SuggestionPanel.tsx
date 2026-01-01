/**
 * Suggestion Panel Component
 * Displays inline AI suggestions beneath CV sections
 * Following OkBuddy development tenets - accessible, localized, professional UI
 * Updated for Task 3: Enhanced inline suggestion panel system
 * Updated for Template: Matching MagicPattern UI design
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, X, User, Briefcase, Lightbulb, GraduationCap, LucideIcon } from 'lucide-react';
import { viJDOptimizationTexts } from '../../config/texts/vi/jdOptimization';
import { enJDOptimizationTexts } from '../../config/texts/en/jdOptimization';
import { KeywordHighlighter } from './KeywordHighlighter';

interface JDOptimizationSuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  reasoning?: string;
  originalText?: string;
  suggestedText: string;
  applied?: boolean;
  addedKeywords?: string[];
  metadata?: {
    jobTitle?: string;
    company?: string;
  };
}

interface SuggestionPanelProps {
  sectionId: string;
  sectionTitle: string;
  suggestions: JDOptimizationSuggestion[];
  language?: 'vi' | 'en';
  onApplySuggestion: (suggestion: JDOptimizationSuggestion) => void;
  onDismissSuggestion: (suggestion: JDOptimizationSuggestion) => void;
  className?: string;
}

// Helper function to get the appropriate icon for each section
const getSectionIcon = (sectionId: string): LucideIcon => {
  switch (sectionId) {
    case 'summary':
      return User;
    case 'experience':
      return Briefcase;
    case 'skills':
      return Lightbulb;
    case 'education':
      return GraduationCap;
    default:
      // Handle experience sections with IDs like "experience-0", "experience-1"
      if (sectionId.startsWith('experience-')) {
        return Briefcase;
      }
      return User;
  }
};

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  sectionId,
  sectionTitle,
  suggestions,
  language = 'vi',
  onApplySuggestion,
  onDismissSuggestion,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const texts = language === 'vi' ? viJDOptimizationTexts : enJDOptimizationTexts;

  // Don't render if no suggestions
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const handleApplySuggestion = async (suggestion: JDOptimizationSuggestion) => {
    try {
      await onApplySuggestion(suggestion);
      setAppliedSuggestions(prev => new Set(prev).add(suggestion.id));
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  };

  const handleDismissSuggestion = async (suggestion: JDOptimizationSuggestion) => {
    try {
      await onDismissSuggestion(suggestion);
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  const appliedCount = appliedSuggestions.size;
  const SectionIcon = getSectionIcon(sectionId);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Section Header - Matching Template Design */}
      <div 
        className="p-6 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`suggestions-${sectionId}`}
        aria-label={`${language === 'vi' ? 'Gợi ý AI cho' : 'AI suggestions for'} ${sectionTitle}. ${suggestions.length} ${language === 'vi' ? 'gợi ý có sẵn' : 'suggestions available'}. ${isExpanded ? (language === 'vi' ? 'Nhấn để thu gọn' : 'Press to collapse') : (language === 'vi' ? 'Nhấn để mở rộng' : 'Press to expand')}`}
      >
        <div className="flex items-center">
          <div className="bg-blue-50 p-2 rounded-md mr-3">
            <SectionIcon className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-medium">{sectionTitle}</h3>
        </div>
        <div className="flex items-center">
          <button className="bg-primary-500 text-white rounded-md px-4 py-1 mr-2 text-sm hover:bg-primary-700 transition-colors">
            {language === 'vi' ? 'Áp dụng' : 'Apply'}
          </button>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div 
          id={`suggestions-${sectionId}`}
          className="px-6 pb-3"
          role="region"
          aria-label={`${language === 'vi' ? 'Danh sách gợi ý cho' : 'Suggestions list for'} ${sectionTitle}`}
        >
          <div className="space-y-6" role="list" aria-label={language === 'vi' ? 'Danh sách gợi ý' : 'Suggestions list'}>
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} role="listitem">
                <SuggestionCard
                  suggestion={suggestion}
                  language={language}
                  onApply={() => handleApplySuggestion(suggestion)}
                  onDismiss={() => handleDismissSuggestion(suggestion)}
                  isApplied={appliedSuggestions.has(suggestion.id)}
                  sectionId={sectionId}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Suggestion Card Component - Matching Template Design
interface SuggestionCardProps {
  suggestion: JDOptimizationSuggestion;
  language: 'vi' | 'en';
  onApply: () => void;
  onDismiss: () => void;
  isApplied: boolean;
  sectionId: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  language,
  onApply,
  onDismiss,
  isApplied,
  sectionId
}) => {
  if (isApplied) {
    return null; // Hide applied suggestions
  }

  // Extract job title and company for work experience sections
  const getJobContext = () => {
    if (sectionId === 'experience' && suggestion.metadata?.jobTitle && suggestion.metadata?.company) {
      return `${suggestion.metadata.jobTitle} tại ${suggestion.metadata.company}`;
    }
    return null;
  };

  const jobContext = getJobContext();

  return (
    <div className="mb-6">
      {/* Job Context for Work Experience */}
      {jobContext && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-800">{jobContext}</h4>
        </div>
      )}

      {/* Full Background Section containing both current, divider, and suggested */}
      <div className="bg-slate-50 p-4 rounded-md">
        {/* Current Text */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-3">
            {language === 'vi' ? 'Hiện tại:' : 'Current:'}
          </div>
          <p className="text-gray-700 leading-relaxed">
            {suggestion.originalText}
          </p>
        </div>

        {/* Horizontal Divider with correct color #E2E8F0 */}
        <div className="border-t border-gray-300 my-4"></div>

        {/* Suggested Text */}
        <div>
          <div className="text-sm text-green-500 mb-3">
            {language === 'vi' ? 'Đề xuất:' : 'Suggested:'}
          </div>
          <p className="text-gray-700 leading-relaxed">
            <KeywordHighlighter 
              text={suggestion.suggestedText}
              addedKeywords={Array.isArray(suggestion.addedKeywords) ? suggestion.addedKeywords : []}
              highlightColor="green"
            />
          </p>
        </div>
      </div>
    </div>
  );
}; 