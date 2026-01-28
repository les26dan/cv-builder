import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AIAssistButton } from '../common/AIAssistButton';
import { AIWizardModal } from '../common/AIWizardModal';
import { TemplateSelectionModal } from '../common/TemplateSelectionModal';
import { WorkExperienceWizard } from '../common/WorkExperienceWizard';
import { SortableWorkExperience } from '../common/SortableWorkExperience';
import { PlusIcon, GripVerticalIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon, FileTextIcon } from 'lucide-react';
import { aiService, WizardBulletGenerationRequest } from '../../utils/aiService';
import { formatDateRange } from '../../utils/dateUtils';
import { getTexts } from '../../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../../config/languageConfig';

interface WorkExperienceSectionProps {
  data: {
    items: Array<{
      id: string;
      title: string;
      company: string;
      location?: string;
      startDate: string;
      endDate: string;
      current?: boolean;
      bullets: string[];
    }>;
  };
  onUpdate: (data: any) => void;
  isActive: boolean;
  cvData?: any;
  onNavigateToSection?: (sectionId: string) => void;
  language?: SupportedLanguage;
  onProvideAddFunction?: (addFunction: () => void) => void;
}

export const WorkExperienceSection = ({
  data,
  onUpdate,
  isActive,
  cvData,
  onNavigateToSection,
  language,
  onProvideAddFunction
}: WorkExperienceSectionProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Language and text configuration
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [experienceTexts, setExperienceTexts] = useState<any>(null);
  
  // Load language configuration
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
        const effectiveLanguage = language || savedLanguage || detectLanguage().language;
        
        setCurrentLanguage(effectiveLanguage);
        const texts = await getTexts('cvEditor', effectiveLanguage);
        setExperienceTexts(texts.sections.experience);
      } catch (error) {
        console.error('Failed to load experience texts:', error);
        setCurrentLanguage('en');
      }
    };
    
    loadLanguage();
  }, [language]);

  // Provide the add function to parent component
  useEffect(() => {
    if (onProvideAddFunction) {
      onProvideAddFunction(handleAddExperience);
    }
  }, [onProvideAddFunction]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [wizardModal, setWizardModal] = useState<{isOpen: boolean, experienceIndex: number}>({
    isOpen: false,
    experienceIndex: -1
  });
  const [templateModal, setTemplateModal] = useState<{isOpen: boolean, experienceIndex: number}>({
    isOpen: false,
    experienceIndex: -1
  });
  const [newExperienceWizard, setNewExperienceWizard] = useState(false);
  const [pendingExperience, setPendingExperience] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Drag and drop sensors - improved responsiveness
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after 8px movement (reduced from default 15px)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // formatDateRange is now imported from utils/dateUtils

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = data.items.findIndex(item => item.id === active.id);
      const newIndex = data.items.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(data.items, oldIndex, newIndex);
        onUpdate({
          ...data,
          items: newItems
        });
      }
    }
    
    setActiveId(null);
  };

  const handleAddExperience = () => {
    // Open the new comprehensive wizard instead of creating empty entry
    setNewExperienceWizard(true);
  };

  const handleWizardSave = async (experienceData: any) => {
    // Store the experience data temporarily
    setPendingExperience(experienceData);

    // If AI was not skipped, generate the bullet point
    if (experienceData.aiGenerated) {
      setIsGenerating(true);
      
      try {
        // Prepare AI request from wizard data
        const request: WizardBulletGenerationRequest = {
          jobTitle: experienceData.title,
          company: experienceData.company,
          project: experienceData.project || '',
          impact: experienceData.impact || '',
          responsibility: experienceData.responsibility || ''
        };

        const result = await aiService.generateBulletFromWizard(request);

        if (result.success && result.data) {
          // Add the experience with AI-generated bullet
          const newExperience = {
            ...experienceData,
            bullets: [result.data]
          };
          
          // Add to the end of the list (no sorting)
          const updatedItems = [...data.items, newExperience];
          
          onUpdate({
            ...data,
            items: updatedItems
          });
        } else {
          console.error('Failed to generate bullet:', result.error);
          // Still add the experience but with empty bullet
          const newExperience = {
            ...experienceData,
            bullets: ['']
          };
          
          const updatedItems = [...data.items, newExperience];
          
          onUpdate({
            ...data,
            items: updatedItems
          });
        }
      } catch (error) {
        console.error('Error generating bullet:', error);
        // Still add the experience but with empty bullet
        const newExperience = {
          ...experienceData,
          bullets: ['']
        };
        
        const updatedItems = [...data.items, newExperience];
        
        onUpdate({
          ...data,
          items: updatedItems
        });
      } finally {
        setIsGenerating(false);
      }
    } else {
      // AI was skipped, just add the experience with empty bullet
      const updatedItems = [...data.items, experienceData];
      
      onUpdate({
        ...data,
        items: updatedItems
      });
    }

    // Close wizard and clean up
    setNewExperienceWizard(false);
    setPendingExperience(null);
  };

  

  const handleUpdateExperience = (index: number, field: string, value: any) => {
    const updatedItems = [...data.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Update without sorting - maintain creation order
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

  const handleRemoveExperience = (index: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa kinh nghiệm này?')) {
      const updatedItems = [...data.items];
      updatedItems.splice(index, 1);
      onUpdate({
        ...data,
        items: updatedItems
      });
    }
  };

  const handleAddBullet = (experienceIndex: number) => {
    const updatedItems = [...data.items];
    updatedItems[experienceIndex].bullets.push('');
    onUpdate({
      ...data,
      items: updatedItems
    });
  };

  const handleUpdateBullet = (experienceIndex: number, bulletIndex: number, value: string) => {
    const updatedItems = [...data.items];
    updatedItems[experienceIndex].bullets[bulletIndex] = value;
    onUpdate({
      ...data,
      items: updatedItems
    });
  };

  const handleBulletBlur = (experienceIndex: number, bulletIndex: number, value: string) => {
    // Remove empty bullets on blur (except if it's the only bullet)
    if (!value.trim() && data.items[experienceIndex].bullets.length > 1) {
      handleRemoveBullet(experienceIndex, bulletIndex);
      return;
    }
    
    // Add a new bullet if this is the last one and it has content
    const bullets = data.items[experienceIndex].bullets;
    if (bulletIndex === bullets.length - 1 && value.trim() && bullets.length < 8) {
      handleAddBullet(experienceIndex);
    }
  };

  const handleBulletKeyDown = (experienceIndex: number, bulletIndex: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      const bullets = data.items[experienceIndex].bullets;
      const currentValue = bullets[bulletIndex];
      
      // If current bullet has content and we're at the last bullet, add a new one
      if (currentValue.trim() && bulletIndex === bullets.length - 1 && bullets.length < 8) {
        handleAddBullet(experienceIndex);
        
        // Focus the new bullet after a brief delay
        setTimeout(() => {
          const newBulletTextarea = document.querySelector(
            `[data-experience-index="${experienceIndex}"][data-bullet-index="${bulletIndex + 1}"]`
          ) as HTMLTextAreaElement;
          if (newBulletTextarea) {
            newBulletTextarea.focus();
          }
        }, 50);
      }
      // If current bullet is empty and not the only bullet, remove it and focus previous
      else if (!currentValue.trim() && bullets.length > 1) {
        handleRemoveBullet(experienceIndex, bulletIndex);
        
        // Focus the previous bullet
        if (bulletIndex > 0) {
          setTimeout(() => {
            const prevBulletTextarea = document.querySelector(
              `[data-experience-index="${experienceIndex}"][data-bullet-index="${bulletIndex - 1}"]`
            ) as HTMLTextAreaElement;
            if (prevBulletTextarea) {
              prevBulletTextarea.focus();
              prevBulletTextarea.setSelectionRange(prevBulletTextarea.value.length, prevBulletTextarea.value.length);
            }
          }, 50);
        }
      }
      // Otherwise, move to next bullet if it exists
      else if (bulletIndex < bullets.length - 1) {
        const nextBulletTextarea = document.querySelector(
          `[data-experience-index="${experienceIndex}"][data-bullet-index="${bulletIndex + 1}"]`
        ) as HTMLTextAreaElement;
        if (nextBulletTextarea) {
          nextBulletTextarea.focus();
        }
      }
    }
  };

  const handleOptionalAIAssist = async (experienceIndex: number, bulletIndex: number) => {
    const experience = data.items[experienceIndex];
    const currentBullet = experience.bullets[bulletIndex];
    
    if (!experience.title || !experience.company) {
      alert('Vui lòng điền chức danh và công ty để sử dụng AI hỗ trợ');
      return;
    }

    // Show the wizard for this specific bullet
    setWizardModal({ isOpen: true, experienceIndex });
  };

  const handleRemoveBullet = (experienceIndex: number, bulletIndex: number) => {
    const updatedItems = [...data.items];
    updatedItems[experienceIndex].bullets.splice(bulletIndex, 1);
    onUpdate({
      ...data,
      items: updatedItems
    });
  };

  const handleOpenWizard = (experienceIndex: number) => {
    const experience = data.items[experienceIndex];
    if (!experience.title || !experience.company) {
      alert('Vui lòng nhập chức danh và công ty trước khi sử dụng AI');
      return;
    }

    setWizardModal({ isOpen: true, experienceIndex });
  };

  const handleOpenTemplates = (experienceIndex: number) => {
    setTemplateModal({ isOpen: true, experienceIndex });
  };

  const handleWizardGenerate = async (wizardData: { project: string; impact: string; responsibility?: string }) => {
    if (wizardModal.experienceIndex === -1) return;

    const experience = data.items[wizardModal.experienceIndex];
    setIsGenerating(true);

    try {
      // Prepare enhanced context with full CV data
      const otherExperiences = data.items.filter((_, index) => index !== wizardModal.experienceIndex);
      
      const request: WizardBulletGenerationRequest & {
        workExperience?: any[];
        skills?: string[];
        education?: any[];
        targetJobDescription?: string;
      } = {
        jobTitle: experience.title,
        company: experience.company,
        project: wizardData.project,
        impact: wizardData.impact,
        responsibility: wizardData.responsibility,
        workExperience: otherExperiences,
        skills: cvData?.skills?.items || [],
        education: cvData?.education?.items || [],
        targetJobDescription: cvData?.targetJobDescription || ''
      };

      const result = await aiService.generateBulletFromWizard(request);

      if (result.success && result.data) {
        const updatedItems = [...data.items];
        const newBullets = [...updatedItems[wizardModal.experienceIndex].bullets];
        
        // Add the new bullet to the list
        newBullets.push(result.data);
        updatedItems[wizardModal.experienceIndex].bullets = newBullets;
        
        onUpdate({
          ...data,
          items: updatedItems
        });

        // Mark AI as used for score calculation (will be implemented)
        // markAIUsed('workExperience');

        // Close the wizard
        setWizardModal({ isOpen: false, experienceIndex: -1 });
      } else {
        console.error('Failed to generate bullet:', result.error);
        alert('Không thể tạo gạch đầu dòng. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error generating bullet:', error);
      alert('Có lỗi xảy ra khi tạo gạch đầu dòng. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateSelect = (template: { content: string }) => {
    if (templateModal.experienceIndex === -1) return;

    const updatedItems = [...data.items];
    const newBullets = [...updatedItems[templateModal.experienceIndex].bullets];
    
    // Add the template content to the bullets
    newBullets.push(template.content);
    updatedItems[templateModal.experienceIndex].bullets = newBullets;
    
    onUpdate({
      ...data,
      items: updatedItems
    });

    // Close the template modal
    setTemplateModal({ isOpen: false, experienceIndex: -1 });
  };

  const handleGenerateBullets = async (experienceIndex: number) => {
    const experience = data.items[experienceIndex];
    if (!experience.title && !experience.company) {
      alert('Vui lòng nhập chức danh và công ty trước khi tạo mô tả');
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare enhanced context with full CV data
      const otherExperiences = data.items.filter((_, index) => index !== experienceIndex);
      
      const result = await aiService.generateBulletPoints({
        jobTitle: experience.title,
        company: experience.company,
        existingBullets: experience.bullets.filter(b => b.trim()),
        workExperience: otherExperiences,
        skills: cvData?.skills?.items || [],
        education: cvData?.education?.items || [],
        targetJobDescription: cvData?.targetJobDescription || ''
      });

      if (result.success && result.data) {
        const updatedItems = [...data.items];
        updatedItems[experienceIndex].bullets = result.data;
        onUpdate({
          ...data,
          items: updatedItems
        });

        // Mark AI as used for score calculation (will be implemented)
        // markAIUsed('workExperience');
      } else {
        console.error('Failed to generate bullets:', result.error);
        alert(experienceTexts?.validation?.generateError || 'Unable to generate job description. Please try again.');
      }
    } catch (error) {
      console.error('Error generating bullets:', error);
      alert(experienceTexts?.validation?.generateError || 'An error occurred while generating description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImproveBullets = async (experienceIndex: number) => {
    const experience = data.items[experienceIndex];
    const existingBullets = experience.bullets.filter(b => b.trim());
    
    if (existingBullets.length === 0) {
      alert('Please add at least one job description before improving');
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare enhanced context with full CV data
      const otherExperiences = data.items.filter((_, index) => index !== experienceIndex);
      
      const result = await aiService.improveBulletPoints(existingBullets, {
        jobTitle: experience.title,
        company: experience.company,
        workExperience: otherExperiences,
        skills: cvData?.skills?.items || [],
        targetJob: cvData?.targetJobDescription || ''
      });

      if (result.success && result.data) {
        const updatedItems = [...data.items];
        updatedItems[experienceIndex].bullets = result.data;
        onUpdate({
          ...data,
          items: updatedItems
        });

        // Mark AI as used for score calculation (will be implemented)
        // markAIUsed('workExperience');
      } else {
        console.error('Failed to improve bullets:', result.error);
        alert('Không thể cải thiện mô tả. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error improving bullets:', error);
      alert('Có lỗi xảy ra khi cải thiện mô tả. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const validateField = (index: number, field: string, value: string) => {
    const errorKey = `${index}-${field}`;
    let error = '';
    const experience = data.items[index];

    // Only validate required fields when they are actually empty, don't cross-validate
    if (field === 'title' && !value.trim()) {
              error = experienceTexts?.validation?.titleRequired || 'Please enter job title';
    } else if (field === 'company' && !value.trim()) {
      error = experienceTexts?.validation?.companyRequired || 'Please enter company name';
    } else if (field === 'endDate' && value && experience.startDate) {
      // Enhanced date validation
      const startYear = parseInt(experience.startDate.split('/').pop() || experience.startDate);
      const endYear = parseInt(value.split('/').pop() || value);
      
      if (!isNaN(startYear) && !isNaN(endYear) && endYear < startYear) {
        error = experienceTexts?.validation?.endBeforeStart || 'End date must be after start date';
      }
      
      // Check for future dates that are too far
      const currentYear = new Date().getFullYear();
      if (!isNaN(endYear) && endYear > currentYear + 5) {
        error = 'End date seems unrealistic';
      }
    } else if (field === 'startDate' && value && experience.endDate && !experience.current) {
      // Validate start date against end date
      const startYear = parseInt(value.split('/').pop() || value);
      const endYear = parseInt(experience.endDate.split('/').pop() || experience.endDate);
      
      if (!isNaN(startYear) && !isNaN(endYear) && startYear > endYear) {
        error = experienceTexts?.validation?.startAfterEnd || 'Start date must be before end date';
      }
    }

    setErrors(prev => ({
      ...prev,
      [errorKey]: error
    }));
  };

  const validateBulletLength = (bullet: string): string => {
    if (bullet.length > 200) {
      return 'warning'; // Long bullet
    }
    return '';
  };

  const getBulletClassName = (bullet: string) => {
    const baseClass = 'flex-1 p-2 border rounded-md min-h-[60px] resize-none transition-all duration-200';
    
    if (bullet.length > 200) {
      return `${baseClass} border-orange-300 bg-orange-50 focus:border-orange-500 focus:ring-2 focus:ring-orange-200`;
    }
    
    return `${baseClass} border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200`;
  };

  const getBulletLengthIndicator = (bullet: string) => {
    if (bullet.length > 200) {
      return (
        <div className="text-orange-600 text-xs mt-1 flex items-center">
          <span className="mr-1">⚠️</span>
          Gạch đầu dòng này khá dài ({bullet.length}/200 ký tự). Hãy cân nhắc chia thành hai gạch đầu dòng.
        </div>
      );
    }
    
    if (bullet.length > 150) {
      return (
        <div className="text-yellow-600 text-xs mt-1">
          💡 {bullet.length}/200 ký tự - có thể rút gọn thêm
        </div>
      );
    }
    
    return null;
  };

  // Enhanced current job handling
  const handleCurrentJobToggle = (index: number) => {
    const currentExperience = data.items[index];
    const newCurrentState = !currentExperience.current;
    
    // Update both current state and end date in a single call to avoid race conditions
    const updatedItems = [...data.items];
    updatedItems[index] = {
      ...updatedItems[index],
      current: newCurrentState,
      endDate: newCurrentState ? '' : updatedItems[index].endDate
    };

    onUpdate({
      ...data,
      items: updatedItems
    });
    
    // Clear any end date errors if marking as current job
    if (newCurrentState) {
      const errorKey = `${index}-endDate`;
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  // Check if we should show the guidance banner - updated logic per Product Spec
  const shouldShowGuidance = data?.items?.length === 1 && 
    (!data.items[0]?.title?.trim() || !data.items[0]?.company?.trim());

  // AI Button State Management per Product Spec
  const getAIButtonStates = (experience: any) => {
    const hasTitle = experience.title?.trim();
    const hasCompany = experience.company?.trim();
    const hasContent = experience.bullets?.some((b: string) => b.trim());
    
    // Core Flow Logic: Empty vs Content States
    const fieldsEmpty = !hasTitle || !hasCompany;
    
    return {
      improveButton: {
        show: true,
        variant: (!fieldsEmpty && hasContent && !isGenerating) ? 'primary' as const : 'outline' as const,
        size: 'md' as const,
        disabled: fieldsEmpty || !hasContent || isGenerating,
        prominent: !fieldsEmpty && hasContent && !isGenerating
      }
    };
  };

  return (
    <div className="space-y-6">
      {/* Blue Guidance Banner - Product Spec Logic */}
      {shouldShowGuidance && (
        <div className="bg-primary-50 border border-primary-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-primary-500 text-lg">⚡</div>
            <div className="flex-1">
              <h4 className="font-medium text-primary-700 mb-1">
                Xây Dựng Kinh Nghiệm Làm Việc Ấn Tượng Trong 5 Giây!
              </h4>
              <p className="text-sm text-primary-500 mb-2">
                Chỉ cần nhập chức danh và tên công ty - OkBuddy AI giúp bạn tạo mô tả kinh nghiệm làm việc ngay lập tức.
              </p>
            </div>
          </div>
        </div>
      )}

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={data?.items?.map(item => item.id) || []} 
          strategy={verticalListSortingStrategy}
        >
          {(data?.items || []).map((experience, index) => {
            const buttonStates = getAIButtonStates(experience);
            const isExpanded = expandedItems[experience.id] === true; // Default to collapsed
            
            return (
              <SortableWorkExperience
                key={experience.id}
                experience={experience}
                index={index}
                onToggleExpanded={toggleExpanded}
                isExpanded={isExpanded}
                onRemove={handleRemoveExperience}
                language={currentLanguage}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {experienceTexts?.fields?.title || 'Job Title'} <span className="text-red-500 text-xs">*</span>
                </label>
                <input 
                  type="text" 
                  className={`w-full p-2 border rounded-md transition-all duration-200 ${
                    errors[`${index}-title`] ? 'border-error-500/50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                  value={experience.title} 
                  onChange={(e) => handleUpdateExperience(index, 'title', e.target.value)}
                  onBlur={(e) => validateField(index, 'title', e.target.value)}
                  placeholder={experienceTexts?.placeholders?.title || 'e.g., Software Engineer'} 
                />
                {errors[`${index}-title`] && (
                  <p className="text-error-500 text-xs mt-1">{errors[`${index}-title`]}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {experienceTexts?.fields?.company || 'Company'} <span className="text-red-500 text-xs">*</span>
                </label>
                <input 
                  type="text" 
                  className={`w-full p-2 border rounded-md transition-all duration-200 ${
                    errors[`${index}-company`] ? 'border-error-500/50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                  value={experience.company} 
                  onChange={(e) => handleUpdateExperience(index, 'company', e.target.value)}
                  onBlur={(e) => validateField(index, 'company', e.target.value)}
                  placeholder={experienceTexts?.placeholders?.company || 'e.g., ABC Corporation'} 
                />
                {errors[`${index}-company`] && (
                  <p className="text-error-500 text-xs mt-1">{errors[`${index}-company`]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {experienceTexts?.fields?.startDate || 'Start Date'} <span className="text-red-500 text-xs">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-200 rounded-md transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                  value={experience.startDate} 
                  onChange={(e) => handleUpdateExperience(index, 'startDate', e.target.value)}
                  placeholder={experienceTexts?.placeholders?.startDate || 'MM/YYYY'} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {experienceTexts?.fields?.endDate || 'End Date'} <span className="text-red-500 text-xs">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    className={`flex-1 p-2 border rounded-md transition-all duration-200 ${
                      errors[`${index}-endDate`] ? 'border-error-500/50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                    value={experience.endDate} 
                    onChange={(e) => handleUpdateExperience(index, 'endDate', e.target.value)}
                    onBlur={(e) => validateField(index, 'endDate', e.target.value)}
                    placeholder={experienceTexts?.placeholders?.endDate || 'MM/YYYY'} 
                    disabled={experience.current}
                  />
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox" 
                      checked={Boolean(experience.current)} 
                      onChange={() => handleCurrentJobToggle(index)}
                      className="mr-1"
                    />
                    {experienceTexts?.fields?.current || 'I currently work here'}
                  </label>
                </div>
                {errors[`${index}-endDate`] && (
                  <p className="text-error-500 text-xs mt-1">{errors[`${index}-endDate`]}</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{experienceTexts?.fields?.location || 'Location'}</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-200 rounded-md transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                value={experience.location || ''} 
                onChange={(e) => handleUpdateExperience(index, 'location', e.target.value)}
                placeholder={experienceTexts?.placeholders?.location || 'e.g., San Francisco, CA'} 
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <label className="block text-sm font-medium">{experienceTexts?.fields?.description || 'Job Description'} <span className="text-red-500 text-xs">*</span></label>
                {/* AI Generate Options Dropdown */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenTemplates(index)}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <FileTextIcon size={16} />
                    {currentLanguage === 'vi' ? 'Dùng mẫu' : 'Use template'}
                  </button>
                </div>
              </div>

              {/* Show informational message if either field is not filled */}
              {(!experience.title || !experience.company) && (
                <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-3 mb-3">
                  <p className="text-sm text-warning-500 font-medium">
                    💡 {currentLanguage === 'vi' ? 'Bắt đầu với thông tin cơ bản' : 'Start with basic information'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {experienceTexts?.aiGuidance || 'Fill in job title and company name so AI can help create the perfect job description for you.'}
                  </p>
                </div>
              )}

              {(experience.bullets || []).map((bullet, bulletIndex) => (
                <div key={`${experience.id}-bullet-${bulletIndex}`} className="mb-4">
                  <div className="flex items-start gap-2 w-full">
                    <div className="mt-3 text-gray-400 flex-shrink-0 w-4">•</div>
                    <textarea 
                      className={`${getBulletClassName(bullet)} flex-1`}
                      value={bullet} 
                      onChange={(e) => handleUpdateBullet(index, bulletIndex, e.target.value)}
                      onBlur={(e) => handleBulletBlur(index, bulletIndex, e.target.value)}
                      onKeyDown={(e) => handleBulletKeyDown(index, bulletIndex, e)}
                      placeholder={experienceTexts?.bullets?.placeholder || 'Describe a specific achievement or responsibility...'}
                      rows={2}
                      data-experience-index={index}
                      data-bullet-index={bulletIndex}
                    />
                    {experience.bullets.length > 1 && (
                      <button 
                        className="flex-shrink-0 mt-3 text-error-500 hover:text-error-600 hover:bg-red-50 p-1.5 rounded transition-all duration-200"
                        onClick={() => handleRemoveBullet(index, bulletIndex)}
                        title={experienceTexts?.bullets?.remove || 'Remove'}
                      >
                        <TrashIcon size={14} />
                      </button>
                    )}
                  </div>
                  {getBulletLengthIndicator(bullet)}
                </div>
              ))}
              
              <button 
                className="flex items-center text-sm text-primary-500 hover:text-primary-500 mt-2" 
                onClick={() => handleOpenWizard(index)}
              >
                <PlusIcon size={14} className="mr-1" />
                {experienceTexts?.bullets?.add || 'Add Achievement'}
              </button>
              
              {/* Bottom AI Button - Remove horizontal line */}
              <div className="mt-4">
                <AIAssistButton 
                  label={experienceTexts?.bullets?.aiGenerate || 'Generate with AI'} 
                  onClick={() => handleImproveBullets(index)}
                  disabled={buttonStates.improveButton.disabled}
                  variant={buttonStates.improveButton.variant}
                  size={buttonStates.improveButton.size}
                />
              </div>
            </div>


              </SortableWorkExperience>
            );
          })}
        </SortableContext>
        
        <DragOverlay>
          {activeId ? (
            <div className="rounded-lg bg-white shadow-xl border-2 border-blue-300 opacity-95">
              {(() => {
                const activeExperience = data.items.find(item => item.id === activeId);
                if (!activeExperience) return null;
                
                return (
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <GripVerticalIcon size={16} className="text-blue-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {activeExperience.title && activeExperience.company 
                            ? `${activeExperience.title} at ${activeExperience.company}`
                            : `Kinh nghiệm #${data.items.findIndex(item => item.id === activeId) + 1}`
                          }
                        </h4>
                        {activeExperience.startDate && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDateRange(activeExperience.startDate, activeExperience.endDate, activeExperience.current || false)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <button 
        className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-primary-500 hover:bg-primary-50 hover:border-primary-500/50 transition-colors bg-white" 
        onClick={handleAddExperience}
      >
        <PlusIcon size={16} className="mr-2" />
        {experienceTexts?.addExperience || 'Add Work Experience'}
      </button>

      {/* AI Wizard Modal */}
      <AIWizardModal
        isOpen={wizardModal.isOpen}
        onClose={() => setWizardModal({ isOpen: false, experienceIndex: -1 })}
        onGenerate={handleWizardGenerate}
        jobTitle={wizardModal.experienceIndex >= 0 ? data.items[wizardModal.experienceIndex]?.title || '' : ''}
        company={wizardModal.experienceIndex >= 0 ? data.items[wizardModal.experienceIndex]?.company || '' : ''}
        isGenerating={isGenerating}
      />

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={templateModal.isOpen}
        onClose={() => setTemplateModal({ isOpen: false, experienceIndex: -1 })}
        onSelectTemplate={handleTemplateSelect}
        jobTitle={templateModal.experienceIndex >= 0 ? data.items[templateModal.experienceIndex]?.title : undefined}
      />

      {/* New Work Experience Wizard */}
      <WorkExperienceWizard
        isOpen={newExperienceWizard}
        onClose={() => setNewExperienceWizard(false)}
        onSave={handleWizardSave}
        isGenerating={isGenerating}
      />
    </div>
  );
};