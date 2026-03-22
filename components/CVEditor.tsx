/**
 * CV Editor Component
 * Following OkBuddy development tenets - modular, replaceable, accessible
 * Updated for enhanced CV parsing integration and JD optimization workflow
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EditorPanel } from './EditorPanel';
import { PreviewPanel } from './PreviewPanel';
import SharedHeader from './SharedHeader';
import { calculateCvScore } from '../utils/cvScoring';
import { useCVWorkflow } from '../shared/contexts/CVWorkflowContext';
import { type CVData } from '../shared/types/workflow';
import { getTexts } from '../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../config/languageConfig';
// JD optimization service removed - using new LLM-based CV parser instead

// PDF Preview Integration - SAFETY: Completely additive, no existing code modified
import { usePDFPreviewDebounce } from '../hooks/usePDFPreviewDebounce';

interface CVEditorProps {
  className?: string;
  initialData?: CVData;
  onDataChange?: (data: CVData) => void;
  language?: SupportedLanguage;
  cvId?: string; // Added to support guided editing page integration
}

export const CVEditor: React.FC<CVEditorProps> = ({
  className = '',
  initialData,
  onDataChange,
  language,
  cvId // Accept cvId prop for integration with guided editing workflow
}) => {
  // CV Workflow Context for data management
  const { state, updateCVData, saveCVData } = useCVWorkflow();
  
  // Mounted ref to prevent state updates after unmount
  const mountedRef = useRef(true);
  
  // Track if we've loaded data to prevent re-loading
  const hasLoadedDataRef = useRef(false);
  
  // Language and text configuration state
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [cvEditorTexts, setCvEditorTexts] = useState<any>(null);

  // Local state management
  const [cvData, setCvData] = useState<CVData>(() => {
    // Simple initial state - avoid complex computation here
    if (initialData) {
      return initialData;
    }
    return {
      id: cvId, // Include cvId if provided
      contact: { fullName: '', email: '', phone: '', location: '', linkedin: '' },
      summary: { content: '' },
      experience: { items: [] },
      skills: { items: [] },
      education: { items: [] },
      sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
      sectionTitles: {
                        contact: cvEditorTexts?.sectionTitles?.contact || 'Contact Information',
                summary: cvEditorTexts?.sectionTitles?.summary || 'Professional Summary',
                experience: cvEditorTexts?.sectionTitles?.experience || 'Work Experience',
                skills: cvEditorTexts?.sectionTitles?.skills || 'Skills',
                education: cvEditorTexts?.sectionTitles?.education || 'Education'
      }
    };
  });

  // Load language and text configuration
  useEffect(() => {
    const loadLanguageAndTexts = async () => {
      try {
        // Get user's language preference or detect from browser
        const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
        const detectedLanguage = language || savedLanguage || detectLanguage().language;
        
        setCurrentLanguage(detectedLanguage);
        
        // Load CV Editor text configuration
        const texts = await getTexts('cvEditor', detectedLanguage);
        setCvEditorTexts(texts);
        

      } catch (error) {
        console.error('Failed to load language configuration:', error);
        // Fallback to English
        setCurrentLanguage('en');
        const fallbackTexts = await getTexts('cvEditor', 'en');
        setCvEditorTexts(fallbackTexts);
      }
    };
    
    loadLanguageAndTexts();
  }, [language]);
  
  // Load uploaded CV data from localStorage in useEffect
  useEffect(() => {
    // Skip if initialData is provided or data already loaded
    if (initialData || hasLoadedDataRef.current) {
      return;
    }

    // Check for uploaded CV data in localStorage
    if (cvId && typeof window !== 'undefined') {
      const uploadDataKey = `cv_upload_${cvId}`;
      const uploadDataGeneric = 'cv_upload_data';
      
      try {
        // First try specific cvId key
        let uploadData = localStorage.getItem(uploadDataKey);
        if (!uploadData) {
          // Fallback to generic key
          uploadData = localStorage.getItem(uploadDataGeneric);
        }
        
        if (uploadData) {
          const parsed = JSON.parse(uploadData);
          
          if (parsed.cvId === cvId && (parsed.structuredCV || parsed.llmParsedData)) {
            // Prioritize LLM-parsed structured CV data over basic extraction
            const structuredCV = parsed.structuredCV;
            
            // Enhanced contact field mapping with direct access to ChatGPT data as fallback
            const chatGptContact = parsed.llmParsedData?.contact || {};
            const structuredContact = structuredCV?.contact || {};
            
            const transformedData: CVData = {
              id: cvId,
              contact: {
                fullName: (() => {
                  // Enhanced fallback chain: prioritize ChatGPT data if structured conversion failed
                  const name = structuredContact.fullName || 
                              chatGptContact.full_name || 
                              structuredContact.full_name || 
                              structuredContact.name || 
                              '';
                  return name;
                })(),
                email: (() => {
                  const email = structuredContact.email || chatGptContact.email || '';
                  return email;
                })(),
                phone: (() => {
                  const phone = structuredContact.phone || chatGptContact.phone || '';
                  return phone;
                })(),
                location: (() => {
                  // Map both address and location fields from ChatGPT
                  const location = structuredContact.location || 
                                  chatGptContact.address || 
                                  structuredContact.address || 
                                  '';
                  return location;
                })(),
                linkedin: (() => {
                  const linkedin = structuredContact.linkedin || chatGptContact.linkedin || '';
                  return linkedin;
                })()
              },
              summary: {
                content: (() => {
                  const summaryData = structuredCV.summary?.content || structuredCV.summary || '';
                  if (typeof summaryData === 'string') return summaryData;
                  if (Array.isArray(summaryData)) return (summaryData as string[]).join(' ');
                  if (typeof summaryData === 'object') return JSON.stringify(summaryData);
                  return String(summaryData || '');
                })()
              },
              experience: {
                items: (() => {
                  // Enhanced work experience mapping with ChatGPT fallback
                  const chatGptExperience = parsed.llmParsedData?.work_experience || [];
                  const structuredExperience = structuredCV.experience?.items || structuredCV.experience || [];
                  
                  if (structuredExperience.length > 0) {
                    return structuredExperience;
                  }
                  
                  // Fallback: Map ChatGPT data directly with Present/hiện tại handling
                  return chatGptExperience.map((exp: any, index: number) => {
                    // Handle "Present" or "hiện tại" end dates
                    const isCurrentJob = exp.end_date && 
                      (exp.end_date.toLowerCase().includes('present') || 
                       exp.end_date.toLowerCase().includes('hiện tại'));
                    

                    
                    return {
                      id: `experience-${index}-${Date.now()}`,
                      title: exp.position,  // Map position to title
                      company: exp.company,
                      location: exp.location,
                      startDate: exp.start_date,
                      endDate: isCurrentJob ? '' : exp.end_date,  // Clear end date if current job
                      current: isCurrentJob,  // Fix: use 'current' instead of 'isCurrentJob' to match WorkExperienceSection interface
                      bullets: exp.bullets || []
                    };
                  });
                })()
              },
              skills: {
                items: (structuredCV.skills?.items || structuredCV.skills || []).map((skill: string, index: number) => ({
                  id: `skill-${index}-${skill}`, // Add unique ID for React key
                  name: skill,
                  level: 'Intermediate' // Default level for parsed skills
                }))
              },
              education: {
                items: structuredCV.education?.items || structuredCV.education || []
              },
              sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
              sectionTitles: {
                contact: cvEditorTexts?.sectionTitles?.contact || 'Contact Information',
                summary: cvEditorTexts?.sectionTitles?.summary || 'Professional Summary',
                experience: cvEditorTexts?.sectionTitles?.experience || 'Work Experience',
                skills: cvEditorTexts?.sectionTitles?.skills || 'Skills',
                education: cvEditorTexts?.sectionTitles?.education || 'Education'
              }
            };
            

            
            // Update state with transformed data
            setCvData(transformedData);
            hasLoadedDataRef.current = true; // Mark as loaded
            
            // Check if this was a successful LLM parsing
            if (parsed.llmParsedData && parsed.llmParsedData.possibility_score >= 5) {
              // Use setTimeout to show notification after component mounts
              setTimeout(() => {
                if (mountedRef.current) setShowParsingSuccess(true);
              }, 1000);
              // Auto-hide after 5 seconds
              setTimeout(() => {
                if (mountedRef.current) setShowParsingSuccess(false);
              }, 6000);
            }
          }
        }
      } catch (error) {
        console.error('❌ CVEditor: Error loading uploaded CV data:', error);
      }
    }

  }, [cvId, initialData]); // Only re-run when these specific dependencies change
  
  // Separate useEffect for workflow context data to avoid infinite loops
  useEffect(() => {
    // Only use workflow context if we don't have initialData and haven't loaded data yet
    if (!initialData && !hasLoadedDataRef.current) {
      if (state.cvData && Object.keys(state.cvData).length > 0) {
        setCvData(state.cvData as CVData);
        hasLoadedDataRef.current = true; // Mark as loaded
      }
    }
  }, [state.cvData, initialData]); // Separate effect for state.cvData

  // JD Optimization removed - using new LLM-based CV parser

  // Active section state for editor panel
  // GUEST SESSIONS: Default to 'experience' for guest users to enable quick aha moment
  const [activeSection, setActiveSection] = useState<string | null>('contact');

  // Calculate CV score (enhanced with parsing quality if available)
  const [cvScore, setCvScore] = useState(0);
  
  // Success notification for LLM parsing
  const [showParsingSuccess, setShowParsingSuccess] = useState(false);

  // PDF Preview Integration - SAFETY: Independent system, no interference with existing auto-save
  const pdfPreview = usePDFPreviewDebounce(cvData, {
    debounceMs: 3000, // 3-second debounce as per requirements
    enableCache: true,
    onGenerationStart: () => {
      console.log('🔄 CVEditor: PDF generation started');
    },
    onGenerationComplete: (result) => {
      console.log('✅ CVEditor: PDF generation completed', { 
        cached: result.cached,
        hasPdfUrl: !!result.pdfUrl,
        pdfUrlLength: result.pdfUrl?.length || 0
      });
    },
    onError: (error) => {
      console.error('❌ CVEditor: PDF generation error:', error);
    }
  });

  // Debug PDF preview state
  useEffect(() => {
    console.log('📊 CVEditor: PDF Preview State Update:', {
      isGenerating: pdfPreview.pdfState.isGenerating,
      hasPdfUrl: !!pdfPreview.pdfState.pdfUrl,
      error: pdfPreview.pdfState.error,
      isUserTyping: pdfPreview.isUserTyping,
      lastGenerated: pdfPreview.pdfState.lastGenerated ? new Date(pdfPreview.pdfState.lastGenerated).toLocaleTimeString() : null
    });
  }, [pdfPreview.pdfState, pdfPreview.isUserTyping]);

  // Global PDF Generation Trigger - Monitor CV Data Changes
  // SAFETY: This ensures PDF generation happens regardless of which input field is used
  useEffect(() => {
    console.log('🔄 CVEditor: CV Data changed, triggering PDF generation...');
    console.log('📊 CVEditor: CV Data summary:', {
      contactName: cvData.contact?.fullName,
      summaryLength: cvData.summary?.content?.length || 0,
      experienceCount: cvData.experience?.items?.length || 0,
      skillsCount: cvData.skills?.items?.length || 0
    });
    
    // Trigger PDF generation with debounce (3-second delay)
    pdfPreview.triggerPDFGeneration(false);
  }, [cvData]); // FIXED: Removed pdfPreview from dependencies to prevent infinite loops

  // Initial PDF Generation - Trigger PDF generation when component mounts
  // SAFETY: Ensures PDF is generated even if user doesn't edit anything
  useEffect(() => {
    console.log('🚀 CVEditor: Component mounted, triggering initial PDF generation...');
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      pdfPreview.triggerPDFGeneration(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run on mount

  // Suggestions removed - using new LLM-based CV parser instead

  // Update CV score when data changes
  useEffect(() => {
    const score = calculateCvScore(cvData);
    setCvScore(score);
  }, [cvData]);

  // GUEST SESSIONS: Focus on Work Experience for guest users to enable quick aha moment
  // Use a ref to track if we've already set focus for this template to prevent multiple executions
  const hasSetTemplateFocusRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (cvId && cvId.startsWith('template-') && hasSetTemplateFocusRef.current !== cvId) {
      hasSetTemplateFocusRef.current = cvId; // Mark this cvId as processed
      setActiveSection('experience');
      
      // Scroll to experience section after a brief delay to ensure DOM is ready
      setTimeout(() => {
        const sectionElement = document.getElementById('section-experience');
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500); // 500ms delay to ensure CV Editor is fully rendered
    }
  }, [cvId, cvData]); // Run when cvId changes or when cvData is loaded

  // Sync with workflow context when cvData changes
  useEffect(() => {
    if (updateCVData && mountedRef.current) {
      updateCVData(cvData);
    }
    if (onDataChange && mountedRef.current) {
      onDataChange(cvData);
    }
  }, [cvData]); // Remove updateCVData and onDataChange from dependencies to prevent infinite loops

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Enhanced data update handler with auto-save
  const handleDataUpdate = useCallback((newData: CVData) => {
    setCvData(newData);
    
    // Auto-save to workflow context
    if (saveCVData) {
      try {
        saveCVData(newData);
      } catch (error) {
        console.error('❌ CVEditor: Auto-save failed:', error);
      }
    }
  }, [saveCVData]);

  // Handle section updates (compatible with existing EditorPanel interface)
  const handleUpdateSection = useCallback((sectionId: string, data: any) => {
    
    const updatedData = {
      ...cvData,
      [sectionId]: data
    };
    
    handleDataUpdate(updatedData);
  }, [cvData, handleDataUpdate]);

  // Handle section order changes
  const handleSectionOrderChange = useCallback((newOrder: string[]) => {
    console.log('🔧 CVEditor: Updating section order', newOrder);
    
    const updatedData = {
      ...cvData,
      sectionOrder: newOrder
    };
    
    handleDataUpdate(updatedData);
  }, [cvData, handleDataUpdate]);

  // JD optimization handlers removed - using new LLM-based CV parser instead

  // Suggestion handling removed - using new LLM-based CV parser instead

  // Suggestion handling removed - using new LLM-based CV parser instead

  // Get auto-save status from CV workflow context
  const getAutoSaveStatus = () => {
    // Check if this is a guest session (template CV)
    if (cvId && cvId.startsWith('template-')) {
      return 'guest';
    }
    
    if (state.isSaving) return 'saving';
    if (state.error) return 'error';
    if (state.syncStatus === 'offline') return 'offline';
    return 'saved';
  };

  // Handle back navigation
  const handleBackToWorkspace = () => {
    // Auto-save current CV data before navigation
    if (cvData) {
      updateCVData(cvData);
    }
    // Use browser history for proper back navigation
    window.history.back();
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${className}`}>
      {/* Unified Header */}
      <SharedHeader 
        variant="editor"
        showFeedback={true}
        showBackButton={true}
        onBackClick={handleBackToWorkspace}
        backButtonTitle={cvEditorTexts?.header?.backToWorkspace || 'Back to CV Workspace'}
        showAutoSave={false}
        cvData={cvData}
        onUpdateCvData={updateCVData}
      />
      
      {/* Success Notification for LLM Parsing */}
      {showParsingSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                CV Successfully Parsed!
              </p>
              <p className="text-sm text-green-600">
                Your CV has been analyzed and populated automatically.
              </p>
            </div>
            <button 
              onClick={() => setShowParsingSuccess(false)}
              className="flex-shrink-0 ml-2 text-green-400 hover:text-green-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Two-Panel Layout System */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel (CV Editor) - 60% width, scrollable */}
        <div className="w-3/5 overflow-y-auto bg-blue-50">
          <div className="p-6">
            <EditorPanel
              cvData={cvData}
              onUpdateSection={handleUpdateSection}
              onSectionOrderChange={handleSectionOrderChange}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              cvScore={cvScore}
              language={currentLanguage}
              pdfPreview={pdfPreview}
            />
          </div>
        </div>

        {/* Right Panel (CV Preview) - 40% width, fixed position */}
        <div className="w-2/5 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <PreviewPanel
            cvData={cvData}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            autoSaveStatus={getAutoSaveStatus()}
            pdfPreview={pdfPreview}
          />
        </div>
      </div>
    </div>
  );
};