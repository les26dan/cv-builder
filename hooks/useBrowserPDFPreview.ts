/**
 * Browser PDF Preview Hook - BREAKTHROUGH APPROACH
 * 
 * Uses EXACT same PDF generation system as Download
 * - generateHTMLForPrint() → Browser PDF engine → Identical output
 * - 3-second debouncing as per requirements
 * - Immediate generation on blur/click outside
 * - Completely isolated from existing auto-save system
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { browserPDFService, BrowserPDFResult } from '../services/browserPdfService';

interface PDFPreviewState {
  isGenerating: boolean;
  pdfUrl: string | null;
  error: string | null;
  lastGenerated: number | null;
  cached: boolean;
}

interface PDFPreviewOptions {
  debounceMs?: number; // Default: 3000ms as per requirements
  enableCache?: boolean; // Default: true
  onGenerationStart?: () => void;
  onGenerationComplete?: (result: BrowserPDFResult) => void;
  onError?: (error: string) => void;
}

interface BrowserPDFPreviewReturn {
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
 * Custom hook for managing browser PDF preview generation with debouncing
 * Uses EXACT same system as Download PDF for identical output
 */
export function useBrowserPDFPreview(
  cvData: any,
  options: PDFPreviewOptions = {}
): BrowserPDFPreviewReturn {
  
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
   */
  const generateDataHash = useCallback((data: any): string => {
    try {
      const hashData = {
        contact: data?.contact,
        summary: data?.summary?.content,
        experienceCount: data?.experience?.items?.length || 0,
        skillsCount: data?.skills?.items?.length || 0,
        educationCount: data?.education?.items?.length || 0
      };
      return JSON.stringify(hashData);
    } catch (error) {
      console.warn('⚠️ PDF hash generation failed:', error);
      return Date.now().toString();
    }
  }, []);

  /**
   * Clear existing PDF generation timer
   */
  const clearPDFTimer = useCallback(() => {
    if (pdfGenerationTimer.current) {
      clearTimeout(pdfGenerationTimer.current);
      pdfGenerationTimer.current = null;
    }
  }, []);

  /**
   * Generate PDF using browser PDF service (EXACT same as Download)
   */
  const generatePDF = useCallback(async () => {
    try {
      console.log('🔄 Browser PDF Preview: Starting PDF generation...');
      console.log('📊 Browser PDF Preview: Using EXACT same system as Download PDF');
      
      setPdfState(prev => ({
        ...prev,
        isGenerating: true,
        error: null
      }));

      // Notify generation start
      onGenerationStart?.();

      // Generate PDF using browser PDF service (same as Download)
      console.log('🔧 Browser PDF Preview: Calling browserPDFService.generatePDF...');
      const result = await browserPDFService.generatePDF(cvData, {
        useCache: enableCache,
        quality: 'draft' // Use draft quality for preview
      });

      console.log('📋 Browser PDF Preview: Generation result:', {
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

        console.log('✅ Browser PDF Preview: PDF generated successfully');
        console.log('🔗 Browser PDF Preview: PDF URL created:', result.pdfUrl.substring(0, 50) + '...');
        
        setPdfState(prev => ({
          ...prev,
          isGenerating: false,
          pdfUrl: result.pdfUrl!,
          error: null,
          lastGenerated: Date.now(),
          cached: result.cached || false
        }));

        // Update last data hash
        lastDataHashRef.current = generateDataHash(cvData);
        
        console.log('✅ Browser PDF Preview: IDENTICAL PDF to Download created successfully');
        onGenerationComplete?.(result);

      } else {
        throw new Error(result.error || 'Browser PDF generation failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown PDF generation error';
      
      console.error('❌ Browser PDF Preview: Generation failed:', errorMessage);
      
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
   */
  const triggerPDFGeneration = useCallback((immediate = false) => {
    console.log('🎯 Browser PDF Preview: triggerPDFGeneration called', {
      immediate,
      isUserTyping,
      hasExistingTimer: !!pdfGenerationTimer.current
    });

    // Clear any existing timer
    clearPDFTimer();

    // Don't generate if user is actively typing (unless immediate)
    if (isUserTyping && !immediate) {
      console.log('⏸️ Browser PDF Preview: Skipping generation - user is typing');
      return;
    }

    // Check if data has actually changed
    const currentDataHash = generateDataHash(cvData);
    if (currentDataHash === lastDataHashRef.current && pdfState.pdfUrl) {
      console.log('📋 Browser PDF Preview: Skipping generation - data unchanged');
      return;
    }

    if (immediate) {
      // Generate immediately (e.g., on blur/click outside)
      console.log('⚡ Browser PDF Preview: Immediate generation triggered');
      generatePDF();
    } else {
      // Debounced generation (3-second delay)
      console.log(`⏱️ Browser PDF Preview: Scheduling generation in ${debounceMs}ms`);
      pdfGenerationTimer.current = setTimeout(() => {
        console.log('⏰ Browser PDF Preview: Debounce timer fired, generating PDF...');
        generatePDF();
      }, debounceMs);
    }
  }, [isUserTyping, generateDataHash, cvData, pdfState.pdfUrl, clearPDFTimer, debounceMs, generatePDF]);

  /**
   * Set user typing state with automatic PDF trigger
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
   */
  const handleInputFocus = useCallback(() => {
    console.log('🎯 Browser PDF Preview: handleInputFocus called');
    activeInputRef.current = true;
    setIsUserTyping(true);
    
    // Clear any pending PDF generation
    clearPDFTimer();
    
    console.log('🎯 Browser PDF Preview: Input focused - PDF generation paused');
  }, [clearPDFTimer]);

  /**
   * Handle input blur events (click outside)
   */
  const handleInputBlur = useCallback(() => {
    console.log('👆 Browser PDF Preview: handleInputBlur called');
    activeInputRef.current = false;
    setIsUserTyping(false);
    
    // Trigger immediate PDF generation (click outside requirement)
    console.log('👆 Browser PDF Preview: Input blurred - triggering immediate PDF generation');
    triggerPDFGeneration(true);
  }, [triggerPDFGeneration]);

  /**
   * Handle input change events
   */
  const handleInputChange = useCallback(() => {
    console.log('⌨️ Browser PDF Preview: handleInputChange called');
    setIsUserTyping(true);
    
    // Clear existing timer and start new debounce
    clearPDFTimer();
    
    // Set new timer for when user stops typing
    console.log(`⏱️ Browser PDF Preview: Setting typing debounce timer for ${debounceMs}ms`);
    pdfGenerationTimer.current = setTimeout(() => {
      console.log('⏰ Browser PDF Preview: Typing timer fired');
      if (!activeInputRef.current) {
        console.log('📝 Browser PDF Preview: No active input, stopping typing state');
        setIsUserTyping(false);
        triggerPDFGeneration(false);
      } else {
        console.log('🎯 Browser PDF Preview: Input still active, keeping typing state');
      }
    }, debounceMs);
  }, [clearPDFTimer, debounceMs, triggerPDFGeneration]);

  /**
   * Clear PDF and reset state
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
    
    console.log('🧹 Browser PDF Preview: State cleared');
  }, [pdfState.pdfUrl, pdfState.cached, clearPDFTimer]);

  /**
   * Effect to handle CV data changes
   */
  useEffect(() => {
    const currentDataHash = generateDataHash(cvData);
    
    // Only trigger if data has changed and user is not typing
    if (currentDataHash !== lastDataHashRef.current && !isUserTyping && !activeInputRef.current) {
      console.log('📝 Browser PDF Preview: CV data changed - scheduling PDF generation');
      triggerPDFGeneration(false);
    }
  }, [cvData, generateDataHash, isUserTyping, triggerPDFGeneration]);

  /**
   * Cleanup effect
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

export type { PDFPreviewState, PDFPreviewOptions, BrowserPDFPreviewReturn };
