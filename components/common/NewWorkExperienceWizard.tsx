import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from 'lucide-react';
import { WizardStep } from './WizardStep';
import { AIPreview } from './AIPreview';
import { filterJobTitles } from '../../utils/jobTitleSuggestions';
import { getTexts } from '../../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../../config/languageConfig';

interface NewWorkExperienceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WorkExperienceData) => void;
  isGenerating: boolean;
}

interface WorkExperienceData {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  aiGenerated: boolean;
  // AI wizard data
  project?: string;
  impact?: string;
  responsibility?: string;
}

interface WizardFormData {
  title: string;
  company: string;
  project: string;
  impact: string;
}

export const NewWorkExperienceWizard: React.FC<NewWorkExperienceWizardProps> = ({
  isOpen,
  onClose,
  onSave,
  isGenerating
}) => {
  console.log('🚀 WIZARD DEBUG: NewWorkExperienceWizard render - isOpen:', isOpen, 'at', performance.now());
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({
    title: '',
    company: '',
    project: '',
    impact: ''
  });
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [filteredTitles, setFilteredTitles] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>('vi');
  const [texts, setTexts] = useState<any>({});
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-save key for localStorage
  const AUTOSAVE_KEY = 'okbuddy_work_experience_wizard_draft';

  // Check if form has data
  const hasFormData = useCallback(() => {
    return formData.title.trim() || formData.company.trim() || formData.project.trim() || formData.impact.trim();
  }, [formData]);

  // REMOVED: Auto-save effect that was causing cascade re-renders
  // Auto-save will be handled manually on form changes instead

  // SIMPLIFIED: Load saved data when modal opens - remove cascade triggers
  useEffect(() => {
    if (isOpen) {
      const savedData = localStorage.getItem(AUTOSAVE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Only restore if saved within last 24 hours
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            // Batch all state updates together to prevent cascade re-renders
            setFormData({
              title: parsed.title || '',
              company: parsed.company || '',
              project: parsed.project || '',
              impact: parsed.impact || ''
            });
            // Always start at step 1 for simplicity
          } else {
            localStorage.removeItem(AUTOSAVE_KEY);
          }
        } catch (error) {
          localStorage.removeItem(AUTOSAVE_KEY);
        }
      }
    }
  }, [isOpen]); // REMOVED language dependency

  // Enhanced close handler with polished confirmation
  const handleClose = useCallback(() => {
    if (hasFormData()) {
      const newWizardTexts = texts.newWizard || {};
      const confirmationsTexts = newWizardTexts.confirmations || {};
      const message = confirmationsTexts.closeWithProgress || 'Are you sure you want to close this? Your current progress will be saved.';
      
      if (window.confirm(message)) {
        // Set a flag to prevent auto-triggering wizard after manual close
        localStorage.setItem('okbuddy_wizard_manually_closed', Date.now().toString());
        
        // Auto-save as incomplete work experience when user has entered data
        const incompleteExperience: WorkExperienceData = {
          id: `exp-${Date.now()}`,
          title: formData.title || 'Untitled Position',
          company: formData.company || 'Company Name',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          bullets: [''], // Empty bullet to show it needs completion
          aiGenerated: false, // Mark as manual since it's incomplete
          project: formData.project,
          impact: formData.impact,
          responsibility: ''
        };
        
        // Clear auto-saved data since we're creating the actual entry
        localStorage.removeItem(AUTOSAVE_KEY);
        
        // Auto-save the incomplete experience
        onSave(incompleteExperience);
        onClose();
      }
    } else {
      // Clear auto-save if no data
      localStorage.removeItem(AUTOSAVE_KEY);
      onClose();
    }
  }, [hasFormData, texts, onClose, onSave, formData]);

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

  // OPTIMIZED: Load texts once when component mounts
  useEffect(() => {
    const loadTexts = async () => {
      console.log('🚀 WIZARD DEBUG: Starting text loading at', performance.now());
      const detectedLanguage = detectLanguage();
      // Batch state updates to prevent re-renders
      const textData = await getTexts('workExperienceWizard', detectedLanguage.language);
      console.log('🚀 WIZARD DEBUG: Text loading completed at', performance.now());
      
      // Single state update instead of multiple
      setLanguage(detectedLanguage.language);
      setTexts(textData || {});
    };
    loadTexts();
  }, []); // Run only once on mount

  // Initialize job title suggestions
  useEffect(() => {
    setFilteredTitles(filterJobTitles('', 3));
  }, []);

  // OPTIMIZED: Reset form when modal closes - batch all state updates
  useEffect(() => {
    console.log('🚀 WIZARD DEBUG: Reset effect triggered - isOpen:', isOpen, 'at', performance.now());
    if (!isOpen) {
      console.log('🚀 WIZARD DEBUG: Resetting form state - wizard closing');
      // Batch all state resets in a single update cycle
      setCurrentStep(1);
      setFormData({ title: '', company: '', project: '', impact: '' });
      setShowAIPreview(false);
      setAiGenerating(false);
      setIsTyping(false);
    } else {
      console.log('🚀 WIZARD DEBUG: Wizard opening - clearing manual close flag');
      localStorage.removeItem('okbuddy_wizard_manually_closed');
    }
  }, [isOpen]);

  // Show AI preview immediately when wizard opens to prevent render delay
  useEffect(() => {
    console.log('🚀 WIZARD DEBUG: AI Preview effect triggered - isOpen:', isOpen, 'at', performance.now());
    if (isOpen) {
      console.log('🚀 WIZARD DEBUG: Setting showAIPreview to true and aiGenerating to false');
      // Show AI preview immediately when wizard opens
      setShowAIPreview(true);
      setAiGenerating(false);
    } else {
      console.log('🚀 WIZARD DEBUG: Setting showAIPreview to false');
      setShowAIPreview(false);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle Enter key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (canProceed()) {
        handleNext();
      }
    }
  };

  const handleFinish = () => {
    const newExperience: WorkExperienceData = {
      id: `exp-${Date.now()}`,
      title: formData.title,
      company: formData.company,
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [],
      aiGenerated: true,
      project: formData.project,
      impact: formData.impact,
      responsibility: ''
    };

    // Clear auto-saved data on successful save
    localStorage.removeItem(AUTOSAVE_KEY);
    onSave(newExperience);
  };

  const updateData = (field: keyof WizardFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleJobTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateData('title', value);
    setFilteredTitles(filterJobTitles(value, 3));
    setIsTyping(true);
  };

  const selectJobTitle = (title: string) => {
    updateData('title', title);
    setIsTyping(false);
    setFilteredTitles([]); // Hide suggestions after selection
    setHasSelectedSuggestion(true); // Mark that user has selected a suggestion
  };

  const canProceed = () => {
    return formData.title.trim() && formData.company.trim();
  };

  if (!isOpen) {
    console.log('🚀 WIZARD DEBUG: Wizard not open - returning null');
    return null;
  }

  console.log('🚀 WIZARD DEBUG: Wizard is open - preparing to render at', performance.now());

  const isVietnamese = language === 'vi';
  const newWizardTexts = texts.newWizard || {};
  const fieldsTexts = newWizardTexts.fields || {};
  const buttonsTexts = newWizardTexts.buttons || {};
  const aiBadgeTexts = newWizardTexts.aiBadge || {};
  const progressTexts = newWizardTexts.progress || {};

  console.log('🚀 WIZARD DEBUG: Creating portal for wizard at', performance.now());

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
                {newWizardTexts.modalTitle || 'Thêm kinh nghiệm làm việc'}
              </h2>

            </div>
          </div>
          <button 
            onClick={handleClose} 
            disabled={isGenerating}
            className={`${
              isGenerating 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
                    {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {fieldsTexts.jobTitle?.label || 'Chức danh công việc của bạn là gì?'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={handleJobTitleChange}
                      placeholder={fieldsTexts.jobTitle?.placeholder || 'Ví dụ: Software Engineer, Marketing Manager...'}
                      disabled={isGenerating}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD] ${
                        isGenerating ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                                               {isTyping && formData.title && filteredTitles.length > 0 && (
                             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                               {filteredTitles.map((title, index) => (
                                 <div
                                   key={index}
                                   onClick={() => selectJobTitle(title)}
                                   className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                 >
                                   {title}
                                 </div>
                               ))}
                             </div>
                           )}
                  </div>
                  {!hasSelectedSuggestion && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {filterJobTitles('', 3).map((title, index) => (
                        <button
                          key={index}
                          onClick={() => selectJobTitle(title)}
                          className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-[#0277BD] rounded-full text-sm hover:bg-blue-100"
                        >
                          <span>+</span> {title}
                        </button>
                      ))}
                    </div>
                  )}

                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {fieldsTexts.company?.label || 'Tên công ty hoặc tổ chức?'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => updateData('company', e.target.value)}
                    placeholder=""
                    disabled={isGenerating}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD] ${
                      isGenerating ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              {/* AI Preview Section - Show immediately to prevent render delay */}
              {(() => {
                console.log('🚀 WIZARD DEBUG: AI Preview condition check - showAIPreview:', showAIPreview, 'at', performance.now());
                return showAIPreview && (
                  <div className="mb-6">
                    <AIPreview
                      jobTitle={formData.title || (isVietnamese ? 'Kỹ sư phần mềm' : 'Software Engineer')}
                      company={formData.company || (isVietnamese ? 'Công ty ABC' : 'ABC Company')}
                      project={formData.project}
                      impact={formData.impact}
                      isLoading={aiGenerating}
                      showPreview={showAIPreview}
                      isEnhanced={!!(formData.project || formData.impact)}
                      language={language}
                      previewTitle={texts.newWizard?.aiPreview?.title || (isVietnamese ? 'OkBuddy giúp bạn viết CV nhanh chóng' : 'How OkBuddy writes your resume')}
                      previewSubtitle={texts.newWizard?.aiPreview?.subtitle}
                    />
                  </div>
                );
              })()}
              
              <WizardStep 
                title={newWizardTexts.steps?.optionalDetails?.title || 'Thêm chi tiết (tùy chọn)'}
                description={newWizardTexts.steps?.optionalDetails?.description || ''}
                showAIBadge={false}
                aiBadgeTitle={aiBadgeTexts.title}
                aiBadgeDescription={aiBadgeTexts.description}
              >
              <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 mb-6 mt-3">
                <p className="text-sm text-yellow-800">
                  {newWizardTexts.tips?.shortInput || 'Chỉ cần nhập 3-5 từ cho mỗi mục và để AI hoàn thiện phần còn lại!'}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {fieldsTexts.project?.label || 'Dự án hoặc trách nhiệm chính'}
                  </label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => updateData('project', e.target.value)}
                    placeholder={fieldsTexts.project?.placeholder || 'Ví dụ: Ứng dụng di động, Chiến dịch marketing...'}
                    disabled={isGenerating}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD] ${
                      isGenerating ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {fieldsTexts.impact?.label || 'Kết quả hoặc tác động'}
                  </label>
                  <input
                    type="text"
                    value={formData.impact}
                    onChange={(e) => updateData('impact', e.target.value)}
                    placeholder={fieldsTexts.impact?.placeholder || 'Ví dụ: Tăng doanh thu 30%, Giảm chi phí...'}
                    disabled={isGenerating}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD] ${
                      isGenerating ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
              </WizardStep>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                isGenerating 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>{buttonsTexts.back || 'Quay lại'}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              disabled={isGenerating}
              className={`px-4 py-2 rounded-md ${
                isGenerating 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {buttonsTexts.cancel || 'Hủy'}
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              !canProceed() || isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#0277BD] text-white hover:bg-blue-700'
            }`}
          >
            {currentStep === 2 ? (
              isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>{buttonsTexts.generating || 'Đang tạo...'}</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  <span>{buttonsTexts.saveWithAI || 'Add Work Experience'}</span>
                </>
              )
            ) : (
              <>
                <span>{buttonsTexts.next || 'Tiếp theo'}</span>
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
