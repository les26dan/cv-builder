import { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AIAssistButton } from '../common/AIAssistButton';
import dynamic from 'next/dynamic';

// Dynamic imports for performance optimization - these are heavy AI components
const AIWizardModal = dynamic(() => import('../common/AIWizardModal').then(mod => ({ default: mod.AIWizardModal })), {
  ssr: false,
  loading: () => null
});

const NewAIWizardModal = dynamic(() => import('../common/NewAIWizardModal').then(mod => ({ default: mod.NewAIWizardModal })), {
  ssr: false,
  loading: () => null
});

const TemplateSelectionModal = dynamic(() => import('../common/TemplateSelectionModal').then(mod => ({ default: mod.TemplateSelectionModal })), {
  ssr: false,
  loading: () => null
});

const WorkExperienceWizard = dynamic(() => import('../common/WorkExperienceWizard').then(mod => ({ default: mod.WorkExperienceWizard })), {
  ssr: false,
  loading: () => null
});

// Remove dynamic import to prevent wizard render delay - this is a critical UI component
import { NewWorkExperienceWizard } from '../common/NewWorkExperienceWizard';
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

  // Prevent automatic wizard opening during initial load for template users
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoadComplete(true);
      console.log('🎯 Guest Session: Initial load complete, allowing user interactions');
    }, 3000); // 3 second grace period for template users
    
    return () => clearTimeout(timer);
  }, []);

  // Reset function provision flag when CV ID changes (new CV loaded)
  useEffect(() => {
    setHasFunctionBeenProvided(false);
    console.log('🔄 CV ID changed, resetting function provision flag');
  }, [cvData?.id]);

  // Detect if this is a parsed CV to control expansion behavior
  useEffect(() => {
    const checkIfParsedCV = () => {
      try {
        // Check localStorage for CV upload data
        const uploadData = localStorage.getItem('cv_upload_data');
        if (uploadData) {
          const parsed = JSON.parse(uploadData);
          if (parsed.processed && parsed.validCV && parsed.llmParsedData) {
            console.log('🔍 Detected parsed CV from upload - keeping experiences collapsed by default');
            setIsParsedCV(true);
            return;
          }
        }

        // Check URL parameters for source indicators
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const source = urlParams.get('source');
          const parsed = urlParams.get('parsed');
          
          if (source === 'upload' && parsed === 'success') {
            console.log('🔍 Detected parsed CV from URL params - keeping experiences collapsed by default');
            setIsParsedCV(true);
            return;
          }
        }
        
        // Default to manual creation mode (expand new items)
        setIsParsedCV(false);
      } catch (error) {
        console.error('Error checking CV source:', error);
        setIsParsedCV(false);
      }
    };

    checkIfParsedCV();
  }, []);


  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isParsedCV, setIsParsedCV] = useState<boolean>(false);
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
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [hasFunctionBeenProvided, setHasFunctionBeenProvided] = useState(false);
  
  // New wizard states
  const [newWizardOpen, setNewWizardOpen] = useState(false);
  const [newAIWizardOpen, setNewAIWizardOpen] = useState(false);
  const [newAIWizardIndex, setNewAIWizardIndex] = useState(-1);
  
  // Feature flag for new wizards (can be controlled via environment or user preference)
  const useNewWizards = true; // Set to true to use new simplified wizards

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

  const handleAddExperience = useCallback(() => {
    // Prevent automatic wizard opening for template users during initial load
    const isTemplateUser = cvData?.id && cvData.id.startsWith('template-');
    
    if (isTemplateUser && !isInitialLoadComplete) {
      console.log('🎯 Guest Session: Preventing wizard popup during initial load for template user');
      return;
    }
    
    // Check if wizard was manually closed recently (within last 5 seconds)
    const manuallyClosed = localStorage.getItem('okbuddy_wizard_manually_closed');
    if (manuallyClosed) {
      const closedTime = parseInt(manuallyClosed);
      const timeSinceClosed = Date.now() - closedTime;
      if (timeSinceClosed < 5000) { // 5 seconds cooldown
        console.log('🚫 Preventing wizard auto-trigger - user manually closed wizard recently');
        return;
      } else {
        // Clean up old flag
        localStorage.removeItem('okbuddy_wizard_manually_closed');
      }
    }
    
    console.log('🎯 Guest Session: Opening work experience wizard (user action or initial load complete)');
    
    if (useNewWizards) {
      // Open the new streamlined 2-step wizard
      setNewWizardOpen(true);
    } else {
      // Open the old 5-step wizard
      setNewExperienceWizard(true);
    }
  }, [cvData?.id, isInitialLoadComplete, useNewWizards]);

  // Provide the add function to parent component
  const addExperienceCallback = useCallback(() => {
    console.log('🔍 TRACE: addExperienceCallback called, stack:', new Error().stack);
    handleAddExperience();
  }, [handleAddExperience]);

  // Store the latest handleAddExperience in a ref to avoid stale closures
  const handleAddExperienceRef = useRef(handleAddExperience);
  handleAddExperienceRef.current = handleAddExperience;

  // Provide add function to parent - ONCE ONLY to prevent auto-popup after wizard completion
  useEffect(() => {
    if (onProvideAddFunction && !hasFunctionBeenProvided) {
      console.log('🔧 Providing add experience function to parent (one-time provision)');
      // Create a stable function that always calls the latest handleAddExperience
      const stableAddFunction = () => {
        console.log('🔍 TRACE: Stable add function called');
        handleAddExperienceRef.current();
      };
      onProvideAddFunction(stableAddFunction);
      setHasFunctionBeenProvided(true);
    }
  }, [onProvideAddFunction, hasFunctionBeenProvided]);

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

  // Handler for new streamlined wizard
  const handleNewWizardSave = async (experienceData: any) => {
    // Process the data similar to handleWizardSave but for new wizard
    setPendingExperience(experienceData);

    if (experienceData.aiGenerated) {
      setIsGenerating(true);
      
      try {
        const request: WizardBulletGenerationRequest = {
          jobTitle: experienceData.title,
          company: experienceData.company,
          project: experienceData.project || '',
          impact: experienceData.impact || '',
          responsibility: experienceData.responsibility || ''
        };

        const result = await aiService.generateBulletFromWizard(request);

        if (result.success && result.data) {
          const newExperience = {
            ...experienceData,
            bullets: [result.data]
          };
          
          const updatedItems = [...data.items, newExperience];
          
          onUpdate({
            ...data,
            items: updatedItems
          });

          // Auto-expand the newly created experience (regardless of CV source)
          setExpandedItems(prev => ({
            ...prev,
            [newExperience.id]: true
          }));
        } else {
          console.error('Failed to generate bullet:', result.error);
          const newExperience = {
            ...experienceData,
            bullets: ['']
          };
          
          const updatedItems = [...data.items, newExperience];
          
          onUpdate({
            ...data,
            items: updatedItems
          });

          // Auto-expand the newly created experience (regardless of CV source)
          setExpandedItems(prev => ({
            ...prev,
            [newExperience.id]: true
          }));
        }
      } catch (error) {
        console.error('Error generating bullet:', error);
        const newExperience = {
          ...experienceData,
          bullets: ['']
        };
        
        const updatedItems = [...data.items, newExperience];
        
        onUpdate({
          ...data,
          items: updatedItems
        });

        // Auto-expand the newly created experience (regardless of CV source)
        setExpandedItems(prev => ({
          ...prev,
          [newExperience.id]: true
        }));
      } finally {
        setIsGenerating(false);
      }
    } else {
      const updatedItems = [...data.items, experienceData];
      
      onUpdate({
        ...data,
        items: updatedItems
      });

      // Auto-expand the newly created experience (regardless of CV source)
      setExpandedItems(prev => ({
        ...prev,
        [experienceData.id]: true
      }));
    }

    setNewWizardOpen(false);
    setPendingExperience(null);
  };

  // Handler for new AI wizard (adding bullets to existing experience)
  const handleNewAIWizardGenerate = async (wizardData: any) => {
    if (newAIWizardIndex < 0) return;

    setIsGenerating(true);

    try {
      const experience = data.items[newAIWizardIndex];
      const request: WizardBulletGenerationRequest = {
        jobTitle: experience.title,
        company: experience.company,
        project: wizardData.project || '',
        impact: wizardData.impact || '',
        responsibility: wizardData.responsibility || ''
      };

      const result = await aiService.generateBulletFromWizard(request);

      if (result.success && result.data) {
        const updatedItems = [...data.items];
        updatedItems[newAIWizardIndex] = {
          ...updatedItems[newAIWizardIndex],
          bullets: [...updatedItems[newAIWizardIndex].bullets, result.data]
        };

        onUpdate({
          ...data,
          items: updatedItems
        });
      } else {
        console.error('Failed to generate bullet:', result.error);
        // Add empty bullet for user to fill
        const updatedItems = [...data.items];
        updatedItems[newAIWizardIndex] = {
          ...updatedItems[newAIWizardIndex],
          bullets: [...updatedItems[newAIWizardIndex].bullets, '']
        };

        onUpdate({
          ...data,
          items: updatedItems
        });
      }
    } catch (error) {
      console.error('Error generating bullet:', error);
    } finally {
      setIsGenerating(false);
      setNewAIWizardOpen(false);
      setNewAIWizardIndex(-1);
    }
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
    if (window.confirm(experienceTexts?.messages?.deleteConfirm || 'Are you sure you want to delete this work experience?')) {
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
      alert(experienceTexts?.messages?.aiRequiredAlert || 'Please fill in job title and company to use AI assistance');
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
      alert(experienceTexts?.messages?.aiGenerationRequiredAlert || 'Please enter job title and company before using AI');
      return;
    }

    if (useNewWizards) {
      // Open the new streamlined 1-step AI wizard
      setNewAIWizardIndex(experienceIndex);
      setNewAIWizardOpen(true);
    } else {
      // Open the old 3-step AI wizard
      setWizardModal({ isOpen: true, experienceIndex });
    }
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
      alert(experienceTexts?.messages?.aiDescriptionRequiredAlert || 'Please enter job title and company before generating description');
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
        alert(experienceTexts?.messages?.improveDescriptionError || 'Unable to improve description. Please try again.');
      }
    } catch (error) {
      console.error('Error improving bullets:', error);
      alert(experienceTexts?.messages?.improveDescriptionGeneralError || 'An error occurred while improving description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImproveSingleBullet = async (experienceIndex: number, bulletIndex: number) => {
    console.log('🎯 WorkExperience: Starting handleImproveSingleBullet', { experienceIndex, bulletIndex });
    
    const experience = data.items[experienceIndex];
    const bulletToImprove = experience.bullets[bulletIndex];
    
    console.log('📝 Bullet Details:', { 
      bulletToImprove, 
      experience: { title: experience.title, company: experience.company },
      currentLanguage 
    });
    
    if (!bulletToImprove || !bulletToImprove.trim()) {
      alert('Please add content to this bullet point before improving');
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare enhanced context with full CV data
      const otherExperiences = data.items.filter((_, index) => index !== experienceIndex);
      
      const contextData = {
        jobTitle: experience.title,
        company: experience.company,
        workExperience: otherExperiences,
        skills: cvData?.skills?.items || [],
        targetJob: cvData?.targetJobDescription || '',
        language: currentLanguage,
        bulletIndex: bulletIndex
      };

      console.log('🔧 Calling AI Service with context:', contextData);
      
      // Use the new dedicated single bullet improvement method
      const result = await aiService.improveSingleBullet(bulletToImprove, contextData);

      if (result.success && result.data) {
        const updatedItems = [...data.items];
        updatedItems[experienceIndex].bullets[bulletIndex] = result.data;
        onUpdate({
          ...data,
          items: updatedItems
        });

        // Mark AI as used for score calculation (will be implemented)
        // markAIUsed('workExperience');
      } else {
        console.error('Failed to improve bullet:', result.error);
        alert(experienceTexts?.messages?.improveDescriptionError || 'Unable to improve description. Please try again.');
      }
    } catch (error) {
      console.error('Error improving bullet:', error);
      alert(experienceTexts?.messages?.improveDescriptionGeneralError || 'An error occurred while improving description. Please try again.');
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
    const baseClass = 'flex-1 p-2 pl-2 pr-56 border rounded-md min-h-[60px] resize-none transition-all duration-200';
    return `${baseClass} border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200`;
  };

  const getBulletLengthIndicator = (bullet: string) => {
    // Show character count for all bullets when they have content
    if (bullet.length > 0) {
      return (
        <div className="text-black text-xs mt-1 text-right whitespace-nowrap">
          {bullet.length}/200
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
                {experienceTexts?.messages?.buildExperienceTitle || 'Build Impressive Work Experience in 5 Seconds!'}
              </h4>
              <p className="text-sm text-primary-500 mb-2">
                {experienceTexts?.guidance || 'Just enter job title and company name - OkBuddy AI will help you create a work experience description instantly.'}
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
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium">{experienceTexts?.fields?.description || 'Description'} <span className="text-red-500 text-xs">*</span></label>
                <button
                  onClick={() => handleOpenTemplates(index)}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <FileTextIcon size={16} />
                  {currentLanguage === 'vi' ? 'Dùng mẫu' : 'Use template'}
                </button>
              </div>

              {/* Show informational message if either field is not filled */}
              {(!experience.title || !experience.company) && (
                <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-3 mb-3">
                  <p className="text-sm text-warning-500 font-medium">
                    💡 {experienceTexts?.messages?.basicInfoHint || 'Start with basic information'}
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
                    <div className="relative flex-1">
                      <textarea 
                        className={`${getBulletClassName(bullet)} w-full`}
                        value={bullet} 
                        onChange={(e) => handleUpdateBullet(index, bulletIndex, e.target.value)}
                        onBlur={(e) => handleBulletBlur(index, bulletIndex, e.target.value)}
                        onKeyDown={(e) => handleBulletKeyDown(index, bulletIndex, e)}
                        placeholder={experienceTexts?.bullets?.placeholder || 'Describe a specific achievement or responsibility...'}
                        rows={4}
                        data-experience-index={index}
                        data-bullet-index={bulletIndex}
                      />
                      <div className="absolute right-3 top-2 flex flex-col gap-2 items-end">
                        <AIAssistButton 
                          label={experienceTexts?.bullets?.aiGenerate || 'Improve with OkBuddy AI'} 
                          onClick={() => handleImproveSingleBullet(index, bulletIndex)}
                          disabled={buttonStates.improveButton.disabled}
                          variant={buttonStates.improveButton.variant}
                          size={buttonStates.improveButton.size}
                        />
                        <button 
                          className="text-error-500 hover:text-error-600 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                          onClick={() => handleRemoveBullet(index, bulletIndex)}
                          title={experienceTexts?.bullets?.remove || 'Remove'}
                        >
                          <TrashIcon size={16} />
                        </button>
                        {getBulletLengthIndicator(bullet)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                className="flex items-center text-sm mt-2 transition-colors"
                style={{ color: '#0177bd' }}
                onClick={() => handleOpenWizard(index)}
              >
                <PlusIcon size={14} className="mr-1" />
                {experienceTexts?.bullets?.add || 'Add Achievement'}
              </button>
              
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
        className={`flex items-center justify-center w-full py-3 border-2 border-solid rounded-lg transition-colors ${
          data.items.length === 0 
            ? 'text-white' 
            : 'bg-white hover:bg-blue-50'
        }`}
        style={
          data.items.length === 0 
            ? { backgroundColor: '#0177bd', borderColor: '#0177bd' }
            : { borderColor: '#0177bd', color: '#0177bd' }
        }
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
        language={currentLanguage}
      />

      {/* New Work Experience Wizard */}
      <WorkExperienceWizard
        isOpen={newExperienceWizard}
        onClose={() => setNewExperienceWizard(false)}
        onSave={handleWizardSave}
        isGenerating={isGenerating}
      />

      {/* New Streamlined Wizards */}
      {useNewWizards && (
        <>
          {/* New 2-Step Work Experience Wizard */}
          <NewWorkExperienceWizard
            isOpen={newWizardOpen}
            onClose={() => setNewWizardOpen(false)}
            onSave={handleNewWizardSave}
            isGenerating={isGenerating}
          />

          {/* New 1-Step AI Wizard for adding bullets */}
          <NewAIWizardModal
            isOpen={newAIWizardOpen}
            onClose={() => {
              setNewAIWizardOpen(false);
              setNewAIWizardIndex(-1);
            }}
            onGenerate={handleNewAIWizardGenerate}
            jobTitle={newAIWizardIndex >= 0 ? data.items[newAIWizardIndex]?.title || '' : ''}
            company={newAIWizardIndex >= 0 ? data.items[newAIWizardIndex]?.company || '' : ''}
            isGenerating={isGenerating}
          />
        </>
      )}
    </div>
  );
};