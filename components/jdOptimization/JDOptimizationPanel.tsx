/**
 * JD Optimization Panel Component
 * Following OkBuddy development tenets - modular, accessible, localized
 * Implements Product Spec requirements for JD-CV optimization experience
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, FileText, X, Eye } from 'lucide-react';
import { viJDOptimizationTexts } from '../../config/texts/vi/jdOptimization';
import { enJDOptimizationTexts } from '../../config/texts/en/jdOptimization';
import { validateCVCompletion, getMissingFieldsMessage } from '../../utils/cvValidation';

interface JDAnalysisResult {
  keywords: string[];
  requirements: string[];
  skills: string[];
  suggestions: any[];
}

interface JDOptimizationPanelProps {
  cvData: any;
  language?: 'vi' | 'en';
  onJDSubmit?: (jdText: string) => Promise<void>;
  onJDRemove?: () => void;
  onAnalysisComplete?: (analysisResult: JDAnalysisResult) => void;
  isAnalyzing?: boolean;
  currentJD?: string;
  className?: string;
}

export const JDOptimizationPanel: React.FC<JDOptimizationPanelProps> = ({
  cvData,
  language = 'vi',
  onJDSubmit,
  onJDRemove,
  onAnalysisComplete,
  isAnalyzing = false,
  currentJD,
  className = ''
}) => {
  // State management
  const [jdText, setJdText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showJDViewer, setShowJDViewer] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Text configuration
  const texts = language === 'vi' ? viJDOptimizationTexts : enJDOptimizationTexts;
  
  // CV completion validation
  const cvStatus = validateCVCompletion(cvData);
  const canShowJDOptimization = cvStatus.isComplete;

  // Character count and validation
  const charCount = jdText.length;
  const maxChars = 5000;
  const minChars = 50;
  const isValidLength = charCount >= minChars && charCount <= maxChars;

  // JD Optimization Service
  // const jdOptimizationService = JDOptimizationService.getInstance();

  // Reset error when JD text changes
  useEffect(() => {
    if (error && jdText !== '') {
      setError(null);
    }
  }, [jdText, error]);

  // Handle JD submission with section-specific analysis
  const handleSubmit = async () => {
    if (!isValidLength) {
      setError(charCount < minChars ? texts.errors.tooShort : texts.errors.tooLong);
      return;
    }

    setIsSubmitting(true);
    setIsGeneratingSuggestions(true);
    setError(null);

    try {
      // Call original onJDSubmit if provided
      if (onJDSubmit) {
        await onJDSubmit(jdText);
      }

      // Generate unified analysis using the new Feature 4 service
      const analysisResult = await jdOptimizationService.generateUnifiedAnalysis(
        jdText,
        cvData,
        language
      );

      // Call the analysis complete callback
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }

      setJdText('');
      setIsExpanded(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : texts.errors.analysisError);
    } finally {
      setIsSubmitting(false);
      setIsGeneratingSuggestions(false);
    }
  };

  // Handle JD removal
  const handleRemove = () => {
    onJDRemove?.();
    setJdText('');
    setIsExpanded(false);
    setError(null);
  };

  // Sanitize input to prevent XSS
  const sanitizeInput = (input: string): string => {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitized = sanitizeInput(e.target.value);
    setJdText(sanitized);
  };

  // Don't render if CV is not complete
  if (!canShowJDOptimization) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {texts.prerequisite.completeTooltip}
            </p>
            <p className="text-sm text-gray-600">
              {getMissingFieldsMessage(cvStatus, language)}
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${cvStatus.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render JD optimization interface
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Enhanced Header with Design Spec Implementation */}
      {!currentJD ? (
        <div className="p-6">
          {/* Title Group - Following Design Spec */}
          <div className="flex flex-row items-center gap-4 mb-6">
            {/* Icon Container */}
            <div className="flex flex-col justify-center items-center p-0 w-12 h-12 bg-blue-50 rounded-xl">
              {/* Target Icon with Vector Implementation */}
              <div className="relative w-6 h-6">
                {/* Outer circle */}
                <div className="absolute inset-[8.33%] border-2 border-blue-600 rounded-full"></div>
                {/* Middle circle */}
                <div className="absolute inset-[25%] border-2 border-blue-600 rounded-full"></div>
                {/* Inner circle */}
                <div className="absolute inset-[41.67%] border-2 border-blue-600 rounded-full"></div>
              </div>
            </div>

            {/* Title Text */}
            <div className="flex flex-col items-start gap-1.5 flex-1">
              <h3 className="text-lg font-semibold leading-6 text-slate-800">
                Phân tích JD
              </h3>
              <p className="text-sm font-normal leading-5 text-slate-500">
                OkBuddy giúp bạn phân tích mô tả công việc và đưa ra gợi ý tối ưu CV của bạn
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setIsExpanded(true)}
              disabled={isAnalyzing || isGeneratingSuggestions}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
              aria-label={texts.prerequisite.ctaButton}
            >
              {isGeneratingSuggestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'vi' ? 'Đang phân tích...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  {texts.prerequisite.ctaButton}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Current JD Status with Enhanced Design */}
          <div className="flex flex-row items-center gap-4">
            {/* Icon Container - Success State */}
            <div className="flex flex-col justify-center items-center p-0 w-12 h-12 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>

            {/* Title Text */}
            <div className="flex flex-col items-start gap-1.5 flex-1">
              <h3 className="text-lg font-semibold leading-6 text-slate-800">
                Phân tích JD
              </h3>
              <p className="text-sm font-normal leading-5 text-slate-500">
                {currentJD.length} ký tự - Sẵn sàng để tối ưu hóa
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJDViewer(true)}
                className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                aria-label={texts.input.viewButton}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={handleRemove}
                disabled={isAnalyzing || isGeneratingSuggestions}
                className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                aria-label={texts.input.removeButton}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JD Input Form */}
      {isExpanded && !currentJD && (
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="jd-input" className="block text-sm font-medium text-gray-700 mb-2">
                {texts.input.label}
              </label>
              <textarea
                id="jd-input"
                value={jdText}
                onChange={handleTextChange}
                placeholder={texts.input.placeholder}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                aria-describedby="char-count guidance-text"
              />
              <div className="flex justify-between items-center mt-2">
                <p id="guidance-text" className="text-xs text-gray-500">
                  {texts.guidance.optimalLength}
                </p>
                <p
                  id="char-count"
                  className={`text-xs ${
                    charCount > maxChars ? 'text-red-600' : 
                    charCount < minChars ? 'text-gray-400' : 'text-green-600'
                  }`}
                >
                  {charCount}/{maxChars} {texts.input.charLimit}
                </p>
              </div>
            </div>

            {/* Privacy note */}
            <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {texts.guidance.privacyNote}
            </p>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Processing status */}
            {isGeneratingSuggestions && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {texts.processing.analyzing}
                  </p>
                  <p className="text-xs text-blue-600">
                    {texts.processing.generatingSuggestions}
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsExpanded(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValidLength || isSubmitting}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'vi' ? 'Đang phân tích...' : 'Analyzing...'}
                  </>
                ) : (
                  texts.input.submitButton
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JD Viewer Modal */}
      {showJDViewer && currentJD && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {texts.input.label}
              </h3>
              <button
                onClick={() => setShowJDViewer(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {currentJD}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 