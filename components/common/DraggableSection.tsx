import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronUpIcon, ChevronDownIcon, GripVerticalIcon, Trash2Icon, WandIcon, EditIcon } from 'lucide-react';

interface DraggableSectionProps {
  id: string;
  children: React.ReactNode;
  onActivate: () => void;
  isActive: boolean;
  onDelete?: (sectionId: string) => void;
  customTitle?: string;
  onTitleChange?: (sectionId: string, newTitle: string) => void;
  suggestions?: any[]; // Job description suggestions for this section
  onApplySuggestion?: (sectionId: string, suggestion: any) => void;
  onDismissSuggestion?: (sectionId: string, suggestion: any) => void;
}

// Section labels are now passed as props from parent components with dynamic language loading
// This object serves as fallback only
const sectionLabels: Record<string, string> = {
  contact: 'Contact Information',
  summary: 'Professional Summary',
  experience: 'Work Experience',
  skills: 'Skills',
  education: 'Education'
};

// Core sections that cannot be deleted
const coreSections = ['contact', 'summary', 'experience', 'skills', 'education'];

const aiActions: Record<string, string[]> = {
  summary: [], // Remove all AI actions for summary
  experience: [], // Remove all AI actions for work experience
  skills: [], // Remove all AI actions for skills
  education: [], // Remove all AI actions for education
  default: [] // Remove all default AI actions
};

export const DraggableSection = ({
  id,
  children,
  onActivate,
  isActive,
  onDelete,
  customTitle,
  onTitleChange,
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion
}: DraggableSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestionsButtonRef = useRef<HTMLButtonElement>(null);

  const actions = aiActions[id] || aiActions.default;
  
  // For custom sections, extract the base type to check if it's deletable
  const isCustomSection = !coreSections.includes(id);
  const canDelete = isCustomSection && onDelete;
  
  // Contact Info section cannot be renamed as it doesn't show a title in preview
  const canRename = id !== 'contact' && onTitleChange;
  
  // Filter valid suggestions
  const validSuggestions = (suggestions || []).filter(suggestion => {
    if (!suggestion) return false;
    const displayText = typeof suggestion === 'string' 
      ? suggestion 
      : (suggestion?.keyword || suggestion?.title || String(suggestion));
    return displayText && displayText.trim() !== '' && displayText !== '[object Object]';
  });
  
  const hasSuggestions = validSuggestions && validSuggestions.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  // Focus input when starting to edit
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Close suggestions if clicking outside both the popover and the button
      if (showSuggestions && suggestionsRef.current && !suggestionsRef.current.contains(target)) {
        // Also check if the click is on the suggestions button
        if (suggestionsButtonRef.current && !suggestionsButtonRef.current.contains(target)) {
          setShowSuggestions(false);
        }
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions]);

  const handleSuggestionAction = (suggestion: any, action: 'apply' | 'dismiss') => {
    if (action === 'apply' && onApplySuggestion) {
      onApplySuggestion(id, suggestion);
    } else if (action === 'dismiss' && onDismissSuggestion) {
      onDismissSuggestion(id, suggestion);
    }
  };

  const handleApplyAllSuggestions = () => {
    if (onApplySuggestion) {
      validSuggestions.forEach(suggestion => {
        onApplySuggestion(id, suggestion);
      });
    }
    setShowSuggestions(false);
  };

  const handleAIAction = (action: string) => {
    console.log(`AI Action: ${action} for section ${id}`);
    setShowAIMenu(false);
  };

  const handleDelete = () => {
    if (!canDelete) return;
    
    const confirmMessage = `Bạn có chắc chắn muốn xóa phần "${getSectionTitle()}" này? Hành động này không thể hoàn tác.`;
    if (window.confirm(confirmMessage)) {
      onDelete(id);
    }
  };

  const handleSaveTitle = () => {
    const trimmedTitle = editTitle.trim();
    
    // Validation
    if (!trimmedTitle) {
      setTitleError('Tên phần không được để trống');
      return;
    }
    
    if (editTitle.length > 30) {  // Check original editTitle length, not trimmed
      setTitleError('Tên phần không được quá 30 ký tự');
      return;
    }
    
    // Save the new title
    if (onTitleChange) {
      onTitleChange(id, trimmedTitle);
    }
    
    setIsEditingTitle(false);
    setTitleError('');
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setTitleError('');
    setEditTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(e.target.value);
    
    // Clear error when user starts typing (unless it's just spaces)
    if (titleError && e.target.value.trim()) {
      setTitleError('');
    }
  };

  const getSectionTitle = () => {
    // Use custom title if available and not empty after trimming
    if (customTitle !== undefined && customTitle.trim() !== '') {
      return customTitle;
    }
    
    // For core sections, use predefined labels
    if (sectionLabels[id]) {
      return sectionLabels[id];
    }
    
    // For custom sections, create a readable title
    if (id.startsWith('projects-')) return 'Dự án';
    if (id.startsWith('volunteer-')) return 'Hoạt động tình nguyện';
    if (id.startsWith('certifications-')) return 'Chứng chỉ';
    if (id.startsWith('languages-')) return 'Ngôn ngữ';
    if (id.startsWith('hobbies-')) return 'Sở thích';
    if (id.startsWith('custom-')) return 'Phần tùy chỉnh';
    
    return 'Phần khác';
  };

  const handleStartEdit = () => {
    if (!canRename) return;
    
    setEditTitle(getSectionTitle());
    setIsEditingTitle(true);
    setTitleError('');
  };

  const renderTitle = () => {
    if (isEditingTitle) {
      return (
        <div className="flex items-center gap-2 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={handleTitleInputChange}
            onKeyDown={handleKeyPress}
            onBlur={handleSaveTitle}
            className={`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              titleError ? 'border-error-500/50 bg-error-500/5' : 'border-gray-200'
            }`}
          />
          {titleError && (
            <span className="text-xs text-error-500">{titleError}</span>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {getSectionTitle()}
        </h3>
        {canRename && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStartEdit();
            }}
            className={`p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-all ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            title="Đổi tên phần này"
          >
            <EditIcon size={12} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      data-section={id}
      className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 mb-6 section-content ${
        isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => !isActive && !isEditingTitle && onActivate()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-3 flex-1">
          {id !== 'contact' && (
            <div 
              className="text-gray-400 cursor-grab active:cursor-grabbing"
              {...attributes} 
              {...listeners}
            >
              <GripVerticalIcon size={16} />
            </div>
          )}
          
          {renderTitle()}
        </div>

        <div className="flex items-center gap-2">
          {/* Suggestion Indicator */}
          {hasSuggestions && (
            <div className="relative">
              <button
                ref={suggestionsButtonRef}
                className="flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-500 rounded-md text-xs font-medium hover:bg-primary-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSuggestions(!showSuggestions);
                  setShowAIMenu(false); // Close AI menu if open
                }}
                title="Xem gợi ý từ mô tả công việc"
                aria-label="Xem gợi ý từ mô tả công việc"
                aria-expanded={showSuggestions}
              >
                <span className="text-sm">🎯</span>
                <span>Gợi ý</span>
                <span className="bg-primary-500 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[1.25rem] text-center">
                  {validSuggestions.length}
                </span>
              </button>

              {/* Suggestions Popover */}
              {showSuggestions && (
                <div 
                  ref={suggestionsRef}
                  className="absolute right-0 top-full mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                >
                  <div className="p-4">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-primary-700 mb-1">
                        Gợi ý từ mô tả công việc
                      </h4>
                      <p className="text-xs text-primary-500">
                        Những từ khóa và kỹ năng phù hợp với vị trí bạn đang ứng tuyển
                      </p>
                    </div>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {validSuggestions.map((suggestion, index) => {
                        const displayText = typeof suggestion === 'string' 
                          ? suggestion 
                          : (suggestion?.keyword || suggestion?.title || String(suggestion));
                        
                        // Skip if no valid display text
                        if (!displayText || displayText === '[object Object]') {
                          return null;
                        }
                        
                        return (
                          <div 
                            key={index}
                            className="bg-primary-50 rounded-lg p-3 border border-primary-500/20"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm">🎯</span>
                                  <span className="font-medium text-gray-900 text-sm">
                                    {displayText}
                                  </span>
                                </div>
                                {(typeof suggestion === 'object' && suggestion?.description) && (
                                  <p className="text-xs text-gray-600">
                                    {suggestion.description}
                                  </p>
                                )}
                              </div>
                            
                            <div className="flex items-center space-x-2 ml-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSuggestionAction(suggestion, 'apply');
                                }}
                                className="px-3 py-1 bg-primary-500 text-white text-xs rounded-md hover:bg-primary-700 transition-colors"
                              >
                                Thêm
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSuggestionAction(suggestion, 'dismiss');
                                }}
                                className="px-2 py-1 text-gray-400 hover:text-gray-600 text-xs"
                                title="Bỏ qua gợi ý này"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    
                    {validSuggestions.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-primary-500/20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyAllSuggestions();
                          }}
                          className="w-full px-3 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors font-medium"
                        >
                          Thêm tất cả gợi ý ({validSuggestions.length})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Assistant Menu */}
          <div className="relative">
            {actions.length > 0 && (
              <button
                className={`p-2 hover:bg-primary-50 rounded-lg text-primary-500 transition-all ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAIMenu(!showAIMenu);
                  setShowSuggestions(false); // Close suggestions if open
                }}
                title="Hỗ trợ AI"
                aria-label="Hỗ trợ AI"
                aria-expanded={showAIMenu}
              >
                <WandIcon size={16} />
              </button>
            )}
            
            {showAIMenu && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAIAction(action);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-primary-50 hover:text-primary-500"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delete button for custom sections */}
          {canDelete && (
            <button
              className={`p-2 hover:bg-error-500/10 rounded-lg text-error-500 hover:text-error-500 transition-all ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              title="Xóa phần này"
              aria-label="Xóa phần này"
            >
              <Trash2Icon size={16} />
            </button>
          )}

          {/* Expand/Collapse button */}
          <button
            className="p-2 hover:bg-blue-100 rounded-lg text-gray-500 hover:text-blue-600 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            aria-label={isExpanded ? 'Thu gọn phần này' : 'Mở rộng phần này'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};