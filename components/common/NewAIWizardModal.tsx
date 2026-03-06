import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, SparklesIcon } from 'lucide-react';
import { WizardStep } from './WizardStep';
import { AIPreview } from './AIPreview';
import { getTexts } from '../../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../../config/languageConfig';

interface NewAIWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: WizardData) => void;
  jobTitle: string;
  company: string;
  isGenerating: boolean;
}

interface WizardData {
  project: string;
  impact: string;
  responsibility?: string;
}

export const NewAIWizardModal: React.FC<NewAIWizardModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  jobTitle,
  company,
  isGenerating
}) => {
  const [formData, setFormData] = useState<WizardData>({
    project: '',
    impact: '',
    responsibility: ''
  });
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>('vi');
  const [texts, setTexts] = useState<any>({});
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-save key for localStorage
  const AUTOSAVE_KEY = 'okbuddy_ai_wizard_modal_draft';

  // Check if form has data
  const hasFormData = useCallback(() => {
    return formData.project.trim() || formData.impact.trim() || formData.responsibility?.trim();
  }, [formData]);

  // Auto-save to localStorage whenever form data changes
  useEffect(() => {
    if (hasFormData()) {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
        ...formData,
        timestamp: Date.now()
      }));
    }
  }, [formData, hasFormData]);

  // Load auto-saved data when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedData = localStorage.getItem(AUTOSAVE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Only restore if saved within last 24 hours
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            // Show recovery option to user
            const isVietnamese = language === 'vi';
            const message = isVietnamese 
              ? 'Bạn có dữ liệu đã lưu từ lần trước. Bạn có muốn khôi phục không?\n\n✅ Có - Khôi phục dữ liệu\n❌ Không - Bắt đầu mới'
              : 'You have saved data from previous session. Would you like to recover it?\n\n✅ Yes - Recover data\n❌ No - Start fresh';
            
            if (window.confirm(message)) {
              // User wants to recover - restore data
              setFormData({
                project: parsed.project || '',
                impact: parsed.impact || '',
                responsibility: parsed.responsibility || ''
              });
            } else {
              // User wants fresh start - clear auto-saved data
              localStorage.removeItem(AUTOSAVE_KEY);
              setFormData({
                project: '',
                impact: '',
                responsibility: ''
              });
            }
          } else {
            // Expired data - clean up
            localStorage.removeItem(AUTOSAVE_KEY);
          }
        } catch (error) {
          console.error('Failed to parse auto-saved data:', error);
          localStorage.removeItem(AUTOSAVE_KEY);
        }
      }
    }
  }, [isOpen, language]);

  // Enhanced close handler with polished confirmation
  const handleClose = useCallback(() => {
    if (hasFormData()) {
      const newWizardTexts = texts.newWizard || {};
      const confirmationsTexts = newWizardTexts.confirmations || {};
      const message = confirmationsTexts.closeWithProgress || 'Are you sure you want to close this? Your current progress will be saved.';
      
      if (window.confirm(message)) {
        // Just close - auto-save is already handled by useEffect
        // Data will be available for recovery next time
        onClose();
      }
    } else {
      // No data to save, just close
      onClose();
    }
  }, [hasFormData, texts, onClose]);

  // Handle Esc key and click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, handleClose]);

  // Load language-specific texts
  useEffect(() => {
    const loadTexts = async () => {
      const detectedLanguage = detectLanguage();
      setLanguage(detectedLanguage.language);
      const textData = await getTexts('workExperienceWizard', detectedLanguage.language);
      setTexts(textData || {});
    };
    loadTexts();
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        project: '',
        impact: '',
        responsibility: ''
      });
      setShowAIPreview(false);
      setAiGenerating(false);
    }
  }, [isOpen]);

  // Show AI preview when basic data is available
  useEffect(() => {
    if (jobTitle && company && isOpen) {
      if (!showAIPreview) {
        setAiGenerating(true);
        setTimeout(() => {
          setAiGenerating(false);
          setShowAIPreview(true);
        }, 800);
      }
    } else {
      setShowAIPreview(false);
    }
  }, [jobTitle, company, isOpen, formData.project, formData.impact]);

  const handleGenerate = () => {
    // Clear auto-saved data on successful generation
    localStorage.removeItem(AUTOSAVE_KEY);
    onGenerate(formData);
  };

  // Handle Enter key navigation to trigger generation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (canGenerate()) {
        handleGenerate();
      }
    }
  };

  const handleInputChange = (field: keyof WizardData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const canGenerate = () => {
    return formData.project.trim().length > 0 || formData.impact.trim().length > 0;
  };

  if (!isOpen) return null;

  const isVietnamese = language === 'vi';
  const newWizardTexts = texts.newWizard || {};
  const addBulletTexts = newWizardTexts.addBulletWizard || {};
  const fieldsTexts = newWizardTexts.fields || {};
  const buttonsTexts = newWizardTexts.buttons || {};
  const tipsTexts = newWizardTexts.tips || {};
  const aiBadgeTexts = newWizardTexts.aiBadge || {};

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-md">
              <SparklesIcon className="h-6 w-6 text-[#0277BD]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {addBulletTexts.modalTitle}
              </h2>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* AI Preview Section - Show first */}
          {jobTitle && company && (
            <div className="mb-6">
              <AIPreview
                jobTitle={jobTitle}
                company={company}
                project={formData.project}
                impact={formData.impact}
                isLoading={aiGenerating}
                showPreview={showAIPreview}
                isEnhanced={!!(formData.project || formData.impact)}
                language={language}
                previewTitle={texts.newWizard?.aiPreview?.title}
                previewSubtitle={texts.newWizard?.aiPreview?.subtitle}
              />
            </div>
          )}

          <WizardStep 
            title={newWizardTexts.steps?.optionalDetails?.title}
            description={newWizardTexts.steps?.optionalDetails?.description || ''}
            showAIBadge={false}
            aiBadgeTitle={aiBadgeTexts.title}
            aiBadgeDescription={aiBadgeTexts.description}
          >
            <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 mb-6 mt-3">
              <p className="text-sm text-yellow-800">
                {tipsTexts.shortInput}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {fieldsTexts.project?.label}
                </label>
                <input
                  type="text"
                  value={formData.project}
                  onChange={(e) => handleInputChange('project', e.target.value)}
                  placeholder={fieldsTexts.project?.placeholder}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {fieldsTexts.impact?.label}
                </label>
                <input
                  type="text"
                  value={formData.impact}
                  onChange={(e) => handleInputChange('impact', e.target.value)}
                  placeholder={fieldsTexts.impact?.placeholder}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
                />
              </div>
            </div>
          </WizardStep>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={onClose}
            className="text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100"
          >
            {buttonsTexts.cancel}
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#0277BD] text-white hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <SparklesIcon className="h-4 w-4" />
            )}
            <span>{isGenerating ? buttonsTexts.generating : (addBulletTexts.buttonText || buttonsTexts.generate)}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
