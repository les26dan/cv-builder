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
      console.log(`✅ Using provided initial data for CV: ${initialData.id || 'unnamed'}`);
      return {
        ...initialData,
        id: initialData.id || cvId || Math.random().toString(36).substr(2, 9),
      };
    }
    
    // Priority 2: Check URL parameters for data source
    if (source === 'new') {
      console.log(`✅ Creating new empty CV with user prefill`);
      const newCV = createUserPrefilledCV();
      // Ensure CV has the correct ID
      newCV.id = cvId || newCV.id || Math.random().toString(36).substr(2, 9);
      return newCV;
    }
    
    // Priority 3: Check workflow context for existing data
    if (state.cvData && cvId && state.cvData.id === cvId) {
      console.log(`✅ Using workflow context data for CV ${cvId}`);
      return {
        id: cvId,
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
            id: item.id || `edu-${Date.now()}-${Math.random()}`,
            degree: item.degree || '',
            institution: item.institution || '',
            location: item.location || '',
            graduationDate: item.graduationDate || '',
            description: item.description || ''
          }))
        } : { items: [] },
        certificates: state.cvData.certificates || { items: [] },
        languages: state.cvData.languages || { items: [] },
        projects: state.cvData.projects || { items: [] },
        awards: state.cvData.awards || { items: [] }
      };
    }
    
    // Priority 4: Check localStorage for auto-saved data
    if (cvId && typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(`cv_data_${cvId}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log(`✅ Using localStorage data for CV ${cvId}`);
          return {
            ...parsedData,
            id: cvId, // Ensure ID matches
          };
        }
      } catch (error) {
        console.log(`⚠️ Error loading localStorage data for CV ${cvId}:`, error);
      }
    }
    
    // Priority 5: Fallback - check for mock data or create empty CV
    if (cvId) {
      // Try to find mock data with this ID
      const mockCV = initialCV; // You can extend this to check for specific mock data
      console.log(`✅ Using fallback data for CV ${cvId}`);
      return {
        ...mockCV,
        id: cvId,
      };
    }
    
    // Final fallback: create empty CV with user prefill
    console.log(`✅ Creating fallback empty CV with user prefill`);
    const fallbackCV = createUserPrefilledCV();
    fallbackCV.id = cvId || Math.random().toString(36).substr(2, 9);
    return fallbackCV;
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
          // Save to localStorage for immediate persistence
          localStorage.setItem(`cv_data_${cvId}`, JSON.stringify(cvData));
          setLastSaved(new Date());
          console.log(`💾 Auto-saved CV data for ${cvId} at ${new Date().toLocaleTimeString()}`);
          
          // Also update workflow context if available
          if (updateCVData) {
            updateCVData(cvData);
          }
          
          // Future enhancement: Save to database for production
          // saveCVData(cvData).catch(error => {
          //   console.warn('Failed to save to database, localStorage backup available:', error);
          // });
          
        } catch (error) {
          console.error('Failed to save CV data:', error);
          // Show user-friendly error message
          if (typeof window !== 'undefined') {
            console.warn('⚠️ Auto-save failed - please save your work manually');
          }
        }
      }, 2000); // 2 second debounce

      return () => clearTimeout(saveTimer);
    }
  }, [cvData, cvId, updateCVData]);

  // Enhanced data recovery system
  useEffect(() => {
    const handlePageUnload = (event: BeforeUnloadEvent) => {
      if (cvId && cvData) {
        try {
          // Emergency save before page unload
          localStorage.setItem(`cv_data_${cvId}`, JSON.stringify(cvData));
          localStorage.setItem(`cv_data_${cvId}_backup`, JSON.stringify({
            data: cvData,
            timestamp: new Date().toISOString(),
            source: 'emergency_save'
          }));
        } catch (error) {
          console.error('Emergency save failed:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handlePageUnload);
    return () => window.removeEventListener('beforeunload', handlePageUnload);
  }, [cvData, cvId]);

  // Data recovery on component mount
  useEffect(() => {
    if (cvId && typeof window !== 'undefined') {
      try {
        // Check for emergency backup first
        const backupData = localStorage.getItem(`cv_data_${cvId}_backup`);
        if (backupData) {
          const backup = JSON.parse(backupData);
          const backupTime = new Date(backup.timestamp);
          const now = new Date();
          const hoursSinceBackup = (now.getTime() - backupTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceBackup < 24) { // Backup is less than 24 hours old
            console.log(`🔄 Found recent backup data for CV ${cvId}, restoring...`);
            setCvData(backup.data);
            setLastSaved(backupTime);
            
            // Clean up backup after successful restore
            localStorage.removeItem(`cv_data_${cvId}_backup`);
          }
        }
      } catch (error) {
        console.log('No backup data found or failed to restore:', error);
      }
    }
  }, [cvId]);

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
  }, [cvData, cvScore]);

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
        
        // Save to workflow context and localStorage
        updateCVData(workflowData);
        
        if (saveCVData) {
          saveCVData(workflowData).catch(error => {
            console.warn('Workflow auto-save failed:', error);
          });
        }
      }, 3000); // 3 second debounce for workflow saves
      
      return () => clearTimeout(saveTimer);
    }
  }, [cvData, dataSource, state.cvData, updateCVData, saveCVData]);

  const handleUpdateSection = (sectionId: string, data: any) => {
    console.log(`🔧 Updating section: ${sectionId}`, data);
    
    try {
      setCvData(prevData => {
        const updatedData = {
          ...prevData,
          [sectionId]: data
        };
        
        // Validate the data structure
        if (sectionId === 'contact' && data) {
          // Ensure contact has required structure
          updatedData.contact = {
            fullName: data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            linkedin: data.linkedin || ''
          };
        }
        
        console.log(`✅ Section ${sectionId} updated successfully`);
        return updatedData;
      });
    } catch (error) {
      console.error(`❌ Error updating section ${sectionId}:`, error);
    }
  };

  const handleUpdateCvData = (newData: CVData) => {
    console.log('🔧 Updating entire CV data:', newData);
    
    try {
      // Validate that newData has required structure
      if (!newData || typeof newData !== 'object') {
        console.error('❌ Invalid CV data provided');
        return;
      }
      
      setCvData(prevData => {
        const mergedData = {
          ...prevData,
          ...newData,
          id: newData.id || prevData.id || cvId // Preserve ID
        };
        
        console.log('✅ CV data updated successfully');
        return mergedData;
      });
    } catch (error) {
      console.error('❌ Error updating CV data:', error);
    }
  };

  const handleSectionOrder = (newOrder: string[]) => {
    console.log('🔧 Updating section order:', newOrder);
    
    setCvData(prev => {
      const newData = {
        ...prev,
        sectionOrder: newOrder
      };
      console.log('✅ Section order updated successfully');
      return newData;
    });
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  const handleApplySuggestion = (sectionId: string, suggestion: any) => {
    console.log(`🎯 Applying suggestion to section: ${sectionId}`, suggestion);
    
    try {
      // Apply suggestion to the appropriate section
      switch (sectionId) {
        case 'skills':
          if (typeof suggestion === 'string') {
            const currentSkills = cvData.skills?.items || [];
            if (!currentSkills.includes(suggestion)) {
              const updatedSkills = [...currentSkills, suggestion];
              handleUpdateSection('skills', { items: updatedSkills });
              console.log('✅ Skill suggestion applied');
            }
          }
          break;
        case 'summary':
          if (suggestion && suggestion.content) {
            handleUpdateSection('summary', { content: suggestion.content });
            console.log('✅ Summary suggestion applied');
          }
          break;
        case 'experience':
          if (suggestion && suggestion.bulletPoint) {
            const currentExperience = cvData.experience?.items || [];
            if (currentExperience.length > 0) {
              const updatedExperience = [...currentExperience];
              // Add to first experience item
              updatedExperience[0] = {
                ...updatedExperience[0],
                bullets: [...(updatedExperience[0].bullets || []), suggestion.bulletPoint]
              };
              handleUpdateSection('experience', { items: updatedExperience });
              console.log('✅ Experience suggestion applied');
            }
          }
          break;
        default:
          console.log(`⚠️ No handler for suggestion type: ${sectionId}`);
      }
    } catch (error) {
      console.error(`❌ Error applying suggestion to ${sectionId}:`, error);
    }
  };

  const handleDismissSuggestion = (sectionId: string, suggestion: any) => {
    setSuggestions(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] || []).filter(s => s !== suggestion)
    }));
  };

  const handleJobAnalysisComplete = (analysisResults: any) => {
    console.log('🎯 Job analysis completed:', analysisResults);
    
    try {
      // Process analysis results and update suggestions
      if (analysisResults && analysisResults.suggestions) {
        setSuggestions(analysisResults.suggestions);
        console.log('✅ Suggestions updated from job analysis');
      }
      
      // Optional: Update CV data based on analysis
      if (analysisResults && analysisResults.optimizedCV) {
        handleUpdateCvData(analysisResults.optimizedCV);
      }
    } catch (error) {
      console.error('❌ Error processing job analysis results:', error);
    }
  };

  const handleManualSave = async () => {
    console.log('💾 Manual save triggered');
    
    try {
      // Save to localStorage immediately
      if (cvId && cvData) {
        localStorage.setItem(`cv_data_${cvId}`, JSON.stringify(cvData));
        setLastSaved(new Date());
        console.log('✅ Manual save to localStorage successful');
      }
      
      // Save to workflow context if available
      if (updateCVData) {
        updateCVData(cvData);
        console.log('✅ Manual save to workflow context successful');
      }
      
      // Future: Save to database
      if (saveCVData) {
        await saveCVData(cvData);
        console.log('✅ Manual save to database successful');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Manual save failed:', error);
      return false;
    }
  };

  const handleDataRecovery = () => {
    console.log('🔄 Attempting data recovery');
    
    try {
      if (cvId && typeof window !== 'undefined') {
        // Try to recover from localStorage
        const savedData = localStorage.getItem(`cv_data_${cvId}`);
        if (savedData) {
          const recoveredData = JSON.parse(savedData);
          setCvData(recoveredData);
          console.log('✅ Data recovered from localStorage');
          return true;
        }
        
        // Try to recover from backup
        const backupData = localStorage.getItem(`cv_data_${cvId}_backup`);
        if (backupData) {
          const backup = JSON.parse(backupData);
          setCvData(backup.data);
          setLastSaved(new Date(backup.timestamp));
          console.log('✅ Data recovered from backup');
          return true;
        }
      }
      
      console.log('⚠️ No recovery data found');
      return false;
    } catch (error) {
      console.error('❌ Data recovery failed:', error);
      return false;
    }
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

  // Get auto-save status for display
  const getAutoSaveStatus = () => {
    if (lastSaved) {
      const timeSinceLastSave = Date.now() - lastSaved.getTime();
      if (timeSinceLastSave < 5000) { // Less than 5 seconds ago
        return 'saved';
      }
    }
    return 'idle';
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#E0F7FA' }}>
      {/* Fixed Header - Full Width with OkBuddy Background */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 z-10 px-6">
        <HeaderCVEditor 
          cvScore={cvScore}
          cvData={cvData}
          onUpdateCvData={handleUpdateCvData}
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
              onDismissSuggestion={(sectionId: string, suggestion: any) => {
                setSuggestions(prev => ({
                  ...prev,
                  [sectionId]: (prev[sectionId] || []).filter(s => s !== suggestion)
                }));
              }}
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
      
      {/* Celebration Modal */}
      {showCelebration && (
        <CelebrationScreen onClose={handleCloseCelebration} />
      )}
      
      {/* Auto-save Status Indicator */}
      {lastSaved && (
        <div className="fixed bottom-4 right-4 bg-green-50 text-green-600 px-4 py-2 rounded-lg border border-green-200 text-sm font-medium">
          ✓ Đã lưu tự động lúc {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};