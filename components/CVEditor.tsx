import { useState, useEffect } from 'react';
import { EditorPanel } from './EditorPanel';
import { PreviewPanel } from './PreviewPanel';
import { Header } from './Header';
import { initialCV, emptyCV, CVData } from '../utils/mockData';
import { calculateCvScore } from '../utils/cvScoring';
import { useCVWorkflow } from '../shared/contexts/CVWorkflowContext';

// Props interface for CVEditor
interface CVEditorProps {
  initialData?: CVData;
  dataSource?: 'workflow' | 'mock' | 'cache';
}

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
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center relative">
        {/* Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-500 animate-bounce"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Chúc mừng!
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            CV của bạn đã đạt <span className="font-bold text-green-600">100%</span> hoàn thiện!
          </p>
          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tiếp tục chỉnh sửa
            </button>
            <button
              onClick={() => {
                // Handle download action
                console.log('Download CV');
                onClose();
              }}
              className="w-full px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Tải xuống CV
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Tự động đóng sau 5 giây
          </p>
        </div>
      </div>
    </div>
  );
};

export const CVEditor = ({ initialData, dataSource = 'mock' }: CVEditorProps) => {
  // Get workflow context for state management and auto-save
  const { state, updateCVData, saveCVData } = useCVWorkflow();
  
  // Get initial data with fallback logic
  const getInitialData = (): CVData => {
    // If initialData is provided, use it
    if (initialData) {
      console.log(`✅ Using ${dataSource} data for CV Editor`);
      return initialData;
    }
    
    // Fallback to mock data logic
    const isPort5000 = window.location.port === '5000';
    let baseData = isPort5000 ? emptyCV : initialCV;
    
    // Check for stored user data from authentication and prefill contact info
    try {
      const userData = localStorage.getItem('okbuddy_user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.fullName || user.email) {
          baseData = {
            ...baseData,
            contact: {
              ...baseData.contact,
              fullName: user.fullName || baseData.contact.fullName,
              email: user.email || baseData.contact.email
            }
          };
        }
      }
    } catch (error) {
      console.log('No user data found or error parsing user data:', error);
    }
    
    return baseData;
  };
  
  const [cvData, setCvData] = useState<CVData>(getInitialData);
  const [cvScore, setCvScore] = useState(0);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [suggestions, setSuggestions] = useState<{[sectionId: string]: any[]}>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed Header - Full Width */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 z-10 px-6">
        <Header 
          cvScore={cvScore} 
          cvData={cvData}
          onUpdateCvData={setCvData}
          onJobAnalysisComplete={handleJobAnalysisComplete}
        />
      </div>
      
      {/* Two-Panel Layout System */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel (CV Editor) - 60% width, scrollable */}
        <div className="w-3/5 overflow-y-auto bg-blue-50" onClick={handleEditorClick}>
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