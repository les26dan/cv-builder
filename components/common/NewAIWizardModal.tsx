import React, { useState, useEffect } from 'react';
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
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-md">
              <SparklesIcon className="h-5 w-5 text-[#0277BD]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {addBulletTexts.modalTitle || 'Tạo mô tả công việc nhanh'}
              </h2>
              <p className="text-gray-500 text-sm">
                {addBulletTexts.subtitle || 'Chức danh công việc'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <WizardStep 
            title={newWizardTexts.steps?.optionalDetails?.title || 'Thêm chi tiết (tùy chọn)'}
            description={newWizardTexts.steps?.optionalDetails?.description || 'Bổ sung thông tin để AI tạo mô tả công việc chi tiết và ấn tượng hơn.'}
            showAIBadge={true}
            aiBadgeTitle={aiBadgeTexts.title}
            aiBadgeDescription={aiBadgeTexts.description}
          >
            <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                {tipsTexts.shortInput || 'Chỉ cần nhập 3-5 từ cho mỗi mục và để AI hoàn thiện phần còn lại!'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                  <span>{fieldsTexts.project?.label || 'Dự án hoặc trách nhiệm chính'}</span>
                  <span className="text-xs text-gray-500">{tipsTexts.wordCount || '3-5 từ là đủ'}</span>
                </label>
                <input
                  type="text"
                  value={formData.project}
                  onChange={(e) => handleInputChange('project', e.target.value)}
                  placeholder={fieldsTexts.project?.placeholder || 'Ví dụ: Ứng dụng di động, Chiến dịch marketing...'}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                  <span>{fieldsTexts.impact?.label || 'Kết quả hoặc tác động'}</span>
                  <span className="text-xs text-gray-500">{tipsTexts.wordCount || '3-5 từ là đủ'}</span>
                </label>
                <input
                  type="text"
                  value={formData.impact}
                  onChange={(e) => handleInputChange('impact', e.target.value)}
                  placeholder={fieldsTexts.impact?.placeholder || 'Ví dụ: Tăng doanh thu 30%, Giảm chi phí...'}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0277BD]"
                />
              </div>
            </div>
          </WizardStep>

          {/* AI Preview Section */}
          {jobTitle && company && (
            <div className="mt-6">
              <AIPreview
                jobTitle={jobTitle}
                company={company}
                project={formData.project}
                impact={formData.impact}
                isLoading={aiGenerating}
                showPreview={showAIPreview}
                isEnhanced={!!(formData.project || formData.impact)}
                language={language}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={onClose}
            className="text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100"
          >
            {buttonsTexts.cancel || 'Hủy'}
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
            <SparklesIcon className="h-4 w-4" />
            <span>{isGenerating ? (buttonsTexts.generating || 'Đang tạo...') : (buttonsTexts.generate || 'Được tạo bởi AI')}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
