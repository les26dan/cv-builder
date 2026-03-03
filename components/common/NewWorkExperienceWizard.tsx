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
  };

  const canProceed = () => {
    return formData.title.trim() && formData.company.trim();
  };

  if (!isOpen) return null;

  const isVietnamese = language === 'vi';
  const newWizardTexts = texts.newWizard || {};

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-md">
              <SparklesIcon className="h-5 w-5 text-[#0277BD]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {newWizardTexts.modalTitle || 'Thêm kinh nghiệm làm việc'}
              </h2>
              <p className="text-gray-500 text-sm">
                {currentStep === 1 
                  ? (newWizardTexts.subtitles?.basicInfo || 'Thông tin cơ bản')
                  : (newWizardTexts.subtitles?.optionalDetails || 'Thông tin chi tiết (tùy chọn)')
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Bước {currentStep} / 2</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-[#0277BD] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 1 && (
            <WizardStep 
              title={newWizardTexts.steps?.basicInfo?.title || 'Nhập thông tin cơ bản'}
              description={newWizardTexts.steps?.basicInfo?.description || 'AI sẽ tự động tạo mô tả công việc chuyên nghiệp từ thông tin này.'}
              showAIBadge={true}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newWizardTexts.fields?.jobTitle?.label || 'Chức danh công việc của bạn là gì?'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={handleJobTitleChange}
                      placeholder={newWizardTexts.fields?.jobTitle?.placeholder || 'Ví dụ: Software Engineer, Marketing Manager...'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
                    />
                    {isTyping && formData.title && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                        {filteredTitles.length > 0 ? (
                          filteredTitles.map((title, index) => (
                            <div
                              key={index}
                              onClick={() => selectJobTitle(title)}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                            >
                              {title}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            Không tìm thấy kết quả
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                  <p className="text-sm text-gray-500 mt-1">
                    {newWizardTexts.fields?.jobTitle?.helper || 'Nhập chính xác chức danh để AI có thể tạo mô tả phù hợp nhất.'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newWizardTexts.fields?.company?.label || 'Tên công ty hoặc tổ chức?'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => updateData('company', e.target.value)}
                    placeholder={newWizardTexts.fields?.company?.placeholder || 'Ví dụ: Google, Vingroup, FPT Software'}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
                  />
                </div>
              </div>
            </WizardStep>
          )}

          {currentStep === 2 && (
            <WizardStep 
              title={newWizardTexts.steps?.optionalDetails?.title || 'Thêm chi tiết (tùy chọn)'}
              description={newWizardTexts.steps?.optionalDetails?.description || 'Bổ sung thông tin để AI tạo mô tả công việc chi tiết và ấn tượng hơn.'}
              showAIBadge={true}
            >
              <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Mẹo:</strong> {newWizardTexts.tips?.shortInput || 'Chỉ cần nhập 3-5 từ cho mỗi mục và để AI hoàn thiện phần còn lại!'}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>{newWizardTexts.fields?.project?.label || 'Dự án hoặc trách nhiệm chính'}</span>
                    <span className="text-xs text-gray-500">{newWizardTexts.tips?.wordCount || '3-5 từ là đủ'}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => updateData('project', e.target.value)}
                    placeholder={newWizardTexts.fields?.project?.placeholder || 'Ví dụ: Ứng dụng di động, Chiến dịch marketing...'}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>{newWizardTexts.fields?.impact?.label || 'Kết quả hoặc tác động'}</span>
                    <span className="text-xs text-gray-500">{newWizardTexts.tips?.wordCount || '3-5 từ là đủ'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.impact}
                      onChange={(e) => updateData('impact', e.target.value)}
                      placeholder={newWizardTexts.fields?.impact?.placeholder || 'Ví dụ: Tăng doanh thu 30%, Giảm chi phí...'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
                    />
                    <div className="absolute top-0 right-0 h-full flex items-center pr-3">
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {newWizardTexts.fields?.impact?.badge || '+ Điểm mạnh'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </WizardStep>
          )}

          {/* AI Preview Section */}
          {formData.title && formData.company && (
            <div className="mt-6">
              <AIPreview
                jobTitle={formData.title}
                company={formData.company}
                project={formData.project}
                impact={formData.impact}
                isLoading={aiGenerating}
                showPreview={showAIPreview}
                isEnhanced={currentStep === 2 && (!!formData.project || !!formData.impact)}
                language={language}
              />
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
              <span>Quay lại</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100"
            >
              Hủy
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
                <span>Tạo với AI</span>
              </>
            ) : (
              <>
                <span>Tiếp theo</span>
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
