/**
 * CV Editor Component
 * Following CV Builder development tenets - modular, replaceable, accessible
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
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('vi');
  const [cvEditorTexts, setCvEditorTexts] = useState<any>(null);

  // Local state management
  const [cvData, setCvData] = useState<CVData>(() => {
    // Simple initial state - avoid complex computation here
    if (initialData) {
      console.log('🔄 CVEditor: Using provided initialData');
      return initialData;
    }
    
    // Default empty CV structure
    console.log('🔄 CVEditor: Using default empty CV structure');
    return {
      id: cvId, // Include cvId if provided
      contact: { fullName: '', email: '', phone: '', location: '', linkedin: '' },
      summary: { content: '' },
      experience: { items: [] },
      skills: { items: [] },
      education: { items: [] },
      sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
      sectionTitles: {
        contact: 'Thông tin liên hệ',
        summary: 'Tóm tắt chuyên môn',
        experience: 'Kinh nghiệm làm việc',
        skills: 'Kỹ năng',
        education: 'Học vấn'
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

        console.log('🌐 CVEditor: Loading language:', {
          prop: language,
          saved: savedLanguage,
          detected: detectedLanguage
        });

        setCurrentLanguage(detectedLanguage);

        // Load CV Editor text configuration
        const texts = await getTexts('cvEditor', detectedLanguage);
        setCvEditorTexts(texts);

        // Update section titles when language loads
        if (texts?.sectionTitles) {
          setCvData(prevData => ({
            ...prevData,
            sectionTitles: {
              ...prevData.sectionTitles,
              ...texts.sectionTitles
            }
          }));
        }

        console.log('✅ CVEditor: Language loaded successfully:', detectedLanguage);
      } catch (error) {
        console.error('Failed to load language configuration:', error);
        // Fallback to Vietnamese
        setCurrentLanguage('vi');
        const fallbackTexts = await getTexts('cvEditor', 'vi');
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
      // FIRST: if user previously edited and we persisted to cv_workflow_{cvId},
      // skip the upload-data path entirely so we don't clobber saved edits.
      // The workflow-context effect below will hydrate state.cvData from this same key.
      // If we already have saved edits in cv_workflow_{cvId}, skip the upload-data path
      // entirely — workflow context will hydrate from that key instead.
      const savedEdits = localStorage.getItem(`cv_workflow_${cvId}`);
      if (savedEdits) return;

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
          
          console.log('🔍 CVEditor: Raw localStorage data:', JSON.stringify(parsed, null, 2));
          
          if (parsed.cvId === cvId && (parsed.structuredCV || parsed.llmParsedData)) {
            console.log('✅ CVEditor: Loading parsed CV from upload');
            
            // Enhanced debugging for contact data mapping
            if (parsed.llmParsedData?.contact) {
              console.log('🔍 CVEditor: Raw ChatGPT contact data:', JSON.stringify(parsed.llmParsedData.contact, null, 2));
            }
            if (parsed.structuredCV?.contact) {
              console.log('🔍 CVEditor: Structured CV contact data:', JSON.stringify(parsed.structuredCV.contact, null, 2));
            }
            
            // Prioritize LLM-parsed structured CV data over basic extraction
            const structuredCV = parsed.structuredCV;
            
            // Enhanced contact field mapping with direct access to ChatGPT data as fallback
            const chatGptContact = parsed.llmParsedData?.contact || {};
            const structuredContact = structuredCV?.contact || {};
            
            console.log('🔍 CVEditor: Contact field mapping debug:');
            console.log('  - ChatGPT full_name:', chatGptContact.full_name);
            console.log('  - Structured fullName:', structuredContact.fullName);
            console.log('  - ChatGPT address:', chatGptContact.address);
            console.log('  - Structured location:', structuredContact.location);
            console.log('  - ChatGPT linkedin:', chatGptContact.linkedin);
            console.log('  - Structured linkedin:', structuredContact.linkedin);
            
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
                  console.log('🎯 CVEditor: Final mapped fullName:', name);
                  return name;
                })(),
                email: (() => {
                  const email = structuredContact.email || chatGptContact.email || '';
                  console.log('🎯 CVEditor: Final mapped email:', email);
                  return email;
                })(),
                phone: (() => {
                  const phone = structuredContact.phone || chatGptContact.phone || '';
                  console.log('🎯 CVEditor: Final mapped phone:', phone);
                  return phone;
                })(),
                location: (() => {
                  // Map both address and location fields from ChatGPT
                  const location = structuredContact.location || 
                                  chatGptContact.address || 
                                  structuredContact.address || 
                                  '';
                  console.log('🎯 CVEditor: Final mapped location:', location);
                  return location;
                })(),
                linkedin: (() => {
                  const linkedin = structuredContact.linkedin || chatGptContact.linkedin || '';
                  console.log('🎯 CVEditor: Final mapped linkedin:', linkedin);
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
                  console.log('🔍 CVEditor: Processing work experience data');
                  
                  // Enhanced work experience mapping with ChatGPT fallback
                  const chatGptExperience = parsed.llmParsedData?.work_experience || [];
                  const structuredExperience = structuredCV.experience?.items || structuredCV.experience || [];
                  
                  console.log('🔍 CVEditor: ChatGPT work experience count:', chatGptExperience.length);
                  console.log('🔍 CVEditor: Structured work experience count:', structuredExperience.length);
                  
                  if (structuredExperience.length > 0) {
                    console.log('✅ CVEditor: Using structured experience data');
                    return structuredExperience;
                  }
                  
                  // Fallback: Map ChatGPT data directly with Present/hiện tại handling
                  console.log('⚠️ CVEditor: Falling back to ChatGPT data mapping');
                  return chatGptExperience.map((exp: any, index: number) => {
                    // Handle "Present" or "hiện tại" end dates
                    const isCurrentJob = exp.end_date && 
                      (exp.end_date.toLowerCase().includes('present') || 
                       exp.end_date.toLowerCase().includes('hiện tại'));
                    
                    console.log(`🔍 CVEditor: Fallback Experience ${index + 1} - Position: ${exp.position}, End Date: "${exp.end_date}", Is Current: ${isCurrentJob}`);
                    
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
            
            console.log('🔍 CVEditor: Final transformed contact data:', JSON.stringify(transformedData.contact, null, 2));
            
            // Update state with transformed data
            setCvData(transformedData);
            hasLoadedDataRef.current = true; // Mark as loaded
            
            // Check if this was a successful LLM parsing
            if (parsed.llmParsedData && parsed.llmParsedData.possibility_score >= 5) {
              console.log('🎉 CVEditor: LLM parsing was successful - will show success notification');
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
        console.log('🔄 CVEditor: Using CV workflow context data');
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
      console.log('🎯 Guest Session: Setting focus to Work Experience section for aha moment');
      hasSetTemplateFocusRef.current = cvId; // Mark this cvId as processed
      setActiveSection('experience');
      
      // Scroll to experience section after a brief delay to ensure DOM is ready
      setTimeout(() => {
        const sectionElement = document.getElementById('section-experience');
        if (sectionElement) {
          console.log('🎯 Guest Session: Scrolling to Work Experience section');
          sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500); // 500ms delay to ensure CV Editor is fully rendered
    }
  }, [cvId, cvData]); // Run when cvId changes or when cvData is loaded

  // Sync with workflow context when cvData changes.
  // Call updateCVData directly — it already debounces save internally (2s).
  // The previous setTimeout(0) wrapper was being cleaned up on every cvData change
  // before it could fire, so updateCVData never ran during continuous typing.
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
    // Re-set on mount: in React 18 StrictMode dev, the effect runs → cleanup → re-runs.
    // Without resetting here, mountedRef stays false after the first cleanup and the
    // sync-effect's mountedRef.current check fails for the rest of the session.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Enhanced data update handler — local state only.
  // The effect above (cvData → updateCVData) handles debounced auto-save.
  const handleDataUpdate = useCallback((newData: CVData) => {
    console.log('📝 CVEditor: Updating CV data');
    setCvData(newData);
  }, []);

  // Handle section updates (compatible with existing EditorPanel interface)
  const handleUpdateSection = useCallback((sectionId: string, data: any) => {
    console.log(`🔧 CVEditor: Updating section ${sectionId}`, data);
    setCvData(prev => ({ ...prev, [sectionId]: data } as CVData));
  }, []);

  // Handle section order changes.
  // Use a functional setState so we don't clobber other section updates that
  // happen in the same tick (e.g. handleAddSection calls onUpdateSection then
  // onSectionOrderChange back-to-back — without functional update the second
  // call's closure would spread a stale cvData and wipe the new section data).
  const handleSectionOrderChange = useCallback((newOrder: string[]) => {
    console.log('🔧 CVEditor: Updating section order', newOrder);
    setCvData(prev => ({ ...prev, sectionOrder: newOrder } as CVData));
  }, []);

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
    // Navigate to workspace
    window.location.href = '/cv-workspace';
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${className}`}>
      {/* Unified Header */}
      <SharedHeader 
        variant="editor"
        showFeedback={false}
        showBackButton={true}
        onBackClick={handleBackToWorkspace}
        backButtonTitle={cvEditorTexts?.header?.backToWorkspace || 'Back to CV Workspace'}
        showAutoSave={true}
        autoSaveStatus={getAutoSaveStatus()}
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
              key={cvId}
              cvData={cvData}
              onUpdateSection={handleUpdateSection}
              onSectionOrderChange={handleSectionOrderChange}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              cvScore={cvScore}
              language={currentLanguage}
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
    </div>
  );
};