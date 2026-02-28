import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrashIcon, ChevronDownIcon, ChevronUpIcon, GripVerticalIcon } from 'lucide-react';
import { formatDateRange, isCurrentJob } from '../../utils/dateUtils';
import { detectLanguage, type SupportedLanguage } from '../../config/languageConfig';

interface SortableWorkExperienceProps {
  experience: {
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    current?: boolean;
    bullets: string[];
  };
  index: number;
  children: React.ReactNode;
  onToggleExpanded: (id: string) => void;
  isExpanded: boolean;
  onRemove: (index: number) => void;
  language?: SupportedLanguage;
}

export const SortableWorkExperience: React.FC<SortableWorkExperienceProps> = ({
  experience,
  index,
  children,
  onToggleExpanded,
  isExpanded,
  onRemove,
  language
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isExpandIconHovered, setIsExpandIconHovered] = useState(false);
  
  // Language configuration
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  
  useEffect(() => {
    const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
    const effectiveLanguage = language || savedLanguage || detectLanguage().language;
    setCurrentLanguage(effectiveLanguage);
  }, [language]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: experience.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 1000 : 1,
  };

  // Handle focus/blur events to show blue selection stroke
  const handleContentFocus = () => {
    setIsSelected(true);
  };

  const handleContentBlur = (e: React.FocusEvent) => {
    // Only blur if focus is moving outside this work experience component
    // AND the focus is not on a form control (input, textarea, checkbox, etc.)
    const relatedTarget = e.relatedTarget as HTMLElement;
    const isFormControl = relatedTarget && (
      relatedTarget.tagName === 'INPUT' ||
      relatedTarget.tagName === 'TEXTAREA' ||
      relatedTarget.tagName === 'SELECT' ||
      relatedTarget.tagName === 'BUTTON'
    );
    
    if (!e.currentTarget.contains(relatedTarget) && !isFormControl) {
      setIsSelected(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg mb-4 bg-white border-2 border-gray-200 transition-all duration-200 ${
        isDragging ? 'opacity-90 scale-102 shadow-xl ring-2 ring-blue-200 border-blue-300' : 'hover:shadow-md hover:border-gray-200'
      } ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg border-blue-400' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Collapsible Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg"
        onClick={() => onToggleExpanded(experience.id)}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Grip icon - always visible with larger drag area */}
          <div 
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-2 -m-2 touch-none"
            {...attributes} 
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: 'none' }}
          >
            <GripVerticalIcon size={16} />
          </div>
          
          <div className="flex-1">
            {experience.title && experience.company ? (
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">
                    {experience.title} at {experience.company}
                  </h4>
                  {/* Green current job label */}
                  {isCurrentJob(experience) && (
                    <span 
                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                      style={{ 
                        color: '#16A34A', 
                        backgroundColor: '#DCFCE7' 
                      }}
                    >
                      {currentLanguage === 'vi' ? 'Hiện tại' : 'Current'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDateRange(experience.startDate, experience.endDate, experience.current || false, currentLanguage)}
                </p>
              </div>
            ) : (
              <h4 className="font-medium text-gray-600">{currentLanguage === 'vi' ? 'Kinh nghiệm' : 'Experience'} #{index + 1}</h4>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Delete button - visible on hover with enhanced hover effect */}
          {isHovered && (
            <button 
              className="flex-shrink-0 text-error-500 hover:text-error-600 hover:bg-red-50 p-1.5 rounded transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              title="Xóa kinh nghiệm làm việc"
            >
              <TrashIcon size={16} />
            </button>
          )}
          
          {/* Expand/Collapse Icon with enhanced hover effects */}
          <div
            className={`p-1 rounded transition-all duration-200 ${
              isExpandIconHovered ? 'bg-blue-100' : ''
            }`}
            onMouseEnter={() => setIsExpandIconHovered(true)}
            onMouseLeave={() => setIsExpandIconHovered(false)}
            title={isExpanded ? "Thu gọn" : "Mở rộng"}
          >
            {isExpanded ? (
              <ChevronUpIcon 
                size={20} 
                className={`transition-colors duration-200 ${
                  isExpandIconHovered ? 'text-blue-600' : 'text-gray-400'
                }`} 
              />
            ) : (
              <ChevronDownIcon 
                size={20} 
                className={`transition-colors duration-200 ${
                  isExpandIconHovered ? 'text-blue-600' : 'text-gray-400'
                }`} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}; 