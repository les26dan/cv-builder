import { useState, useEffect } from 'react';
import { EditorPanel } from './EditorPanel';
import { PreviewPanel } from './PreviewPanel';
import { HeaderCVEditor } from './HeaderCVEditor';
import { initialCV, emptyCV, CVData } from '../utils/mockData';
import { calculateCvScore } from '../utils/cvScoring';
import { useCVWorkflow } from '../shared/contexts/CVWorkflowContext';

// Props interface for CVEditor
interface CVEditorProps {
  initialData?: CVData;
  dataSource?: 'workflow' | 'mock' | 'cache' | 'new' | 'existing';
  cvId?: string;
}

// Create prefilled empty CV with user data
const createUserPrefilledCV = (): CVData => {
  let baseCV = { ...emptyCV };
  
  // Try to prefill contact info from user data
  try {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('okbuddy_user');
      if (userData) {
        const user = JSON.parse(userData);
        baseCV = {
          ...baseCV,
          contact: {
            ...baseCV.contact,
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            location: user.location || '',
            linkedin: user.linkedin || ''
          }
        };
      }
    }
  } catch (error) {
    console.log('No user data found for prefilling:', error);
  }

  // Add minimal structure for better UX
  if (baseCV.experience.items.length === 0) {
    baseCV.experience = {
      items: [{
        id: `exp-${Date.now()}`,
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: ['']
      }]
    };
  }

  if (baseCV.education.items.length === 0) {
    baseCV.education = {
      items: [{
        id: `edu-${Date.now()}`,
        degree: '',
        institution: '',
        location: '',
        graduationDate: '',
        description: ''
      }]
    };
  }

  return baseCV;
};

// Celebration Screen Component
const CelebrationScreen = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center relative shadow-xl">
        {/* Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-inter">
            Chúc mừng!
          </h2>
          <p className="text-lg text-gray-600 mb-6 font-inter">
            CV của bạn đã đạt <span className="font-bold text-green-600">100%</span> hoàn thiện!
          </p>
          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors font-inter font-semibold"
            >
              Tiếp tục chỉnh sửa
            </button>
            <button
              onClick={() => {
                // Handle download action
                console.log('Download CV');
                onClose();
              }}
              className="w-full px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary-50 transition-colors font-inter font-medium"
            >
              Tải xuống CV
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4 font-inter">
            Tự động đóng sau 5 giây
          </p>
        </div>
      </div>
    </div>
  );
};

export const CVEditor = ({ initialData, dataSource = 'mock', cvId }: CVEditorProps) => {
  // Get workflow context for state management and auto-save
  const { state, updateCVData, saveCVData } = useCVWorkflow();
  
  // Safe URL parameter extraction without useSearchParams
  const getSourceFromURL = (): string => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('source') || dataSource;
      } catch (error) {
        console.log('Error parsing URL params:', error);
        return dataSource;
      }
    }
    return dataSource;
  };
  
  const [source, setSource] = useState<string>(dataSource);
  
  // Update source when component mounts
  useEffect(() => {
    const urlSource = getSourceFromURL();
    setSource(urlSource);
  }, [dataSource]);
  
  // Comprehensive data initialization system
  const getInitialData = (): CVData => {
    console.log(`🔧 CV Editor initializing with source: ${source}, cvId: ${cvId}`);
    
    // Priority 1: Explicit initial data provided
    if (initialData) {
      console.log(`✅ Using provided initial data`);
      return initialData;
    }
    
    // Priority 2: Check URL parameters for data source
    if (source === 'new') {
      console.log(`✅ Creating new empty CV with user prefill`);
      return createUserPrefilledCV();
    }
    
    // Priority 3: Check workflow context for existing data
    if (state.cvData && cvId && state.cvData.id === cvId) {
      console.log(`✅ Using workflow context data for CV ${cvId}`);
      return {
        sectionOrder: state.cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'],
        sectionTitles: state.cvData.sectionTitles || {},
        contact: state.cvData.contact ? {
          fullName: state.cvData.contact.fullName || '',
          email: state.cvData.contact.email || '',
          phone: state.cvData.contact.phone || '',
          location: state.cvData.contact.location || '',
          linkedin: state.cvData.contact.linkedin || ''
        } : emptyCV.contact,
        summary: state.cvData.summary || { content: '' },
        experience: state.cvData.experience || { items: [] },
        skills: state.cvData.skills || { items: [] },
        education: state.cvData.education ? {
          items: state.cvData.education.items.map(item => ({
            id: item.id || `edu-${Date.now()}`,
            degree: item.degree || '',
            institution: item.institution || '',
            location: item.location || '',
            graduationDate: item.graduationDate || '',
            description: item.description || ''
          }))
        } : { items: [] }
      };
    }
    
    // Priority 4: Try to load from localStorage/cache
    if (cvId && typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem(`cv_data_${cvId}`);
        if (cachedData) {
          console.log(`✅ Using cached data for CV ${cvId}`);
          return JSON.parse(cachedData);
        }
      } catch (error) {
        console.log('No cached data found:', error);
      }
    }
    
    // Priority 5: Fallback logic - for existing CVs use prefilled, for demo use initialCV
    if (source === 'existing' || cvId) {
      console.log(`✅ Creating prefilled CV for existing context`);
      return createUserPrefilledCV();
    } else {
      console.log(`✅ Using initial CV with sample data`);
      return initialCV;
    }
  };
  
  const [cvData, setCvData] = useState<CVData>(getInitialData);
  const [cvScore, setCvScore] = useState(0);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [suggestions, setSuggestions] = useState<{[sectionId: string]: any[]}>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Re-initialize data when source changes
  useEffect(() => {
    const newData = getInitialData();
    setCvData(newData);
  }, [source, cvId]);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    if (cvId && cvData) {
      const saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(`cv_data_${cvId}`, JSON.stringify(cvData));
          setLastSaved(new Date());
          console.log(`💾 Auto-saved CV data for ${cvId}`);
        } catch (error) {
          console.error('Failed to save CV data to localStorage:', error);
        }
      }, 2000); // 2 second debounce

      return () => clearTimeout(saveTimer);
    }
  }, [cvData, cvId]);

  // Calculate CV score whenever data changes
  useEffect(() => {
    try {
      const newScore = calculateCvScore(cvData);
      
      // Only update if score actually changed
      if (newScore !== cvScore) {
        const oldScore = cvScore;
        setCvScore(newScore);

        // Show celebration when reaching 100% for the first time
        if (newScore === 100 && oldScore < 100) {
          setShowCelebration(true);
        }
      }
    } catch (error) {
      console.error('Error calculating CV score:', error);
      // Fallback to score 0 on error
      if (cvScore !== 0) {
        setCvScore(0);
      }
    }
  }, [cvData]);

  // Auto-save functionality when using workflow data
  useEffect(() => {
    if (dataSource === 'workflow' && state.cvData) {
      const saveTimer = setTimeout(() => {
        // Convert CVData back to WorkflowCVData format for saving
        const workflowData = {
          ...state.cvData,
          ...cvData,
          metadata: {
            createdAt: state.cvData?.metadata?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: (state.cvData?.metadata?.version || 0) + 1,
            source: state.cvData?.metadata?.source || 'upload'
          }
        };
        
        updateCVData(workflowData);
        setLastSaved(new Date());
      }, 2000); // 2 second debounce

      return () => clearTimeout(saveTimer);
    }
  }, [cvData, dataSource, state.cvData, updateCVData]);

  const handleUpdateSection = (sectionId: string, data: any) => {
    setCvData(prev => {
      if (sectionId === 'sectionTitles') {
        // Handle section titles update
        return {
          ...prev,
          sectionTitles: data
        };
      }
      
      // Handle regular section updates
      return {
        ...prev,
        [sectionId]: data
      };
    });
  };

  const handleSectionOrder = (newOrder: string[]) => {
    setCvData(prev => {
      const newData = {
        ...prev
      };
      newData.sectionOrder = newOrder;
      return newData;
    });
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  const handleApplySuggestion = (sectionId: string, suggestion: any) => {
    // Apply suggestion to the appropriate section
    switch (sectionId) {
      case 'skills':
        if (typeof suggestion === 'string') {
          const currentSkills = cvData.skills?.items || [];
          if (!currentSkills.includes(suggestion)) {
            const updatedSkills = [...currentSkills, suggestion];
            handleUpdateSection('skills', { items: updatedSkills });
          }
        }
        break;
      case 'summary':
        if (typeof suggestion === 'string') {
          const currentSummary = cvData.summary?.content || '';
          const updatedSummary = currentSummary ? `${currentSummary}\n\n${suggestion}` : suggestion;
          handleUpdateSection('summary', { content: updatedSummary });
        }
        break;
      case 'experience':
        // Handle experience suggestions (e.g., bullet points)
        if (suggestion.bulletPoint && cvData.experience?.items?.length > 0) {
          const updatedItems = [...cvData.experience.items];
          // Add to the first experience item for simplicity
          if (updatedItems[0]) {
            const currentBullets = updatedItems[0].bullets || [];
            updatedItems[0].bullets = [...currentBullets, suggestion.bulletPoint];
            handleUpdateSection('experience', { items: updatedItems });
          }
        }
        break;
      default:
        console.log('Suggestion applied for section:', sectionId, suggestion);
    }

    // Remove the applied suggestion
    handleDismissSuggestion(sectionId, suggestion);
  };

  const handleDismissSuggestion = (sectionId: string, suggestion: any) => {
    setSuggestions(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] || []).filter(s => s !== suggestion)
    }));
  };

  const handleJobAnalysisComplete = (analysisResults: any) => {
    // Convert analysis results to suggestions format
    const newSuggestions: {[sectionId: string]: any[]} = {};
    
    if (analysisResults.skills && analysisResults.skills.length > 0) {
      newSuggestions.skills = analysisResults.skills;
    }
    
    if (analysisResults.summary && analysisResults.summary.length > 0) {
      newSuggestions.summary = analysisResults.summary;
    }
    
    if (analysisResults.workExperience && analysisResults.workExperience.length > 0) {
      newSuggestions.experience = analysisResults.workExperience.map((bullet: string) => ({
        bulletPoint: bullet
      }));
    }
    
    setSuggestions(newSuggestions);
  };

  // Clear active section when clicking outside
  const handleEditorClick = (e: React.MouseEvent) => {
    // Check if the clicked element or its parents have section-related classes
    const target = e.target as HTMLElement;
    
    // Don't clear if clicking on section content, inputs, buttons, or their children
    const isClickOnSectionContent = target.closest('[data-section]') || 
                                   target.closest('input') || 
                                   target.closest('textarea') || 
                                   target.closest('button') || 
                                   target.closest('select') || 
                                   target.closest('.section-content');
    
    // Clear active section if clicking outside section content
    if (!isClickOnSectionContent) {
      setActiveSection(null);
    }
  };

  // Auto-save status for display
  const getAutoSaveStatus = () => {
    if (dataSource === 'mock') {
      return null; // No auto-save for mock data
    }
    
    if (state.isSaving) {
      return { status: 'saving', message: 'Đang lưu...' };
    }
    
    if (lastSaved) {
      const timeSince = Date.now() - lastSaved.getTime();
      if (timeSince < 5000) { // Show "saved" message for 5 seconds
        return { status: 'saved', message: 'Đã lưu tự động' };
      }
    }
    
    if (state.error) {
      return { status: 'error', message: 'Lỗi lưu tự động' };
    }
    
    return null;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#E0F7FA' }}>
      {/* Fixed Header - Full Width with OkBuddy Background */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 z-10 px-6">
        <HeaderCVEditor 
          cvScore={cvScore} 
          cvData={cvData}
          onUpdateCvData={setCvData}
          onJobAnalysisComplete={handleJobAnalysisComplete}
        />
      </div>
      
      {/* Two-Panel Layout System with OkBuddy Colors */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel (CV Editor) - 60% width, scrollable, OkBuddy Background */}
        <div className="w-3/5 overflow-y-auto" style={{ background: '#E0F7FA' }} onClick={handleEditorClick}>
          <div className="p-6">
            <EditorPanel 
              cvData={cvData} 
              onUpdateSection={handleUpdateSection} 
              onSectionOrderChange={handleSectionOrder} 
              activeSection={activeSection} 
              setActiveSection={setActiveSection} 
              cvScore={cvScore}
              suggestions={suggestions}
              onApplySuggestion={handleApplySuggestion}
              onDismissSuggestion={handleDismissSuggestion}
            />
          </div>
        </div>
        
        {/* Right Panel (CV Preview) - 40% width, fixed position */}
        <div className="w-2/5 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <PreviewPanel 
            cvData={cvData} 
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
          />
        </div>
      </div>

      {/* Celebration Screen */}
      {showCelebration && (
        <CelebrationScreen onClose={handleCloseCelebration} />
      )}
    </div>
  );
};