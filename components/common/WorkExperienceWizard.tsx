import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, ArrowLeftIcon, ArrowRightIcon, CalendarIcon, BuildingIcon, UserIcon, MapPinIcon, SparklesIcon } from 'lucide-react';

interface WorkExperienceWizardProps {
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
}

interface WizardData {
  // Basic Info Steps
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  
  // AI Bullet Wizard Steps
  project: string;
  impact: string;
  responsibility: string;
}

interface ValidationErrors {
  title?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  project?: string;
  impact?: string;
}

export const WorkExperienceWizard: React.FC<WorkExperienceWizardProps> = ({
  isOpen,
  onClose,
  onSave,
  isGenerating
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardData>({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    current: false,
    location: '',
    project: '',
    impact: '',
    responsibility: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isComposing, setIsComposing] = useState(false);

  // Total steps: 2 basic info + 3 AI wizard = 5 steps
  const TOTAL_STEPS = 5;
  const BASIC_INFO_STEPS = 2;
  const AI_WIZARD_STEPS = 3;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        current: false,
        location: '',
        project: '',
        impact: '',
        responsibility: ''
      });
      setErrors({});
      setIsComposing(false); // Reset composition state
    }
  }, [isOpen]);

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Clear any errors when going back
      setErrors({});
    }
  };



  const handleFinish = () => {
    const newExperience: WorkExperienceData & {
      project?: string;
      impact?: string;
      responsibility?: string;
    } = {
      id: `exp-${Date.now()}`,
      title: formData.title,
      company: formData.company,
      location: '', // Default empty since location step is removed
      startDate: '', // Default empty since date step is removed
      endDate: '', // Default empty since date step is removed
      current: false, // Default false since date step is removed
      bullets: [], // Will be filled by AI
      aiGenerated: true,
      project: formData.project,
      impact: formData.impact,
      responsibility: formData.responsibility
    };

    onSave(newExperience);
  };

  const handleInputChange = (field: keyof WizardData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle IME composition events for Vietnamese input
  const handleCompositionStart = () => {
    setIsComposing(true);
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Composition started');
    }
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Composition ended');
    }
  };

  // Fallback to reset composition state if it gets stuck
  const handleInputBlur = () => {
    if (isComposing) {
      setIsComposing(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Force reset composition state on blur');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Add debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 KeyDown Debug:', {
        key: e.key,
        isComposing,
        nativeIsComposing: e.nativeEvent?.isComposing,
        canProceed: canProceed(),
        currentStep
      });
    }

    // Only block during active IME composition (Vietnamese input)
    // Be more conservative - only block if we're actually composing
    if (e.nativeEvent?.isComposing || e.key === 'Process') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 Blocked due to IME composition');
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Only add delay if we were recently composing or have Vietnamese characters
      const hasVietnameseChars = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(e.currentTarget.value);
      const delay = (isComposing || hasVietnameseChars) ? 50 : 0;
      
      setTimeout(() => {
        // If on the last step, trigger finish
        if (currentStep === TOTAL_STEPS) {
          if (canGenerate() && !isGenerating) {
            handleFinish();
          }
        }
        // Otherwise, try to go to next step
        else if (canProceed() && !isGenerating) {
          handleNext();
        }
      }, delay);
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: ValidationErrors = {};

    switch (currentStep) {
      case 1: // Job Title
        if (!formData.title.trim()) {
          newErrors.title = 'Vui lòng nhập chức danh công việc';
        }
        break;
      case 2: // Company
        if (!formData.company.trim()) {
          newErrors.company = 'Vui lòng nhập tên công ty';
        }
        break;
      case 3: // Project/Responsibility
        if (!formData.project.trim()) {
          newErrors.project = 'Vui lòng mô tả dự án hoặc trách nhiệm chính';
        }
        break;
      case 4: // Result/Impact
        if (!formData.impact.trim()) {
          newErrors.impact = 'Vui lòng mô tả kết quả hoặc tác động';
        }
        break;
      case 5: // Role Context (optional - no validation needed)
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceed = (): boolean => {
    // Only block progression if we're actively composing (less restrictive)
    // Check native composition state rather than our state which might be stale
    
    switch (currentStep) {
      case 1:
        return formData.title.trim().length > 0;
      case 2:
        return formData.company.trim().length > 0;
      case 3:
        return formData.project.trim().length > 0;
      case 4:
        return formData.impact.trim().length > 0;
      case 5:
        return true; // Responsibility is optional
      default:
        return false;
    }
  };

  const canGenerate = (): boolean => {
    return formData.project.trim().length > 0 && formData.impact.trim().length > 0;
  };

  const handleClose = () => {
    onClose();
  };

  const handleCancel = () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy? Tất cả thông tin đã nhập sẽ bị mất.')) {
      onClose();
    }
  };

  const getStepTitle = (): string => {
    switch (currentStep) {
      case 1: return 'Chức danh công việc';
      case 2: return 'Công ty tuyển dụng';
      case 3: return 'Dự án/Công việc chính';
      case 4: return 'Tác động/Kết quả';
      case 5: return 'Vai trò/Trách nhiệm';
      default: return '';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return <UserIcon size={20} className="text-primary-500" />;
      case 2: return <BuildingIcon size={20} className="text-primary-500" />;
      case 3:
      case 4:
      case 5: return <SparklesIcon size={20} className="text-primary-500" />;
      default: return null;
    }
  };

  const isAIStep = currentStep > BASIC_INFO_STEPS;

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]"
      data-testid="wizard-backdrop"
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-label="Thêm kinh nghiệm làm việc"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {getStepIcon()}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isAIStep ? 'Tạo mô tả công việc AI' : 'Thêm kinh nghiệm làm việc'}
              </h2>
              <p className="text-sm text-gray-500">{getStepTitle()}</p>
            </div>
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

        {/* Progress Indicator */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              Bước {currentStep} / {TOTAL_STEPS}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index + 1 === currentStep
                      ? 'bg-primary-500'
                      : index + 1 < currentStep
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
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-4">
          {/* Step 1: Job Title */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Chức danh công việc của bạn là gì?
              </h3>
                             <input
                 type="text"
                 value={formData.title}
                 onChange={(e) => handleInputChange('title', e.target.value)}
                 onKeyDown={handleKeyDown}
                 onCompositionStart={handleCompositionStart}
                 onCompositionEnd={handleCompositionEnd}
                 onBlur={handleInputBlur}
                 placeholder="Ví dụ: Chuyên viên kinh doanh, Software Engineer..."
                 className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                   errors.title ? 'border-red-500' : 'border-gray-300'
                 }`}
                 disabled={isGenerating}
                 autoFocus
               />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Nhập chính xác chức danh để AI có thể tạo mô tả phù hợp nhất.
              </p>
            </div>
          )}

          {/* Step 2: Company */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Tên công ty hoặc tổ chức?
              </h3>
                             <input
                 type="text"
                 value={formData.company}
                 onChange={(e) => handleInputChange('company', e.target.value)}
                 onKeyDown={handleKeyDown}
                 onCompositionStart={handleCompositionStart}
                 onCompositionEnd={handleCompositionEnd}
                 onBlur={handleInputBlur}
                 placeholder="Ví dụ: Công ty cổ phần ABC, Ngân hàng XYZ..."
                 className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                   errors.company ? 'border-red-500' : 'border-gray-300'
                 }`}
                 disabled={isGenerating}
                 autoFocus
               />
              {errors.company && (
                <p className="text-red-500 text-sm mt-1">{errors.company}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                AI sẽ sử dụng thông tin này để tạo mô tả công việc phù hợp với ngành nghề.
              </p>
            </div>
          )}

          {/* Step 3: Project/Responsibility */}
          {currentStep === 3 && (
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
                 className={`w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                   errors.project ? 'border-red-500' : 'border-gray-300'
                 }`}
                 disabled={isGenerating}
                 autoFocus
               />
              {errors.project && (
                <p className="text-red-500 text-sm mt-1">{errors.project}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Mô tả ngắn gọn một dự án, nhiệm vụ hoặc trách nhiệm quan trọng bạn đã đảm nhận.
              </p>
            </div>
          )}

          {/* Step 4: Result/Impact */}
          {currentStep === 4 && (
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
                 className={`w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                   errors.impact ? 'border-red-500' : 'border-gray-300'
                 }`}
                 disabled={isGenerating}
                 autoFocus
               />
              {errors.impact && (
                <p className="text-red-500 text-sm mt-1">{errors.impact}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Mô tả kết quả cụ thể, có thể là con số, cải thiện quy trình, hoặc lợi ích mang lại.
              </p>
            </div>
          )}

          {/* Step 5: Role Context */}
          {currentStep === 5 && (
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
              onClick={handleCancel}
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

          {currentStep < TOTAL_STEPS ? (
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
              onClick={handleFinish}
              disabled={!canGenerate() || isGenerating}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <SparklesIcon size={16} />
                  Tạo với AI
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}; 