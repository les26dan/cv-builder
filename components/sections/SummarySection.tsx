import { useState, useEffect } from 'react';
import { AIAssistButton } from '../common/AIAssistButton';
import { aiService, EnhancedSummaryGenerationRequest } from '../../utils/aiService';
import { getTexts } from '../../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../../config/languageConfig';
import { useAIFeatureGating } from '../../hooks/useAIFeatureGating';
import { AIFeature } from '../../shared/services/aiCreditsService';

// PDF Preview Integration - SAFETY: Additive import for input event handling
import { PDFPreviewTextarea } from '../common/PDFPreviewInput';
import { PDFPreviewDebounceReturn } from '../../hooks/usePDFPreviewDebounce';

interface SummarySectionProps {
  data: {
    content: string;
  };
  onUpdate: (data: any) => void;
  isActive: boolean;
  cvData?: any; // Access to full CV data to check work experience
  onNavigateToSection?: (sectionId: string) => void;
  language?: SupportedLanguage;
  pdfPreview?: PDFPreviewDebounceReturn; // SAFETY: Optional prop for PDF integration
  userId?: string; // For AI credits gating
}

export const SummarySection = ({
  data,
  onUpdate,
  cvData,
  onNavigateToSection,
  language,
  pdfPreview, // SAFETY: Optional prop with default undefined
  userId
}: SummarySectionProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // AI Feature Gating for monetization
  const { executeAIFeature, isCheckingAccess, showLoginModal, showPaywallModal } = useAIFeatureGating(userId);
  
  // Language and text configuration
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [summaryTexts, setSummaryTexts] = useState<any>(null);
  
  // Load language configuration
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
        const effectiveLanguage = language || savedLanguage || detectLanguage().language;
        
        setCurrentLanguage(effectiveLanguage);
        const texts = await getTexts('cvEditor', effectiveLanguage);
        setSummaryTexts(texts.sections.summary);
      } catch (error) {
        console.error('Failed to load summary texts:', error);
        setCurrentLanguage('en');
      }
    };
    
    loadLanguage();
  }, [language]);
  
  // Bulletproof type checking for summary content - moved to top for all uses
  const safeContent = (() => {
    if (!data?.content) return '';
    if (typeof data.content === 'string') return data.content;
    if (Array.isArray(data.content)) return (data.content as any[]).join(' ');
    if (typeof data.content === 'object') return JSON.stringify(data.content);
    return String(data.content || '');
  })();
  
  const handleChange = (content: string) => {
    onUpdate({
      ...data,
      content
    });
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    
    try {
      // Execute AI feature with credit gating
      const result = await executeAIFeature(
        AIFeature.SUMMARY_GENERATE,
        async () => {
          // Use enhanced summary generation with full CV context
          const request: EnhancedSummaryGenerationRequest = {
            workExperience: cvData?.experience?.items || [],
            skills: cvData?.skills?.items || [],
            education: cvData?.education?.items || [],
            existingContent: safeContent
          };

          const aiResult = await aiService.generateEnhancedSummary(request);
          
          if (!aiResult.success || !aiResult.data) {
            throw new Error(aiResult.error || 'Failed to generate summary');
          }
          
          return aiResult.data;
        }
      );

      if (result.success && result.data) {
        handleChange(result.data);
        // Mark AI as used for score calculation (will be implemented)
        // markAIUsed('summary');
      } else {
        if (result.needsLogin) {
          console.log('Login required for AI features');
          // Login modal will be shown by AI gating hook
          return;
        }
        if (result.needsPayment) {
          console.log('Payment required for AI features');
          // Paywall modal will be shown by AI gating hook
          return;
        }
        
        console.error('Failed to generate summary:', result.error);
        alert(summaryTexts?.improveError || 'Unable to generate summary. Please try again.');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert(summaryTexts?.improveError || 'Unable to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImproveSummary = async () => {
    // Use the safeContent already calculated at component top
    if (!safeContent.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Execute AI feature with credit gating
      const result = await executeAIFeature(
        AIFeature.SUMMARY_IMPROVE,
        async () => {
          const aiResult = await aiService.improveSummary({
            content: safeContent,
            sectionType: 'summary',
            context: { 
              workExperience: cvData?.experience?.items || [],
              skills: cvData?.skills?.items || [],
              targetJob: cvData?.targetJobDescription || ''
            }
          });

          if (!aiResult.success || !aiResult.data) {
            throw new Error(aiResult.error || 'Failed to improve summary');
          }
          
          return aiResult.data;
        }
      );

      if (result.success && result.data) {
        handleChange(result.data);
        // Mark AI as used for score calculation (will be implemented)
        // markAIUsed('summary');
      } else {
        if (result.needsLogin) {
          console.log('Login required for AI features');
          // Login modal will be shown by AI gating hook
          return;
        }
        if (result.needsPayment) {
          console.log('Payment required for AI features');
          // Paywall modal will be shown by AI gating hook
          return;
        }
        
        console.error('Failed to improve summary:', result.error);
        alert(summaryTexts?.improveError || 'Unable to improve summary. Please try again.');
      }
    } catch (error) {
      console.error('Error improving summary:', error);
      alert(summaryTexts?.improveError || 'Unable to improve summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if work experience exists
  const hasWorkExperience = cvData?.experience?.items?.length > 0 && 
    cvData.experience.items.some((item: any) => item.title || item.company);
  
  const isEmpty = !safeContent.trim();
  const shouldShowGuidance = isEmpty && !hasWorkExperience;

  const handleNavigateToExperience = () => {
    if (onNavigateToSection) {
      onNavigateToSection('experience');
    }
  };

  // Guidance banner for empty state - Product Spec implementation
  if (shouldShowGuidance) {
    return (
      <div className="space-y-4">
        <div className="bg-primary-50 border border-primary-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-primary-500 text-lg">💡</div>
            <div className="flex-1">
              <h4 className="font-medium text-primary-700 mb-1">
                {summaryTexts?.emptyState?.title || 'Start easier!'}
              </h4>
              <p className="text-sm text-primary-500 mb-3">
                {summaryTexts?.emptyState?.description || 'Begin with work experience so AI can help write a better summary'}
              </p>
              <button
                onClick={handleNavigateToExperience}
                className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
              >
                {summaryTexts?.emptyState?.navigateButton || 'Go to Work Experience'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center py-3 text-gray-500">
          <p className="text-sm">
            {summaryTexts?.emptyState?.orAlternative || 'Or you can write a summary directly'}
          </p>
        </div>
        
        <PDFPreviewTextarea 
          className="w-full p-3 border border-gray-300 rounded-md min-h-[120px] resize-none transition-colors focus:border-primary-500 focus:ring-primary-500"
          value={safeContent} 
          onChange={(e) => handleChange(e.target.value)}
          placeholder={summaryTexts?.placeholderSimple || 'Write a summary about your experience and career goals...'}
          pdfPreview={pdfPreview}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simplified guidance text */}
      <p className="text-sm text-gray-600">
        {summaryTexts?.guidance || 'Write 2-4 concise & energetic sentences to capture attention! Present your role, experience & most importantly - biggest achievements, best skills and qualities.'}
      </p>

      {/* Summary textarea */}
      <div className="relative">
        <PDFPreviewTextarea 
          className="w-full p-3 border border-gray-300 rounded-md min-h-[120px] resize-none transition-colors focus:border-primary-500 focus:ring-primary-500"
          value={safeContent} 
          onChange={(e) => handleChange(e.target.value)}
          placeholder={summaryTexts?.placeholder || 'Brief summary of your experience and career objectives...'}
          disabled={isGenerating}
          pdfPreview={pdfPreview}
        />
        {isGenerating && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-md">
            <div className="flex items-center gap-2 text-primary-500">
              <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
              <span className="text-sm">{summaryTexts?.generating || 'Generating content...'}</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Action buttons */}
      <div className="flex gap-2">
        {isEmpty ? (
          <AIAssistButton 
            label={summaryTexts?.generateWithAI || 'Generate Summary with AI'} 
            onClick={handleGenerateSummary}
            disabled={isGenerating || isCheckingAccess}
          />
        ) : (
          <AIAssistButton 
            label={summaryTexts?.aiImprove || 'Improve Summary'} 
            onClick={handleImproveSummary}
            disabled={isGenerating || isCheckingAccess}
          />
        )}
      </div>
    </div>
  );
};