import React, { useState, useEffect } from 'react';
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

  // Initialize job title suggestions
  useEffect(() => {
    setFilteredTitles(filterJobTitles('', 3));
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({
        title: '',
        company: '',
        project: '',
        impact: ''
      });
      setShowAIPreview(false);
      setAiGenerating(false);
      setIsTyping(false);
    }
  }, [isOpen]);

  // Show AI preview after basic info is entered
  useEffect(() => {
    if (formData.title && formData.company && currentStep >= 1) {
      if (!showAIPreview) {
        setAiGenerating(true);
        setTimeout(() => {
          setAiGenerating(false);
          setShowAIPreview(true);
        }, 1000);
      }
    } else {
      setShowAIPreview(false);
    }
  }, [formData.title, formData.company, currentStep]);

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

  if (!isOpen) return null;

  const isVietnamese = language === 'vi';
  const newWizardTexts = texts.newWizard || {};
  const fieldsTexts = newWizardTexts.fields || {};
  const buttonsTexts = newWizardTexts.buttons || {};
  const aiBadgeTexts = newWizardTexts.aiBadge || {};
  const progressTexts = newWizardTexts.progress || {};

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
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
              <div className="mt-1">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <span>{progressTexts.step || 'Bước'} {currentStep} {progressTexts.of || '/'} 2</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#0277BD] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 2) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              {/* AI Preview Section - Show first */}
              {formData.title && formData.company && (
                <div className="mb-6">
                  <AIPreview
                    jobTitle={formData.title}
                    company={formData.company}
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
              )}
              
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
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
              className="flex items-center gap-2 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>{buttonsTexts.back || 'Quay lại'}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100"
            >
              {buttonsTexts.cancel || 'Hủy'}
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              !canProceed()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#0277BD] text-white hover:bg-blue-700'
            }`}
          >
            {currentStep === 2 ? (
              <>
                <SparklesIcon className="h-4 w-4" />
                <span>{buttonsTexts.saveWithAI || 'Tạo với AI'}</span>
              </>
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
