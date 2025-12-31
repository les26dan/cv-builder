import React, { useState } from 'react';
import { AIAssistButton } from '../common/AIAssistButton';
import { PlusIcon, GripVerticalIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface EducationSectionProps {
  data: {
    items: Array<{
      id: string;
      degree: string;
      institution: string;
      location?: string;
      graduationDate: string;
      description?: string;
    }>;
  };
  onUpdate: (data: any) => void;
  isActive: boolean;
}

export const EducationSection = ({
  data,
  onUpdate,
  isActive
}: EducationSectionProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDateRange = (graduationDate: string) => {
    return graduationDate || '';
  };

  const handleAddEducation = () => {
    const newItem = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      location: '',
      graduationDate: '',
      description: ''
    };
    onUpdate({
      ...data,
      items: [...data.items, newItem]
    });
  };

  const handleUpdateEducation = (index: number, field: string, value: string) => {
    const updatedItems = [...data.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    onUpdate({
      ...data,
      items: updatedItems
    });

    // Clear validation errors when user starts typing
    const errorKey = `${index}-${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const handleRemoveEducation = (index: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học vấn này?')) {
      const updatedItems = [...data.items];
      updatedItems.splice(index, 1);
      onUpdate({
        ...data,
        items: updatedItems
      });
    }
  };

  const validateField = (index: number, field: string, value: string) => {
    const errorKey = `${index}-${field}`;
    let error = '';
    const education = data.items[index];

    if (field === 'degree' && value.trim() && !education.institution.trim()) {
      error = 'Vui lòng nhập tên trường học';
    } else if (field === 'institution' && value.trim() && !education.degree.trim()) {
      error = 'Vui lòng nhập bằng cấp và chuyên ngành';
    } else if (field === 'graduationDate' && value) {
      // Validate graduation year
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(year)) {
        error = 'Vui lòng nhập năm hợp lệ';
      } else if (year < 1950) {
        error = 'Năm tốt nghiệp có vẻ quá xa';
      } else if (year > currentYear + 10) {
        error = 'Năm tốt nghiệp có vẻ không hợp lý';
      }
    }

    setErrors(prev => ({
      ...prev,
      [errorKey]: error
    }));
  };

  const getInputClassName = (field: string, hasError: boolean) => {
    return `w-full p-2 border rounded-md transition-colors ${
      hasError 
        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
    } focus:outline-none focus:ring-2`;
  };

  return (
    <div className="space-y-6">
      {(data?.items || []).map((education, index) => {
        const isExpanded = expandedItems[education.id] !== false; // Default to expanded
        
        return (
          <div key={education.id} className="rounded-lg mb-4 bg-white shadow-sm">
            {/* Collapsible Header */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg"
              onClick={() => toggleExpanded(education.id)}
            >
              <div className="flex-1">
                {education.degree && education.institution ? (
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {education.degree} at {education.institution}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDateRange(education.graduationDate)}
                    </p>
                  </div>
                ) : (
                  <h4 className="font-medium text-gray-600">Học vấn #{index + 1}</h4>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Expand/Collapse Icon */}
                {isExpanded ? (
                  <ChevronUpIcon size={20} className="text-gray-400" />
                ) : (
                  <ChevronDownIcon size={20} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-6 border-t border-gray-100">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor={`degree-${index}`}>
                Bằng cấp và chuyên ngành <span className="text-red-500 text-xs">*</span>
              </label>
              <input 
                type="text" 
                id={`degree-${index}`}
                className={getInputClassName('degree', !!errors[`${index}-degree`])}
                value={education.degree} 
                onChange={e => handleUpdateEducation(index, 'degree', e.target.value)}
                onBlur={e => validateField(index, 'degree', e.target.value)}
                placeholder="Cử nhân Khoa học Máy tính"
                aria-invalid={!!errors[`${index}-degree`]}
              />
              {errors[`${index}-degree`] && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors[`${index}-degree`]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor={`institution-${index}`}>
                Trường học <span className="text-red-500 text-xs">*</span>
              </label>
              <input 
                type="text" 
                id={`institution-${index}`}
                className={getInputClassName('institution', !!errors[`${index}-institution`])}
                value={education.institution} 
                onChange={e => handleUpdateEducation(index, 'institution', e.target.value)}
                onBlur={e => validateField(index, 'institution', e.target.value)}
                placeholder="Đại học Bách Khoa Hà Nội"
                aria-invalid={!!errors[`${index}-institution`]}
              />
              {errors[`${index}-institution`] && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors[`${index}-institution`]}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor={`location-${index}`}>
                Địa điểm
              </label>
              <input 
                type="text" 
                id={`location-${index}`}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                value={education.location || ''} 
                onChange={e => handleUpdateEducation(index, 'location', e.target.value)}
                placeholder="Hà Nội"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor={`graduationDate-${index}`}>
                Năm tốt nghiệp
              </label>
              <input 
                type="text" 
                id={`graduationDate-${index}`}
                className={getInputClassName('graduationDate', !!errors[`${index}-graduationDate`])}
                value={education.graduationDate} 
                onChange={e => handleUpdateEducation(index, 'graduationDate', e.target.value)}
                onBlur={e => validateField(index, 'graduationDate', e.target.value)}
                placeholder="2020"
                aria-invalid={!!errors[`${index}-graduationDate`]}
              />
              {errors[`${index}-graduationDate`] && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors[`${index}-graduationDate`]}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Ví dụ: 2020 hoặc 12/2020
              </p>
            </div>
          </div>

                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1" htmlFor={`description-${index}`}>
                    Mô tả
                  </label>
                  <textarea 
                    id={`description-${index}`}
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                    value={education.description || ''} 
                    onChange={e => handleUpdateEducation(index, 'description', e.target.value)}
                    placeholder="Thành tích học tập, luận văn, hoạt động ngoại khóa..."
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Ví dụ: GPA 3.8/4.0, Học bổng xuất sắc, Luận văn về Machine Learning
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button 
        className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-primary-500 hover:bg-primary-50 hover:border-primary-500/50 transition-colors bg-white" 
        onClick={handleAddEducation}
      >
        <PlusIcon size={16} className="mr-2" />
        Thêm học vấn
      </button>
    </div>
  );
};