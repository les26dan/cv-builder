/**
 * PDF Content Renderer - Clean PDF Display Like Resume.io
 * 
 * SAFETY DESIGN:
 * - Renders PDF content as clean canvas without browser PDF viewer UI
 * - Matches Resume.io's clean PDF preview approach
 * - Comprehensive error handling with fallback
 * - Uses PDF.js for reliable PDF rendering
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface PDFContentRendererProps {
  pdfUrl: string;
  onError?: (error: string) => void;
  className?: string;
}

interface PDFRenderState {
  isLoading: boolean;
  error: string | null;
  pageCount: number;
  currentPage: number;
  scale: number;
}

/**
 * Clean PDF Content Renderer - Shows only CV content like Resume.io
 * SAFETY: Isolated PDF rendering with comprehensive error handling
 */
export const PDFContentRenderer: React.FC<PDFContentRendererProps> = ({
  pdfUrl,
  onError,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderState, setRenderState] = useState<PDFRenderState>({
    isLoading: true,
    error: null,
    pageCount: 0,
    currentPage: 1,
    scale: 1
  });

  // PDF.js library reference
  const pdfjsLib = useRef<any>(null);
  const pdfDocument = useRef<any>(null);
  const renderTask = useRef<any>(null);
  const isRendering = useRef<boolean>(false);

  /**
   * Initialize PDF.js library
   * SAFETY: Dynamic import with comprehensive error handling
   */
  const initializePDFjs = useCallback(async () => {
    try {
      console.log('🔧 PDFContentRenderer: Initializing PDF.js...');
      
      if (!pdfjsLib.current) {
        // Dynamic import of PDF.js
        pdfjsLib.current = await import('pdfjs-dist');
        
        // Set worker source for PDF.js - Use local worker for reliability
        if (typeof window !== 'undefined') {
          // Strategy 1: Use local worker file (most reliable)
          pdfjsLib.current.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          console.log('✅ PDFContentRenderer: Using local PDF.js worker from /public');
        }
        
        console.log('✅ PDFContentRenderer: PDF.js initialized successfully');
      }
      
      return pdfjsLib.current;
    } catch (error) {
      console.error('❌ PDFContentRenderer: PDF.js initialization failed:', error);
      throw new Error('Failed to initialize PDF.js library');
    }
  }, []);

  /**
   * Calculate optimal scale for PDF display
   * SAFETY: Ensures PDF fits container while maintaining quality
   */
  const calculateScale = useCallback(() => {
    if (!containerRef.current) return 1;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // A4 dimensions at 72 DPI (PDF default)
    const A4_WIDTH = 595; // points
    const A4_HEIGHT = 842; // points
    
    // Calculate scale to fit container
    const widthScale = containerWidth / A4_WIDTH;
    const heightScale = containerHeight / A4_HEIGHT;
    
    // Use smaller scale to ensure entire page fits
    const optimalScale = Math.min(widthScale, heightScale, 2); // Max 2x scale
    
    console.log('📏 PDFContentRenderer: Calculated scale:', {
      containerWidth,
      containerHeight,
      widthScale,
      heightScale,
      optimalScale
    });
    
    return Math.max(0.5, optimalScale); // Minimum 0.5x scale
  }, []);

  /**
   * Render PDF page to canvas
   * SAFETY: Clean rendering with error boundaries and concurrent render prevention
   */
  const renderPDFPage = useCallback(async (pageNumber: number = 1) => {
    try {
      if (!pdfDocument.current || !canvasRef.current) {
        console.warn('⚠️ PDFContentRenderer: Missing PDF document or canvas');
        return;
      }

      // Prevent concurrent renders on the same canvas
      if (isRendering.current) {
        console.warn('⚠️ PDFContentRenderer: Render already in progress, cancelling previous render');
        if (renderTask.current) {
          renderTask.current.cancel();
          renderTask.current = null;
        }
      }

      isRendering.current = true;
      console.log('🎨 PDFContentRenderer: Rendering page', pageNumber);
      
      const page = await pdfDocument.current.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas 2D context');
      }

      // Calculate viewport with optimal scale
      const scale = calculateScale();
      const viewport = page.getViewport({ scale });
      
      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Render PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      console.log('🖼️ PDFContentRenderer: Starting page render...', {
        pageNumber,
        scale,
        width: viewport.width,
        height: viewport.height
      });
      
      // Store render task for potential cancellation
      renderTask.current = page.render(renderContext);
      await renderTask.current.promise;
      
      console.log('✅ PDFContentRenderer: Page rendered successfully');
      
      setRenderState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        currentPage: pageNumber,
        scale
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PDF rendering failed';
      
      // Don't log cancellation as an error
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('abort')) {
        console.error('❌ PDFContentRenderer: Page render failed:', errorMessage);
        
        setRenderState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
        
        onError?.(errorMessage);
      } else {
        console.log('🔄 PDFContentRenderer: Render cancelled (expected)');
      }
    } finally {
      isRendering.current = false;
      renderTask.current = null;
    }
  }, [calculateScale, onError]);

  /**
   * Load PDF document from URL
   * SAFETY: Comprehensive PDF loading with error handling
   */
  const loadPDFDocument = useCallback(async () => {
    try {
      console.log('📄 PDFContentRenderer: Loading PDF from URL:', pdfUrl);
      
      setRenderState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      // Initialize PDF.js if needed
      const pdfjs = await initializePDFjs();
      
      // Load PDF document
      const loadingTask = pdfjs.getDocument(pdfUrl);
      pdfDocument.current = await loadingTask.promise;
      
      console.log('✅ PDFContentRenderer: PDF document loaded', {
        pageCount: pdfDocument.current.numPages
      });
      
      setRenderState(prev => ({
        ...prev,
        pageCount: pdfDocument.current.numPages
      }));
      
      // Render first page
      await renderPDFPage(1);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PDF loading failed';
      console.error('❌ PDFContentRenderer: PDF load failed:', errorMessage);
      
      setRenderState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      onError?.(errorMessage);
    }
  }, [pdfUrl, initializePDFjs, renderPDFPage, onError]);

  /**
   * Handle container resize
   * SAFETY: Responsive PDF rendering
   */
  const handleResize = useCallback(() => {
    if (pdfDocument.current && !renderState.isLoading) {
      console.log('📐 PDFContentRenderer: Container resized, re-rendering...');
      renderPDFPage(renderState.currentPage);
    }
  }, [renderPDFPage, renderState.currentPage, renderState.isLoading]);

  /**
   * Load PDF when URL changes
   */
  useEffect(() => {
    if (pdfUrl) {
      loadPDFDocument();
    }
    
    // Cleanup on unmount or URL change
    return () => {
      // Cancel any ongoing render
      if (renderTask.current) {
        console.log('🧹 PDFContentRenderer: Cancelling ongoing render task');
        renderTask.current.cancel();
        renderTask.current = null;
      }
      
      // Reset rendering state
      isRendering.current = false;
      
      // Destroy PDF document
      if (pdfDocument.current) {
        console.log('🧹 PDFContentRenderer: Destroying PDF document');
        pdfDocument.current.destroy();
        pdfDocument.current = null;
      }
    };
  }, [pdfUrl, loadPDFDocument]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  /**
   * Navigate to specific page (for multi-page CVs)
   */
  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= renderState.pageCount && !renderState.isLoading) {
      console.log('📄 PDFContentRenderer: Navigating to page', pageNumber);
      renderPDFPage(pageNumber);
    }
  }, [renderState.pageCount, renderState.isLoading, renderPDFPage]);

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full flex flex-col items-center justify-center ${className}`}
    >
      {/* Loading State */}
      {renderState.isLoading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Rendering PDF...</span>
        </div>
      )}

      {/* Error State */}
      {renderState.error && (
        <div className="text-center p-4">
          <p className="text-red-600 mb-2">PDF Rendering Error</p>
          <p className="text-sm text-gray-500 mb-3">{renderState.error}</p>
          <button 
            onClick={loadPDFDocument}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* PDF Canvas - Clean Content Display */}
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full shadow-lg ${
          renderState.isLoading || renderState.error ? 'hidden' : 'block'
        }`}
        style={{
          backgroundColor: 'white',
          borderRadius: '4px'
        }}
      />

      {/* Page Navigation for Multi-page CVs */}
      {renderState.pageCount > 1 && !renderState.isLoading && !renderState.error && (
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => goToPage(renderState.currentPage - 1)}
            disabled={renderState.currentPage <= 1}
            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded disabled:opacity-50 hover:bg-gray-200"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {renderState.currentPage} of {renderState.pageCount}
          </span>
          
          <button
            onClick={() => goToPage(renderState.currentPage + 1)}
            disabled={renderState.currentPage >= renderState.pageCount}
            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded disabled:opacity-50 hover:bg-gray-200"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFContentRenderer;
