import React, { useState, useEffect } from 'react';
import { XIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';

interface AIWizardModalProps {
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

export const AIWizardModal: React.FC<AIWizardModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  jobTitle,
  company,
  isGenerating
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardData>({
    project: '',
    impact: '',
    responsibility: ''
  });
  const [isComposing, setIsComposing] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({
        project: '',
        impact: '',
        responsibility: ''
      });
      setIsComposing(false); // Reset composition state
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = () => {
    onGenerate(formData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.project.trim().length > 0;
      case 2:
        return formData.impact.trim().length > 0;
      case 3:
        return true; // Responsibility is optional
      default:
        return false;
    }
  };

  const canGenerate = () => {
    return formData.project.trim().length > 0 && formData.impact.trim().length > 0;
  };

  const handleInputChange = (field: keyof WizardData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({ project: '', impact: '', responsibility: '' });
    onClose();
  };

  // Handle IME composition events for Vietnamese input
  const handleCompositionStart = () => {
    setIsComposing(true);
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 AIWizard: Composition started');
    }
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ AIWizard: Composition ended');
    }
  };

  // Fallback to reset composition state if it gets stuck
  const handleInputBlur = () => {
    if (isComposing) {
      setIsComposing(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 AIWizard: Force reset composition state on blur');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Add debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AIWizard KeyDown Debug:', {
        key: e.key,
        isComposing,
        nativeIsComposing: e.nativeEvent?.isComposing,
        canProceed: canProceed(),
        currentStep
      });
    }

    // Only block during active IME composition (Vietnamese input)
    if (e.nativeEvent?.isComposing || e.key === 'Process') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 AIWizard: Blocked due to IME composition');
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Only add delay if we were recently composing or have Vietnamese characters
      const hasVietnameseChars = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(e.currentTarget.value);
      const delay = (isComposing || hasVietnameseChars) ? 50 : 0;
      
      setTimeout(() => {
        if (currentStep < 3) {
          if (canProceed()) {
            handleNext();
          }
        } else {
          if (canGenerate()) {
            handleGenerate();
          }
        }
      }, delay);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="modal-backdrop"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-label="Tạo mô tả công việc nhanh"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="text-primary-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
              </svg>
            </div>
                          <h2 className="text-lg font-semibold text-gray-900">
                Tạo mô tả công việc nhanh
              </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isGenerating}
            aria-label="Đóng"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Job Context */}
        <div className="px-6 py-4 bg-gray-50">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{jobTitle} tại {company}</span>
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              Bước {currentStep} / 3
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${
                    step === currentStep
                      ? 'bg-primary-500'
                      : step < currentStep
                      ? 'bg-primary-300'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-primary-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-4">
          {currentStep === 1 && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-1">🎯 Tạo mô tả công việc với AI</h4>
                <p className="text-sm text-blue-700">
                  AI sẽ giúp bạn tạo gạch đầu dòng chuyên nghiệp dựa trên thông tin bạn cung cấp.
                </p>
              </div>
              
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Dự án hoặc trách nhiệm chính
              </h3>
              <textarea
                value={formData.project}
                onChange={(e) => handleInputChange('project', e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onBlur={handleInputBlur}
                placeholder="Ví dụ: Phát triển hệ thống CRM mới cho bộ phận kinh doanh"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isGenerating}
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                Mô tả ngắn gọn một dự án, nhiệm vụ hoặc trách nhiệm quan trọng bạn đã đảm nhận.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Kết quả hoặc tác động
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-green-700 font-medium">💡 Mẹo: Sử dụng số liệu cụ thể</p>
                <p className="text-sm text-green-600 mt-1">
                  Ví dụ: "Tăng doanh thu 30%", "Giảm thời gian xử lý 50%", "Quản lý ngân sách 2 tỷ đồng"
                </p>
              </div>
              <textarea
                value={formData.impact}
                onChange={(e) => handleInputChange('impact', e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onBlur={handleInputBlur}
                placeholder="Ví dụ: Tăng hiệu suất bán hàng 25%, giảm thời gian xử lý đơn hàng 40%"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isGenerating}
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                Mô tả kết quả cụ thể, có thể là con số, cải thiện quy trình, hoặc lợi ích mang lại.
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Vai trò và phạm vi trách nhiệm (tùy chọn)
              </h3>
              <textarea
                value={formData.responsibility}
                onChange={(e) => handleInputChange('responsibility', e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onBlur={handleInputBlur}
                placeholder="Ví dụ: Lãnh đạo nhóm 5 người, quản lý ngân sách 500 triệu, phụ trách khu vực miền Nam..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isGenerating}
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                Mô tả vai trò lãnh đạo, phạm vi trách nhiệm hoặc quy mô công việc để AI tạo mô tả toàn diện hơn.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          {currentStep === 1 ? (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isGenerating}
            >
              Hủy
            </button>
          ) : (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isGenerating}
            >
              <ArrowLeftIcon size={16} />
              Quay lại
            </button>
          )}

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed() || isGenerating}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp theo
              <ArrowRightIcon size={16} />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canGenerate() || isGenerating}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Đang tạo...
                </>
              ) : (
                'Tạo gạch đầu dòng'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 