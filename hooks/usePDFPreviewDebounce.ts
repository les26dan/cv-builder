/**
 * PDF Preview Debounce Hook
 * 
 * SAFETY DESIGN:
 * - Completely isolated from existing auto-save system
 * - Independent timer management
 * - No interference with CVWorkflowContext
 * - Follows acceptance criteria exactly:
 *   - 3-second debounce when user stops typing
 *   - Immediate trigger on click outside input
 *   - No PDF generation while user is actively typing
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CVData } from '../shared/types/workflow';
import { pdfGenerationService, PDFGenerationResult } from '../services/pdfGenerationService';

interface PDFPreviewState {
  isGenerating: boolean;
  pdfUrl: string | null;
  error: string | null;
  lastGenerated: number | null;
  cached: boolean;
}

interface PDFPreviewDebounceOptions {
  debounceMs?: number; // Default: 3000ms as per requirements
  enableCache?: boolean; // Default: true
  onGenerationStart?: () => void;
  onGenerationComplete?: (result: PDFGenerationResult) => void;
  onError?: (error: string) => void;
}

interface PDFPreviewDebounceReturn {
  // State
  pdfState: PDFPreviewState;
  isUserTyping: boolean;
  
  // Actions
  triggerPDFGeneration: (immediate?: boolean) => void;
  setUserTyping: (typing: boolean) => void;
  clearPDF: () => void;
  
  // Event handlers for input fields
  handleInputFocus: () => void;
  handleInputBlur: () => void;
  handleInputChange: () => void;
}

/**
 * Custom hook for managing PDF preview generation with debouncing
 * SAFETY: Completely independent of existing auto-save system
 */
export function usePDFPreviewDebounce(
  cvData: CVData,
  options: PDFPreviewDebounceOptions = {}
): PDFPreviewDebounceReturn {
  
  const {
    debounceMs = 3000, // 3 seconds as per requirements
    enableCache = true,
    onGenerationStart,
    onGenerationComplete,
    onError
  } = options;

  // PDF generation timer (completely separate from auto-save timer)
  const pdfGenerationTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Track if user is actively typing
  const [isUserTyping, setIsUserTyping] = useState(false);
  
  // PDF generation state
  const [pdfState, setPdfState] = useState<PDFPreviewState>({
    isGenerating: false,
    pdfUrl: null,
    error: null,
    lastGenerated: null,
    cached: false
  });

  // Track last CV data hash to prevent unnecessary regeneration
  const lastDataHashRef = useRef<string>('');
  
  // Track active input focus
  const activeInputRef = useRef<boolean>(false);

  /**
   * Generate simple hash for CV data comparison
   * SAFETY: Lightweight comparison to prevent unnecessary PDF generation
   */
  const generateDataHash = useCallback((data: CVData): string => {
    try {
      const hashData = {
        contact: data.contact,
        summary: data.summary?.content,
        experienceCount: data.experience?.items?.length || 0,
        skillsCount: data.skills?.items?.length || 0,
        educationCount: data.education?.items?.length || 0
      };
      return JSON.stringify(hashData);
    } catch (error) {
      console.warn('⚠️ PDF hash generation failed:', error);
      return Date.now().toString();
    }
  }, []);

  /**
   * Clear existing PDF generation timer
   * SAFETY: Prevents timer conflicts and memory leaks
   */
  const clearPDFTimer = useCallback(() => {
    if (pdfGenerationTimer.current) {
      clearTimeout(pdfGenerationTimer.current);
      pdfGenerationTimer.current = null;
    }
  }, []);

  /**
   * Generate PDF with comprehensive error handling
   * SAFETY: Isolated PDF generation that doesn't affect existing systems
   */
  const generatePDF = useCallback(async () => {
    try {
      console.log('🔄 PDF Preview: Starting PDF generation...');
      console.log('📊 PDF Preview: CV Data structure:', {
        hasContact: !!cvData.contact,
        contactName: cvData.contact?.fullName,
        hasSummary: !!cvData.summary?.content,
        summaryLength: cvData.summary?.content?.length || 0,
        experienceCount: cvData.experience?.items?.length || 0,
        skillsCount: cvData.skills?.items?.length || 0,
        educationCount: cvData.education?.items?.length || 0
      });
      
      setPdfState(prev => ({
        ...prev,
        isGenerating: true,
        error: null
      }));

      // Notify generation start
      onGenerationStart?.();

      // Generate PDF using the service
      console.log('🔧 PDF Preview: Calling pdfGenerationService.generatePDF...');
      const result = await pdfGenerationService.generatePDF(cvData, {
        useCache: enableCache,
        quality: 'draft' // Use draft quality for preview
      });

      console.log('📋 PDF Preview: Generation result:', {
        success: result.success,
        hasPdfUrl: !!result.pdfUrl,
        cached: result.cached,
        error: result.error
      });

      if (result.success && result.pdfUrl) {
        // Clean up previous PDF URL to prevent memory leaks
        if (pdfState.pdfUrl && !pdfState.cached) {
          URL.revokeObjectURL(pdfState.pdfUrl);
        }

        // EXTENSIVE DEBUG: Validate the result before setting state
        console.log('🔍 PDF Preview: EXTENSIVE RESULT VALIDATION:');
        console.log('🔍 Result object:', result);
        console.log('🔍 Result.success:', result.success);
        console.log('🔍 Result.pdfUrl exists:', !!result.pdfUrl);
        console.log('🔍 Result.pdfUrl value:', result.pdfUrl);
        console.log('🔍 Result.pdfUrl length:', result.pdfUrl?.length);
        console.log('🔍 Result.pdfBlob exists:', !!result.pdfBlob);
        console.log('🔍 Result.pdfBlob size:', result.pdfBlob?.size);
        console.log('🔍 Result.cached:', result.cached);
        console.log('🔍 Result.error:', result.error);
        
        // Test the URL before setting state
        if (result.pdfUrl) {
          try {
            const testUrl = new URL(result.pdfUrl);
            console.log('🔍 PDF URL validation:', {
              protocol: testUrl.protocol,
              hostname: testUrl.hostname,
              pathname: testUrl.pathname,
              isBlob: testUrl.protocol === 'blob:'
            });
          } catch (error) {
            console.error('❌ PDF URL validation failed:', error);
          }
        }
        
        setPdfState(prev => {
          const newState = {
            ...prev,
            isGenerating: false,
            pdfUrl: result.pdfUrl!,
            error: null,
            lastGenerated: Date.now(),
            cached: result.cached || false
          };
          
          console.log('🔍 PDF Preview: Setting new state:', newState);
          return newState;
        });

        // Update last data hash
        lastDataHashRef.current = generateDataHash(cvData);
        
        console.log('🔍 PDF Preview: State update completed, lastDataHash:', lastDataHashRef.current);
        console.log('✅ PDF Preview: PDF generated successfully');
        console.log('🔗 PDF Preview: PDF URL created:', result.pdfUrl);
        onGenerationComplete?.(result);

      } else {
        throw new Error(result.error || 'PDF generation failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown PDF generation error';
      
      console.error('❌ PDF Preview: Generation failed:', errorMessage);
      console.error('❌ PDF Preview: Full error:', error);
      
      setPdfState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));

      onError?.(errorMessage);
    }
  }, [cvData, enableCache, onGenerationStart, onGenerationComplete, onError, generateDataHash, pdfState.pdfUrl, pdfState.cached]);

  /**
   * Trigger PDF generation with debouncing
   * SAFETY: Respects user typing state and debounce requirements
   */
  const triggerPDFGeneration = useCallback((immediate = false) => {
    console.log('🎯 PDF Preview: triggerPDFGeneration called', {
      immediate,
      isUserTyping,
      hasExistingTimer: !!pdfGenerationTimer.current,
      hasPdfUrl: !!pdfState.pdfUrl,
      isGenerating: pdfState.isGenerating
    });

    // Clear any existing timer
    clearPDFTimer();

    // Don't generate if user is actively typing (unless immediate)
    if (isUserTyping && !immediate) {
      console.log('⏸️ PDF Preview: Skipping generation - user is typing');
      return;
    }

    // Check if data has actually changed
    const currentDataHash = generateDataHash(cvData);
    console.log('🔍 PDF Preview: Data hash comparison:', {
      currentHash: currentDataHash.substring(0, 8) + '...',
      lastHash: lastDataHashRef.current.substring(0, 8) + '...',
      hasChanged: currentDataHash !== lastDataHashRef.current
    });

    if (currentDataHash === lastDataHashRef.current && pdfState.pdfUrl) {
      console.log('📋 PDF Preview: Skipping generation - data unchanged');
      return;
    }

    if (immediate) {
      // Generate immediately (e.g., on blur/click outside)
      console.log('⚡ PDF Preview: Immediate generation triggered');
      generatePDF();
    } else {
      // Debounced generation (3-second delay)
      console.log(`⏱️ PDF Preview: Scheduling generation in ${debounceMs}ms`);
      pdfGenerationTimer.current = setTimeout(() => {
        console.log('⏰ PDF Preview: Debounce timer fired, generating PDF...');
        generatePDF();
      }, debounceMs);
    }
  }, [isUserTyping, generateDataHash, cvData, lastDataHashRef, pdfState.pdfUrl, clearPDFTimer, debounceMs, generatePDF]);

  /**
   * Set user typing state with automatic PDF trigger
   * SAFETY: Manages typing state and triggers generation when typing stops
   */
  const setUserTypingState = useCallback((typing: boolean) => {
    setIsUserTyping(typing);
    
    if (!typing && !activeInputRef.current) {
      // User stopped typing and no input is focused - trigger debounced generation
      triggerPDFGeneration(false);
    }
  }, [triggerPDFGeneration]);

  /**
   * Handle input focus events
   * SAFETY: Tracks input focus to prevent premature PDF generation
   */
  const handleInputFocus = useCallback(() => {
    console.log('🎯 PDF Preview: handleInputFocus called');
    activeInputRef.current = true;
    setIsUserTyping(true);
    
    // Clear any pending PDF generation
    clearPDFTimer();
    
    console.log('🎯 PDF Preview: Input focused - PDF generation paused');
  }, [clearPDFTimer]);

  /**
   * Handle input blur events (click outside)
   * SAFETY: Triggers immediate PDF generation as per requirements
   */
  const handleInputBlur = useCallback(() => {
    console.log('👆 PDF Preview: handleInputBlur called');
    activeInputRef.current = false;
    setIsUserTyping(false);
    
    // Trigger immediate PDF generation (click outside requirement)
    console.log('👆 PDF Preview: Input blurred - triggering immediate PDF generation');
    triggerPDFGeneration(true);
  }, [triggerPDFGeneration]);

  /**
   * Handle input change events
   * SAFETY: Resets debounce timer on each keystroke
   */
  const handleInputChange = useCallback(() => {
    console.log('⌨️ PDF Preview: handleInputChange called');
    setIsUserTyping(true);
    
    // Clear existing timer and start new debounce
    clearPDFTimer();
    
    // Set new timer for when user stops typing
    console.log(`⏱️ PDF Preview: Setting typing debounce timer for ${debounceMs}ms`);
    pdfGenerationTimer.current = setTimeout(() => {
      console.log('⏰ PDF Preview: Typing timer fired');
      if (!activeInputRef.current) {
        console.log('📝 PDF Preview: No active input, stopping typing state');
        setIsUserTyping(false);
        triggerPDFGeneration(false);
      } else {
        console.log('🎯 PDF Preview: Input still active, keeping typing state');
      }
    }, debounceMs);
  }, [clearPDFTimer, debounceMs, triggerPDFGeneration]);

  /**
   * Clear PDF and reset state
   * SAFETY: Proper cleanup of resources
   */
  const clearPDF = useCallback(() => {
    // Clean up PDF URL to prevent memory leaks
    if (pdfState.pdfUrl && !pdfState.cached) {
      URL.revokeObjectURL(pdfState.pdfUrl);
    }

    setPdfState({
      isGenerating: false,
      pdfUrl: null,
      error: null,
      lastGenerated: null,
      cached: false
    });

    clearPDFTimer();
    lastDataHashRef.current = '';
    
    console.log('🧹 PDF Preview: State cleared');
  }, [pdfState.pdfUrl, pdfState.cached, clearPDFTimer]);

  /**
   * Effect to handle CV data changes
   * SAFETY: Only triggers when data actually changes, respects typing state
   */
  useEffect(() => {
    const currentDataHash = generateDataHash(cvData);
    
    // Only trigger if data has changed and user is not typing
    if (currentDataHash !== lastDataHashRef.current && !isUserTyping && !activeInputRef.current) {
      console.log('📝 PDF Preview: CV data changed - scheduling PDF generation');
      triggerPDFGeneration(false);
    }
  }, [cvData, generateDataHash, isUserTyping, triggerPDFGeneration]);

  /**
   * Cleanup effect
   * SAFETY: Prevents memory leaks and timer conflicts
   */
  useEffect(() => {
    return () => {
      clearPDFTimer();
      
      // Clean up PDF URL on unmount
      if (pdfState.pdfUrl && !pdfState.cached) {
        URL.revokeObjectURL(pdfState.pdfUrl);
      }
    };
  }, [clearPDFTimer, pdfState.pdfUrl, pdfState.cached]);

  return {
    // State
    pdfState,
    isUserTyping,
    
    // Actions
    triggerPDFGeneration,
    setUserTyping: setUserTypingState,
    clearPDF,
    
    // Event handlers
    handleInputFocus,
    handleInputBlur,
    handleInputChange
  };
}

export type { PDFPreviewState, PDFPreviewDebounceOptions, PDFPreviewDebounceReturn };
