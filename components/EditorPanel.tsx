'use client'

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ContactSection } from './sections/ContactSection';
import { SummarySection } from './sections/SummarySection';
import { WorkExperienceSection } from './sections/WorkExperienceSection';
import { SkillsSection } from './sections/SkillsSection';
import { EducationSection } from './sections/EducationSection';
import { DraggableSection } from './common/DraggableSection';
import { ScoreIndicator } from './common/ScoreIndicator';
import { XIcon, Sparkles, CheckCircle } from 'lucide-react';
import { CVWorkflowDataService } from '../shared/services/cvWorkflowDataService';
import { jdAnalysisTexts, getTexts } from '../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../config/languageConfig';
import { UpgradeModal } from './common/UpgradeModal';
import { CVFeedbackPanel } from './common/CVFeedbackPanel';
// JD optimization components removed - using new LLM-based CV parser
// Mock services for build compatibility
const mockFetch = async (url: string, options?: any) => {
  console.log('Mock fetch called:', url, options);
  return { ok: true, json: () => Promise.resolve({}) };
};

const JDOptimizationService = {
  getInstance: () => ({
    generateUnifiedAnalysis: async (jdInput: string, cvData: any, language: string) => {
      const response = await fetch('/api/cv/jd-analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText: jdInput, cvData, language }),
      });
      if (!response.ok) throw new Error('Analysis request failed');
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Analysis failed');
      return result.data;
    }
  })
};

interface EditorPanelProps {
  cvData: any;
  onUpdateSection: (sectionId: string, data: any) => void;
  onSectionOrderChange: (newOrder: string[]) => void;
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
  cvScore: number;
  suggestions?: {
    [sectionId: string]: any[];
  };
  onApplySuggestion?: (sectionId: string, suggestion: any) => void;
  onDismissSuggestion?: (sectionId: string, suggestion: any) => void;
  language?: SupportedLanguage;
}

// Simple error boundary for CVFeedbackPanel
class FeedbackPanelErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, errorMsg: '' }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: String(error) }
  }
  componentDidCatch(error: any) {
    console.error('❌ CVFeedbackPanel crashed:', error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-100 border-2 border-red-500 rounded-lg px-6 py-4 text-sm text-red-700 font-bold">
          ❌ CVFeedbackPanel crashed: {this.state.errorMsg}
        </div>
      )
    }
    return this.props.children
  }
}

// Available section types that can be added - will be populated with dynamic text
const getAvailableSectionTypes = (editorTexts: any) => {
  if (!editorTexts?.availableSections) {
    return [
      { id: 'projects', name: 'Projects', description: 'Completed projects' },
      { id: 'volunteer', name: 'Volunteer Work', description: 'Volunteer and social experience' },
      { id: 'certifications', name: 'Certifications', description: 'Professional certifications' },
      { id: 'languages', name: 'Languages', description: 'Languages known' },
      { id: 'hobbies', name: 'Hobbies', description: 'Personal interests' },
      { id: 'custom', name: 'Custom Section', description: 'Create new section with custom content' }
    ];
  }
  
  return [
    { id: 'projects', name: editorTexts.availableSections.projects.name, description: editorTexts.availableSections.projects.description },
    { id: 'volunteer', name: editorTexts.availableSections.volunteer.name, description: editorTexts.availableSections.volunteer.description },
    { id: 'certifications', name: editorTexts.availableSections.certifications.name, description: editorTexts.availableSections.certifications.description },
    { id: 'languages', name: editorTexts.availableSections.languages.name, description: editorTexts.availableSections.languages.description },
    { id: 'hobbies', name: editorTexts.availableSections.hobbies.name, description: editorTexts.availableSections.hobbies.description },
    { id: 'custom', name: editorTexts.availableSections.custom.name, description: editorTexts.availableSections.custom.description }
  ];
};

export const EditorPanel = ({
  cvData,
  onUpdateSection,
  onSectionOrderChange,
  activeSection,
  setActiveSection,
  cvScore,
  suggestions = {},
  onApplySuggestion,
  onDismissSuggestion,
  language
}: EditorPanelProps) => {
  console.log('🟦 EditorPanel rendering, cvData:', !!cvData)
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

  // Language and text configuration
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('vi');
  const [editorTexts, setEditorTexts] = useState<any>(null);
  
  // Load language configuration
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
        const effectiveLanguage = language || savedLanguage || detectLanguage().language;

        console.log('🌐 EditorPanel loading language:', {
          prop: language,
          saved: savedLanguage,
          effective: effectiveLanguage
        });

        setCurrentLanguage(effectiveLanguage);
        const texts = await getTexts('cvEditor', effectiveLanguage);
        setEditorTexts(texts);

        console.log('📝 EditorPanel loaded texts for language:', effectiveLanguage);
      } catch (error) {
        console.error('Failed to load editor texts:', error);
        setCurrentLanguage('vi');
      }
    };

    loadLanguage();
  }, [language]);
  
  // JD Analysis state
  const [jdInput, setJdInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [lastAnalysisId, setLastAnalysisId] = useState<string | null>(null);
  
  // Apply All state
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [applyAllProgress, setApplyAllProgress] = useState({ current: 0, total: 0 });
  
  // Monetization state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [userCredits, setUserCredits] = useState(3);

  // Add work experience function from WorkExperienceSection
  const [addWorkExperienceFunction, setAddWorkExperienceFunction] = useState<(() => void) | null>(null);

  // Initialize data service
  const dataService = CVWorkflowDataService.getInstance();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id && cvData?.sectionOrder) {
      const oldIndex = cvData.sectionOrder.indexOf(active.id);
      const newIndex = cvData.sectionOrder.indexOf(over.id);
      const newOrder = arrayMove(cvData.sectionOrder, oldIndex, newIndex) as string[];
      onSectionOrderChange(newOrder);
    }
  };

  const handleNavigateToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    // Scroll to section if needed
    const sectionElement = document.getElementById(`section-${sectionId}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Monetization functions
  const checkSubscriptionStatus = () => {
    // Check localStorage for subscription status (mock implementation)
    const testSubscription = localStorage.getItem('okbuddy_test_subscription');
    if (testSubscription) {
      try {
        const subscription = JSON.parse(testSubscription);
        setIsPremiumUser(subscription.plan === 'premium' || subscription.plan === 'enterprise');
      } catch (error) {
        setIsPremiumUser(false);
      }
    } else {
      setIsPremiumUser(false);
    }
    
    // Check credits
    const savedCredits = localStorage.getItem('okbuddy_user_credits');
    if (savedCredits) {
      setUserCredits(parseInt(savedCredits, 10) || 0);
    }
  };

  const canUseApplyAll = (): boolean => {
    return true;
  };

  const canUsePremiumSuggestion = (): boolean => {
    return true;
  };

  const consumeCredit = () => {
    if (userCredits > 0) {
      const newCredits = userCredits - 1;
      setUserCredits(newCredits);
      localStorage.setItem('okbuddy_user_credits', newCredits.toString());
    }
  };



  // JD Analysis handlers
  const handleJdInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJdInput(value);
    setAnalysisError(null);
    
    // Auto-save to localStorage
    localStorage.setItem('okbuddy_jd_draft', value);
  };

  const handleAnalyzeJob = async () => {
    console.log('🔥 handleAnalyzeJob triggered', { jdInput: jdInput.length, cvData: !!cvData });
    console.log('🔍 Full CV Data Structure:', JSON.stringify(cvData, null, 2));
    
    if (!jdInput.trim()) {
      setAnalysisError(editorTexts?.editorPanel?.jobAnalysis?.errors?.required || 'Please enter job description to analyze');
      return;
    }

    if (jdInput.length > 5000) {
      setAnalysisError(editorTexts?.editorPanel?.jobAnalysis?.errors?.tooLong || 'Job description too long (maximum 5000 characters)');
      return;
    }

    // Clear old analysis results first
    setAnalysisResults(null);
    setMissingKeywords([]);
    setMatchedKeywords([]);
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    console.log('🔄 Starting fresh analysis, cleared old results');

    try {
      console.log('🚀 Starting Feature 4 unified analysis...');
      
      // NEW: Use the unified analysis service directly
      const jdOptimizationService = JDOptimizationService.getInstance();
      console.log('✅ JD Optimization service instance created');
      
      const result = await jdOptimizationService.generateUnifiedAnalysis(
        jdInput,
        cvData,
        'vi' // TODO: Get from language context
      );
      
      console.log('🎉 Analysis result received:', result);
      
      // Save complete analysis results to state
      setAnalysisResults(result);
      setLastAnalysisId(result.analysisId);
      
      // Update keywords from analysis result
      if (result.jobMatch?.missingKeywords) {
        setMissingKeywords(result.jobMatch.missingKeywords);
        console.log('📝 Missing keywords updated:', result.jobMatch.missingKeywords);
      }
      if (result.jobMatch?.matchedKeywords) {
        setMatchedKeywords(result.jobMatch.matchedKeywords);
        console.log('✅ Matched keywords updated:', result.jobMatch.matchedKeywords);
      }
      
      // Save to database with fallback to localStorage
      if (cvData?.id) {
        try {
          const saveResult = await dataService.saveJDAnalysis(cvData.id, {
            ...result,
            originalJobDescription: jdInput
          });
          if (saveResult.success) {
            console.log('💾 JD Analysis saved to database successfully');
          } else {
            console.warn('⚠️ Failed to save to database:', saveResult.error);
          }
        } catch (error) {
          console.error('❌ Error saving analysis to database:', error);
        }
      }
      
      console.log('🎯 Unified JD Analysis completed successfully!');
      
    } catch (error) {
      console.error('❌ JD Analysis Error:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      setAnalysisError(
        error instanceof Error 
          ? `${currentLanguage === 'en' ? 'Analysis error' : 'Lỗi phân tích'}: ${error.message}` 
          : editorTexts?.editorPanel?.jobAnalysis?.errors?.analysisFailed || 'An error occurred while analyzing the job description. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
      console.log('🏁 Analysis process completed, isAnalyzing set to false');
    }
  };

  // Handle Apply All functionality
  const handleApplyAll = async () => {
    if (!analysisResults?.suggestions) return;

    // Check premium access for Apply All
    if (!canUseApplyAll()) {
      setShowUpgradeModal(true);
      return;
    }

    // Count total suggestions
    const allSuggestions = Object.values(analysisResults.suggestions).flat();
    const totalSuggestions = allSuggestions.length;
    
    if (totalSuggestions === 0) return;

    setIsApplyingAll(true);
    setApplyAllProgress({ current: 0, total: totalSuggestions });

    try {
      let appliedCount = 0;

      // Apply suggestions sequentially by section
      const sectionOrder = ['summary', 'experience', 'skills', 'education', 'other'];
      
      for (const section of sectionOrder) {
        const sectionSuggestions = analysisResults.suggestions[section] || [];
        
        for (const suggestion of sectionSuggestions) {
          try {
            await handleApplySuggestion(suggestion);
            appliedCount++;
            setApplyAllProgress({ current: appliedCount, total: totalSuggestions });
            
            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            console.error('Error applying suggestion:', suggestion.id, error);
            // Continue with next suggestion even if one fails
          }
        }
      }

      // Clear analysis results after successful application
      if (appliedCount > 0) {
        setAnalysisResults(null);
        setMissingKeywords([]);
      }

    } catch (error) {
      console.error('Apply All Error:', error);
      setAnalysisError('Đã xảy ra lỗi khi áp dụng gợi ý. Vui lòng thử lại.');
    } finally {
      setIsApplyingAll(false);
      setApplyAllProgress({ current: 0, total: 0 });
    }
  };

  // Load saved JD and analysis results on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Load JD input from localStorage
      const savedJd = localStorage.getItem('okbuddy_jd_draft');
      if (savedJd) {
        setJdInput(savedJd);
      }
      
      // Try to load analysis from database first, then fallback to localStorage
      if (cvData?.id) {
        try {
          const dbResult = await dataService.loadJDAnalysis(cvData.id);
          if (dbResult.success && dbResult.data) {
            setAnalysisResults(dbResult.data);
            setLastAnalysisId(dbResult.data.analysisId);
            
            if (dbResult.data.jobMatch?.missingKeywords) {
              setMissingKeywords(dbResult.data.jobMatch.missingKeywords);
            }
            if (dbResult.data.jobMatch?.matchedKeywords) {
              setMatchedKeywords(dbResult.data.jobMatch.matchedKeywords);
            }
            return; // Found in database, skip localStorage check
          }
        } catch (error) {
          console.error('Error loading analysis from database:', error);
        }
      }
      
      // Fallback to localStorage
      const savedAnalysis = localStorage.getItem('okbuddy_jd_analysis');
      const savedAnalysisId = localStorage.getItem('okbuddy_jd_analysis_id');
      
      if (savedAnalysis && savedAnalysisId) {
        try {
          const parsedAnalysis = JSON.parse(savedAnalysis);
          setAnalysisResults(parsedAnalysis);
          setLastAnalysisId(savedAnalysisId);
          
                      // Load keywords if available
            if (parsedAnalysis.jobMatch?.missingKeywords) {
              setMissingKeywords(parsedAnalysis.jobMatch.missingKeywords);
            }
            if (parsedAnalysis.jobMatch?.matchedKeywords) {
              setMatchedKeywords(parsedAnalysis.jobMatch.matchedKeywords);
            }
        } catch (error) {
          console.error('Error loading saved analysis:', error);
          // Clear corrupted data
          localStorage.removeItem('okbuddy_jd_analysis');
          localStorage.removeItem('okbuddy_jd_analysis_id');
        }
      }
    };
    
    loadInitialData();
  }, [cvData?.id]);

  // Auto-trigger JD analysis when CV data and JD input are available but no analysis exists
  useEffect(() => {
    const autoTriggerAnalysis = async () => {
      // Only auto-trigger if we have both CV data and JD input, but no existing analysis
      if (cvData && jdInput.trim() && !analysisResults && !isAnalyzing) {
        console.log('🤖 Auto-triggering JD analysis with available data...');
        console.log('📊 CV Data available:', !!cvData);
        console.log('📋 JD Input length:', jdInput.length);
        console.log('🔍 Analysis Results:', !!analysisResults);
        
        // Wait a short delay to ensure UI is ready
        setTimeout(() => {
          handleAnalyzeJob();
        }, 1000);
      }
    };

    autoTriggerAnalysis();
  }, [cvData, jdInput, analysisResults]);
  
  // Auto-save analysis results to localStorage
  useEffect(() => {
    if (analysisResults && lastAnalysisId) {
      localStorage.setItem('okbuddy_jd_analysis', JSON.stringify(analysisResults));
      localStorage.setItem('okbuddy_jd_analysis_id', lastAnalysisId);
    }
  }, [analysisResults, lastAnalysisId]);



  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Handle applying individual suggestions
  const handleApplySuggestion = async (suggestion: any) => {
    try {
      console.log('Applying suggestion:', suggestion);

      // Apply suggestion directly to the relevant CV section
      const sectionId = suggestion.sectionId || suggestion.section;
      if (sectionId === 'summary' && suggestion.suggestedText) {
        onUpdateSection('summary', { ...cvData.summary, content: suggestion.suggestedText });
      } else if (sectionId === 'skills' && suggestion.addedKeywords?.length > 0) {
        const existingItems = cvData.skills?.items || [];
        const existingNames = existingItems.map((s: any) => typeof s === 'string' ? s.toLowerCase() : (s?.name || '').toLowerCase());
        const newKeywords = suggestion.addedKeywords.filter((kw: string) => !existingNames.includes(kw.toLowerCase()));
        if (newKeywords.length > 0) {
          onUpdateSection('skills', { ...cvData.skills, items: [...existingItems, ...newKeywords] });
        }
      } else if (sectionId === 'experience' && suggestion.suggestedText) {
        // Update first experience item's bullets if suggestedText exists
        const expItems = [...(cvData.experience?.items || [])];
        if (expItems.length > 0) {
          expItems[0] = { ...expItems[0], bullets: [...(expItems[0].bullets || []), suggestion.suggestedText] };
          onUpdateSection('experience', { ...cvData.experience, items: expItems });
        }
      }

      // Remove suggestion from list
      setAnalysisResults((prev: any) => {
        if (!prev || !prev.suggestions) return prev;
        const updatedSuggestions = { ...prev.suggestions };
        const key = suggestion.sectionId || suggestion.section;
        const sectionSuggestions = updatedSuggestions[key] || [];
        updatedSuggestions[key] = sectionSuggestions.filter(
          (s: any) => s.id !== suggestion.id
        );
        return { ...prev, suggestions: updatedSuggestions };
      });

      console.log('Suggestion applied successfully:', suggestion.id);
    } catch (error) {
      console.error('Error applying suggestion:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi áp dụng gợi ý. Vui lòng thử lại.');
    }
  };

  const handleDismissSuggestion = (sectionId: string, suggestion: any) => {
    if (onDismissSuggestion) {
      onDismissSuggestion(sectionId, suggestion);
    }
  };

  const handleAddSection = (sectionType: string) => {
    const newSectionId = `${sectionType}-${Date.now()}`;
    
    // Create default data structure based on section type
    let defaultData;
    switch (sectionType) {
      case 'projects':
        defaultData = {
          items: [{
            id: `project-${Date.now()}`,
            title: '',
            description: '',
            technologies: [],
            startDate: '',
            endDate: '',
            url: ''
          }]
        };
        break;
      case 'volunteer':
        defaultData = {
          items: [{
            id: `volunteer-${Date.now()}`,
            organization: '',
            role: '',
            description: '',
            startDate: '',
            endDate: ''
          }]
        };
        break;
      case 'certifications':
        defaultData = {
          items: [{
            id: `cert-${Date.now()}`,
            name: '',
            issuer: '',
            date: '',
            url: ''
          }]
        };
        break;
      case 'languages':
        defaultData = {
          items: []
        };
        break;
      case 'hobbies':
        defaultData = {
          content: ''
        };
        break;
      case 'custom':
        defaultData = {
          title: 'Phần mới',
          content: ''
        };
        break;
      default:
        defaultData = { content: '' };
    }

    // Add to CV data
    onUpdateSection(newSectionId, defaultData);
    
    // Add to section order
    const newOrder = [...(cvData?.sectionOrder || []), newSectionId];
    onSectionOrderChange(newOrder);
    
    // Close modal and activate new section
    setShowAddSectionModal(false);
    setActiveSection(newSectionId);
    
    // Scroll to new section after a brief delay
    setTimeout(() => {
      const sectionElement = document.getElementById(`section-${newSectionId}`);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleDeleteSection = (sectionId: string) => {
    // Remove from section order
    const newOrder = (cvData?.sectionOrder || []).filter((id: string) => id !== sectionId);
    onSectionOrderChange(newOrder);
    
    // Remove section data by setting it to undefined
    onUpdateSection(sectionId, undefined);
    
    // If the deleted section was active, clear active section
    if (activeSection === sectionId) {
      setActiveSection(null);
    }
  };

  const handleSectionTitleChange = (sectionId: string, newTitle: string) => {
    // Update section titles in CV data
    const updatedTitles = {
      ...cvData.sectionTitles,
      [sectionId]: newTitle
    };
    
    // Create a temporary CV data object to update section titles
    const updatedCvData = {
      ...cvData,
      sectionTitles: updatedTitles
    };
    
    // We need to call onUpdateSection with a special key for section titles
    onUpdateSection('sectionTitles', updatedTitles);
  };

  const handleApplySuggestionInternal = (sectionId: string, suggestion: any) => {
    if (onApplySuggestion) {
      onApplySuggestion(sectionId, suggestion);
    }
  };

  const handleDismissSuggestionInternal = (sectionId: string, suggestion: any) => {
    if (onDismissSuggestion) {
      onDismissSuggestion(sectionId, suggestion);
    }
  };

  const renderSection = (sectionId: string) => {
    const commonProps = {
      cvData,
      onNavigateToSection: handleNavigateToSection,
      isActive: activeSection === sectionId,
      language: currentLanguage
    };

    switch (sectionId) {
      case 'contact':
        return (
          <ContactSection
            data={cvData.contact}
            onUpdate={(data: any) => onUpdateSection('contact', data)}
            {...commonProps}
          />
        );
      case 'summary':
        return (
          <SummarySection
            data={cvData.summary}
            onUpdate={(data: any) => onUpdateSection('summary', data)}
            {...commonProps}
          />
        );
      case 'experience':
        return (
          <WorkExperienceSection
            data={cvData.experience}
            onUpdate={(data: any) => onUpdateSection('experience', data)}
            onProvideAddFunction={setAddWorkExperienceFunction}
            {...commonProps}
          />
        );
      case 'skills':
        return (
          <SkillsSection
            data={cvData.skills}
            onUpdate={(data: any) => onUpdateSection('skills', data)}
            {...commonProps}
          />
        );
      case 'education':
        return (
          <EducationSection
            data={cvData.education}
            onUpdate={(data: any) => onUpdateSection('education', data)}
            {...commonProps}
          />
        );
      default: {
        const sectionData = cvData[sectionId];
        if (!sectionData) return null;

        const baseType = sectionId.replace(/-\d+$/, '');

        // Projects
        if (baseType === 'projects') {
          const items: any[] = sectionData.items || [];
          const updateItems = (newItems: any[]) => onUpdateSection(sectionId, { ...sectionData, items: newItems });
          return (
            <div className="space-y-4">
              {items.map((item: any, idx: number) => (
                <div key={item.id || idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Dự án {idx + 1}</span>
                    <button onClick={() => updateItems(items.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:text-red-700">Xóa</button>
                  </div>
                  <input className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Tên dự án" value={item.title || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, title: e.target.value } : it))} />
                  <textarea className="w-full p-2 border border-gray-300 rounded text-sm min-h-[80px]" placeholder="Mô tả dự án" value={item.description || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))} />
                  <input className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Công nghệ sử dụng (React, Node.js...)" value={(item.technologies || []).join(', ')} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, technologies: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) } : it))} />
                  <div className="flex gap-2">
                    <input className="flex-1 p-2 border border-gray-300 rounded text-sm" placeholder="Ngày bắt đầu" value={item.startDate || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, startDate: e.target.value } : it))} />
                    <input className="flex-1 p-2 border border-gray-300 rounded text-sm" placeholder="Ngày kết thúc" value={item.endDate || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, endDate: e.target.value } : it))} />
                  </div>
                  <input className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Link dự án (tùy chọn)" value={item.url || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, url: e.target.value } : it))} />
                </div>
              ))}
              <button onClick={() => updateItems([...items, { id: `project-${Date.now()}`, title: '', description: '', technologies: [], startDate: '', endDate: '', url: '' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600">
                + Thêm dự án
              </button>
            </div>
          );
        }

        // Volunteer
        if (baseType === 'volunteer') {
          const items: any[] = sectionData.items || [];
          const updateItems = (newItems: any[]) => onUpdateSection(sectionId, { ...sectionData, items: newItems });
          return (
            <div className="space-y-4">
              {items.map((item: any, idx: number) => (
                <div key={item.id || idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Hoạt động {idx + 1}</span>
                    <button onClick={() => updateItems(items.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:text-red-700">Xóa</button>
                  </div>
                  <input className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Tổ chức" value={item.organization || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, organization: e.target.value } : it))} />
                  <input className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Vai trò" value={item.role || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, role: e.target.value } : it))} />
                  <textarea className="w-full p-2 border border-gray-300 rounded text-sm min-h-[80px]" placeholder="Mô tả hoạt động" value={item.description || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))} />
                  <div className="flex gap-2">
                    <input className="flex-1 p-2 border border-gray-300 rounded text-sm" placeholder="Ngày bắt đầu" value={item.startDate || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, startDate: e.target.value } : it))} />
                    <input className="flex-1 p-2 border border-gray-300 rounded text-sm" placeholder="Ngày kết thúc" value={item.endDate || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, endDate: e.target.value } : it))} />
                  </div>
                </div>
              ))}
              <button onClick={() => updateItems([...items, { id: `volunteer-${Date.now()}`, organization: '', role: '', description: '', startDate: '', endDate: '' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600">
                + Thêm hoạt động
              </button>
            </div>
          );
        }

        // Certifications
        if (baseType === 'certifications') {
          const items: any[] = sectionData.items || [];
          const updateItems = (newItems: any[]) => onUpdateSection(sectionId, { ...sectionData, items: newItems });
          return (
            <div className="space-y-4">
              {items.map((item: any, idx: number) => (
                <div key={item.id || idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Chứng chỉ {idx + 1}</span>
                    <button onClick={() => updateItems(items.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:text-red-700">Xóa</button>
                  </div>
                  <input className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Tên chứng chỉ" value={item.name || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))} />
                  <input className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Tổ chức cấp" value={item.issuer || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, issuer: e.target.value } : it))} />
                  <input className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Ngày cấp" value={item.date || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, date: e.target.value } : it))} />
                  <input className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Link xác minh (tùy chọn)" value={item.url || ''} onChange={e => updateItems(items.map((it, i) => i === idx ? { ...it, url: e.target.value } : it))} />
                </div>
              ))}
              <button onClick={() => updateItems([...items, { id: `cert-${Date.now()}`, name: '', issuer: '', date: '', url: '' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600">
                + Thêm chứng chỉ
              </button>
            </div>
          );
        }

        // Fallback: textarea for hobbies, custom, etc.
        return (
          <div className="space-y-4">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md min-h-[120px] text-sm"
              value={sectionData.content || ''}
              onChange={(e) => onUpdateSection(sectionId, { ...sectionData, content: e.target.value })}
              placeholder="Nhập nội dung cho phần này..."
            />
          </div>
        );
      }
    }
  };

  return (
    <div className="w-full">
      {/* CV Feedback & Scoring Panel */}
      {(() => { console.log('🔴 RENDER: about to render CVFeedbackPanel') ; return null })()}
      <div className="mb-6">
        <CVFeedbackPanel cvData={cvData} language={currentLanguage} />
      </div>

      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{editorTexts?.editorPanel?.title || 'Edit CV'}</h2>
            {/* Inline CV Score */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{editorTexts?.editorPanel?.cvScore?.title || 'CV Completeness'}</span>
              <ScoreIndicator score={cvScore} />
            </div>
          </div>
        </div>
      </div>

      {/* Job Description Analysis Panel - Separated as distinct section */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="px-6 py-6" data-jd-analysis-section>
          <div className="space-y-4">
            {/* Title Group - Following Design Spec */}
            <div className="flex flex-row items-center gap-4 mb-6">
              {/* Icon Container */}
              <div className="flex flex-col justify-center items-center p-0 w-12 h-12 bg-blue-50 rounded-xl">
                {/* Target Icon with Vector Implementation */}
                <div className="relative w-6 h-6">
                  {/* Outer circle */}
                  <div className="absolute inset-[8.33%] border-2 border-blue-600 rounded-full"></div>
                  {/* Middle circle */}
                  <div className="absolute inset-[25%] border-2 border-blue-600 rounded-full"></div>
                  {/* Inner circle */}
                  <div className="absolute inset-[41.67%] border-2 border-blue-600 rounded-full"></div>
                </div>
              </div>

                             {/* Title Text */}
               <div className="flex flex-col items-start gap-1.5 flex-1">
                 <h3 className="text-lg font-semibold leading-6 text-slate-800">
                   {editorTexts?.editorPanel?.jobAnalysis?.title || 'Job Description Analysis'}
                 </h3>
                 <p className="text-sm font-normal leading-5 text-slate-500">
                   {editorTexts?.editorPanel?.jobAnalysis?.subtitle || 'OkBuddy helps you analyze job descriptions and provides optimization suggestions for your CV'}
                 </p>
               </div>
              <button 
                onClick={handleAnalyzeJob}
                className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isAnalyzing || !jdInput.trim()}
              >
                {isAnalyzing && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isAnalyzing ? (editorTexts?.editorPanel?.jobAnalysis?.analyzing || 'Analyzing...') : (editorTexts?.editorPanel?.jobAnalysis?.analyzeButton || 'Analyze')}
              </button>
            </div>
            
            {/* JD Input Section */}
            <div className="space-y-3">

              
              <div className="relative">
                <textarea
                  id="jd-input"
                  value={jdInput}
                  onChange={handleJdInputChange}
                  className={`w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs leading-relaxed ${
                    analysisError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={editorTexts?.editorPanel?.jobAnalysis?.placeholder || 'Paste the job description here to receive CV optimization suggestions...'}
                  maxLength={3000}
                />
                
                <div className={`absolute bottom-2 right-2 text-xs ${
                  jdInput.length > 2900 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {jdInput.length}/3000
                </div>
              </div>
              
              {/* Error State */}
              {analysisError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-800 font-medium">{analysisError}</p>
                  </div>
                </div>
              )}
              
              {/* Analysis Results */}
              {analysisResults && (
                <div className="space-y-4 mt-2">
                  {/* Score + Keywords */}
                  <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-primary-600">{analysisResults.jobMatch?.overallScore ?? 0}%</div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Độ phù hợp với JD</p>
                        {analysisResults.jobMatch?.matchedKeywords?.length > 0 && (
                          <p className="text-xs text-slate-500">{analysisResults.jobMatch.matchedKeywords.length} từ khoá khớp</p>
                        )}
                      </div>
                    </div>

                    {analysisResults.jobMatch?.missingKeywords?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-1">Từ khoá còn thiếu:</p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResults.jobMatch.missingKeywords.map((kw: string) => (
                            <span key={kw} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResults.jobMatch?.matchedKeywords?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-1">Từ khoá đã có:</p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResults.jobMatch.matchedKeywords.map((kw: string) => (
                            <span key={kw} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggestions */}
                  {analysisResults.suggestions && Object.entries(analysisResults.suggestions).map(([section, suggestions]) => {
                    const typedSuggestions = Array.isArray(suggestions) ? suggestions : [suggestions];
                    if (!typedSuggestions.length) return null;
                    const sectionTitles: Record<string, string> = {
                      summary: 'Tóm tắt chuyên môn',
                      experience: 'Kinh nghiệm làm việc',
                      skills: 'Kỹ năng',
                      education: 'Học vấn'
                    };
                    return (
                      <div key={section} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                          <span className="text-xs font-semibold text-slate-600">{sectionTitles[section] || section}</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {typedSuggestions.map((s: any, i: number) => {
                            const id = s?.id || `${section}-${i}`;
                            const addedKeywords: string[] = Array.isArray(s?.addedKeywords) ? s.addedKeywords : [];
                            const normalized = { id, sectionId: section, title: s?.title || '', description: s?.description || '', priority: s?.priority || 'medium', suggestedText: s?.suggestedText || '', addedKeywords };
                            const priorityColors: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };
                            const priorityLabels: Record<string, string> = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' };
                            return (
                              <div key={id} className="px-3 py-3 flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[normalized.priority]}`}>{priorityLabels[normalized.priority]}</span>
                                  </div>
                                  <p className="text-sm font-medium text-slate-800">{normalized.title}</p>
                                  {normalized.description && <p className="text-xs text-slate-500 mt-0.5">{normalized.description}</p>}
                                  {addedKeywords.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {addedKeywords.map((kw: string) => (
                                        <span key={kw} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">{kw}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleApplySuggestion(normalized)}
                                  className="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600"
                                >
                                  Áp dụng
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* CV Sections */}
      <div className="bg-white rounded-lg shadow-sm">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={cvData?.sectionOrder || []} 
            strategy={verticalListSortingStrategy}
          >
            <div className="p-4 space-y-4">
              {(cvData?.sectionOrder || []).map((sectionId: string) => (
                <div key={sectionId} id={`section-${sectionId}`}>
                  <DraggableSection
                    id={sectionId}
                    onActivate={() => setActiveSection(sectionId)}
                    isActive={activeSection === sectionId}
                    onDelete={() => handleDeleteSection(sectionId)}
                    customTitle={cvData.sectionTitles?.[sectionId]}
                    onTitleChange={handleSectionTitleChange}
                    suggestions={suggestions[sectionId] || []}
                    onApplySuggestion={handleApplySuggestionInternal}
                    onDismissSuggestion={handleDismissSuggestionInternal}
                    onAddItem={sectionId === 'experience' ? addWorkExperienceFunction || undefined : undefined}
                    experienceCount={sectionId === 'experience' ? cvData.experience?.items?.length || 0 : undefined}
                    language={currentLanguage}
                  >
                    {renderSection(sectionId)}
                  </DraggableSection>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add Section Button */}
        <div className="p-4 border-t border-gray-200">
          <button 
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
            onClick={() => setShowAddSectionModal(true)}
          >
            {editorTexts?.editorPanel?.addSection || '+ Add New Section'}
          </button>
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editorTexts?.editorPanel?.addSection || 'Add New Section'}</h3>
              <button 
                onClick={() => setShowAddSectionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Chọn loại phần bạn muốn thêm vào CV
            </p>
            
            <div className="space-y-3">
              {getAvailableSectionTypes(editorTexts).map((sectionType) => (
                <button
                  key={sectionType.id}
                  onClick={() => handleAddSection(sectionType.id)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{sectionType.name}</div>
                  <div className="text-sm text-gray-600">{sectionType.description}</div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowAddSectionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Apply All Suggestions"
        featureDescription="Áp dụng tất cả gợi ý AI với một click để tối ưu hóa CV của bạn ngay lập tức."
      />
    </div>
  );
};