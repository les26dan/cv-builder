/**
 * CV Editor Component
 * Following OkBuddy development tenets - modular, replaceable, accessible
 * Updated for enhanced CV parsing integration and JD optimization workflow
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EditorPanel } from './EditorPanel';
import { PreviewPanel } from './PreviewPanel';
import { calculateCvScore } from '../utils/cvScoring';
import { useCVWorkflow } from '../shared/contexts/CVWorkflowContext';
import { type CVData } from '../shared/types/workflow';
// JD optimization service removed - using new LLM-based CV parser instead

interface CVEditorProps {
  className?: string;
  initialData?: CVData;
  onDataChange?: (data: CVData) => void;
  language?: 'vi' | 'en';
  cvId?: string; // Added to support guided editing page integration
}

export const CVEditor: React.FC<CVEditorProps> = ({
  className = '',
  initialData,
  onDataChange,
  language = 'vi',
  cvId // Accept cvId prop for integration with guided editing workflow
}) => {
  // CV Workflow Context for data management
  const { state, updateCVData, saveCVData } = useCVWorkflow();

  // Local state management
  const [cvData, setCvData] = useState<CVData>(() => {
    // Priority-based data initialization (enhanced for parsing integration)
    if (initialData) {
      console.log('🔄 CVEditor: Using provided initialData');
      return initialData;
    }
    
    // Check for uploaded CV data in localStorage first (for upload flow)
    if (cvId && typeof window !== 'undefined') {
      // Try loading uploaded CV data with cvId key
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
          console.log('🔄 CVEditor: Found uploaded CV data:', parsed);
          
          // Check if this upload data matches our cvId
          if (parsed.cvId === cvId && (parsed.structuredCV || parsed.llmParsedData)) {
            console.log('✅ CVEditor: Loading parsed CV from upload');
            
            // Prioritize LLM-parsed structured CV data over basic extraction
            const structuredCV = parsed.structuredCV;
            console.log('🔍 CVEditor: Structured CV data:', structuredCV);
            console.log('🔍 CVEditor: Skills data:', structuredCV.skills);
            
            const transformedData: CVData = {
              id: cvId,
              contact: {
                fullName: structuredCV.contact?.fullName || structuredCV.contact?.name || structuredCV.name || '',
                email: structuredCV.contact?.email || '',
                phone: structuredCV.contact?.phone || '',
                location: structuredCV.contact?.location || '',
                linkedin: structuredCV.contact?.linkedin || ''
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
                items: structuredCV.experience?.items || structuredCV.experience || []
              },
              skills: {
                items: (structuredCV.skills?.items || structuredCV.skills || []).map((skill: string) => ({
                  name: skill,
                  level: 'Intermediate' // Default level for parsed skills
                }))
              },
              education: {
                items: structuredCV.education?.items || structuredCV.education || []
              },
              sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
              sectionTitles: {
                contact: 'Thông tin liên hệ',
                summary: 'Tóm tắt',
                experience: 'Kinh nghiệm làm việc',
                skills: 'Kỹ năng',
                education: 'Học vấn'
              }
            };
            
            console.log('✅ CVEditor: Transformed uploaded CV data for editing:', transformedData);
            
            // Check if this was a successful LLM parsing
            if (parsed.llmParsedData && parsed.llmParsedData.possibility_score >= 5) {
              console.log('🎉 CVEditor: LLM parsing was successful - will show success notification');
              // Use setTimeout to show notification after component mounts
              setTimeout(() => setShowParsingSuccess(true), 1000);
              // Auto-hide after 5 seconds
              setTimeout(() => setShowParsingSuccess(false), 6000);
            }
            
            return transformedData;
          }
        }
      } catch (error) {
        console.warn('⚠️ CVEditor: Error loading uploaded CV data:', error);
      }
    }
    
    if (state.cvData && Object.keys(state.cvData).length > 0) {
      console.log('🔄 CVEditor: Using CV workflow context data');
      return state.cvData as CVData;
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
        summary: 'Tóm tắt',
        experience: 'Kinh nghiệm làm việc',
        skills: 'Kỹ năng',
        education: 'Học vấn'
      }
    };
  });

  // JD Optimization removed - using new LLM-based CV parser

  // Active section state for editor panel
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

  // Sync with workflow context when cvData changes
  useEffect(() => {
    if (updateCVData) {
      updateCVData(cvData);
    }
    onDataChange?.(cvData);
  }, [cvData, updateCVData, onDataChange]);

  // Enhanced data update handler with auto-save
  const handleDataUpdate = useCallback((newData: CVData) => {
    console.log('📝 CVEditor: Updating CV data');
    setCvData(newData);
    
    // Auto-save to workflow context
    if (saveCVData) {
      try {
        saveCVData(newData);
        console.log('💾 CVEditor: Auto-saved to workflow context');
      } catch (error) {
        console.error('❌ CVEditor: Auto-save failed:', error);
      }
    }
  }, [saveCVData]);

  // Handle section updates (compatible with existing EditorPanel interface)
  const handleUpdateSection = useCallback((sectionId: string, data: any) => {
    console.log(`🔧 CVEditor: Updating section ${sectionId}`, data);
    
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

  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Success Notification for LLM Parsing */}
      {showParsingSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg transition-all duration-300">
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
      
      {/* Left Panel: Editor */}
      <div className="w-3/5 bg-[#E0F7FA] overflow-y-auto">
        <EditorPanel
          cvData={cvData}
          onUpdateSection={handleUpdateSection}
          onSectionOrderChange={handleSectionOrderChange}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          cvScore={cvScore}
        />
      </div>

      {/* Right Panel: Preview */}
      <div className="w-2/5 bg-white">
        <PreviewPanel
          cvData={cvData}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      </div>
    </div>
  );
};