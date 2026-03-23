import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { ChevronDownIcon, EyeIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { downloadCV } from '../utils/downloadUtils';
import { getTexts } from '../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../config/languageConfig';

// BREAKTHROUGH: Browser PDF Generation - EXACT same system as Download PDF
import { useBrowserPDFPreview } from '../hooks/useBrowserPDFPreview';
import DirectPDFViewer from './common/DirectPDFViewer';

interface PreviewPanelProps {
  cvData: any;
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
  language?: SupportedLanguage;
  autoSaveStatus?: 'saving' | 'saved' | 'error' | 'offline' | 'guest';
  // pdfPreview is now OPTIONAL - we generate HTML directly
}

// PreviewPanel component - BREAKTHROUGH: Now uses EXACT same PDF as Download
export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  cvData,
  activeSection,
  setActiveSection,
  language,
  autoSaveStatus = 'saved'
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  // Language and text configuration
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [previewTexts, setPreviewTexts] = useState<any>(null);

  // BREAKTHROUGH: Use browser PDF generation - EXACT same system as Download
  const browserPDF = useBrowserPDFPreview(cvData, {
    debounceMs: 3000, // 3-second debounce as per requirements
    enableCache: true,
    onGenerationStart: () => {
      console.log('🔄 Preview Panel: PDF generation started');
    },
    onGenerationComplete: (result) => {
      console.log('✅ Preview Panel: PDF generation completed', {
        success: result.success,
        cached: result.cached
      });
    },
    onError: (error) => {
      console.error('❌ Preview Panel: PDF generation error:', error);
    }
  });

  
  // Load language configuration
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
        const effectiveLanguage = language || savedLanguage || detectLanguage().language;
        
        setCurrentLanguage(effectiveLanguage);
        const texts = await getTexts('cvEditor', effectiveLanguage);
        setPreviewTexts(texts.preview);
      } catch (error) {
        console.error('Failed to load preview texts:', error);
        setCurrentLanguage('en');
      }
    };
    
    loadLanguage();
  }, [language]);

  // PDF rendering is now handled by PDFRenderer component

  // Memoized download handler for performance
  const handleDownload = useCallback(async (format: 'pdf' | 'docx' | 'latex') => {
    
    try {
      setDownloadLoading(format);
      
      await downloadCV(cvData, format);
      const success = true;
      
      if (success) {
        // CV downloaded successfully
      } else {
        console.error('❌ Download failed for format:', format);
      }
    } catch (error) {
      console.error('❌ Download error:', error);
    } finally {
      setDownloadLoading(null);
      setIsDropdownOpen(false);
    }
  }, [cvData]);

  // Memoized section click handler for performance
  const handleSectionClick = useCallback((section: string) => {
    setActiveSection(section);
  }, [setActiveSection]);

  // Memoized dropdown toggle for performance
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  // Close dropdown when clicking outside
  const handleDropdownBlur = useCallback(() => {
    setTimeout(() => setIsDropdownOpen(false), 150);
  }, []);

  // Clear active section when clicking outside
  const handlePreviewClick = useCallback((e: React.MouseEvent) => {
    // Check if the clicked element or its parents are section content
    const target = e.target as HTMLElement;
    
    // Don't clear if clicking on CV content or section elements
    const isClickOnCVContent = target.closest('[data-section]') || 
                              target.closest('.cv-section') || 
                              target.closest('.cv-content');
    
    // Clear active section if clicking outside CV content
    if (!isClickOnCVContent) {
      setActiveSection(null);
    }
  }, [setActiveSection]);



  // Auto-save status display functions (updated to use proper texts)
  const getAutoSaveDisplay = () => {
    // Use the same text loading as the previewTexts
    const autosaveTexts = previewTexts?.autosave || {
      saving: 'Saving...',
      saved: 'Auto-saved', 
      error: 'Save error',
      offline: 'Offline mode',
      guestWarning: 'Your progress is not saved'
    };
    
    switch (autoSaveStatus) {
      case 'saving':
        return `⏳ ${autosaveTexts.saving}`;
      case 'saved':
        return `✓ ${autosaveTexts.saved}`;
      case 'error':
        return `❌ ${autosaveTexts.error}`;
      case 'offline':
        return `📴 ${autosaveTexts.offline}`;
      case 'guest':
        return autosaveTexts.guestWarning;
      default:
        return `✓ ${autosaveTexts.saved}`;
    }
  };

  const getAutoSaveStyle = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'bg-blue-50 text-blue-600 border-blue-500/20';
      case 'saved':
        return 'bg-green-50 text-green-600 border-green-500/20';
      case 'error':
        return 'bg-red-50 text-red-600 border-red-500/20';
      case 'offline':
        return 'bg-yellow-50 text-yellow-600 border-yellow-500/20';
      case 'guest':
        return 'bg-orange-50 text-orange-600 border-orange-500/20';
      default:
        return 'bg-green-50 text-green-600 border-green-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <h2 className="text-lg font-medium">{previewTexts?.title || 'CV Preview'}</h2>
        
        <div className="flex items-center gap-4">
          {/* Auto-save Status - Left of Download Button */}
          <div className={`px-3 py-1 text-sm rounded-full border font-inter ${getAutoSaveStyle()}`}>
            {getAutoSaveDisplay()}
          </div>

          {/* PDF Status Info */}
          {browserPDF.pdfState.pdfUrl && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-xs font-medium">
                PDF Ready
              </span>
            </div>
          )}

          {/* Download Button */}
          <div className="relative">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-[#0277BD] text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
              onClick={toggleDropdown}
              onBlur={handleDropdownBlur}
              disabled={downloadLoading !== null}
            >
              {downloadLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <DownloadIcon size={16} />
                  <span>{previewTexts?.actions?.download || 'Download PDF'}</span>
                  <ChevronDownIcon size={16} />
                </>
              )}
            </button>
            
            {isDropdownOpen && !downloadLoading && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => handleDownload('pdf')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleDownload('docx')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                >
                  <span>Word (.docx)</span>
                </button>
                <button
                  onClick={() => handleDownload('latex')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                >
                  <span>LaTeX (.tex)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BREAKTHROUGH: PDF Preview Content - EXACT same PDF as Download */}
      <div 
        ref={previewContainerRef}
        className="flex-1 bg-[#f3f4f6] p-3 flex flex-col items-center justify-center overflow-hidden" 
        onClick={handlePreviewClick}
      >
        {/* ACTUAL PDF PREVIEW SYSTEM - Clean Display Like Resume.io */}
        <div className="relative w-full h-full flex items-center justify-center bg-white">
          <div className="w-full h-full overflow-hidden relative"
               style={{
                 maxWidth: '794px', // A4 width
                 maxHeight: '1123px', // A4 height
                 transform: 'scale(0.9)', // Fixed scale for clean display
                 transformOrigin: 'center center'
               }}>
            
            {/* PDF Generation Loading State */}
            {browserPDF.pdfState.isGenerating && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Generating PDF preview...</p>
                  <p className="text-xs text-gray-500 mt-1">Using EXACT same system as Download</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {browserPDF.pdfState.error && (
              <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
                <div className="text-center text-red-600">
                  <p className="text-sm font-medium">PDF Generation Error</p>
                  <p className="text-xs mt-1">{browserPDF.pdfState.error}</p>
                  <button 
                    onClick={() => browserPDF.triggerPDFGeneration(true)}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            
            {/* BREAKTHROUGH: Direct PDF Viewer - ACTUAL PDF Display */}
            <DirectPDFViewer
              pdfUrl={browserPDF.pdfState.pdfUrl}
              className="w-full h-full"
              onLoadSuccess={() => {
                console.log('✅ Direct PDF Viewer: PDF loaded successfully');
                console.log('✅ PDF Preview: Shows EXACT IDENTICAL PDF as Download');
              }}
              onLoadError={(error) => {
                console.error('❌ Direct PDF Viewer: Failed to load PDF:', error);
              }}
            />
          </div>
        </div>

        {/* Status Display */}
        <div className="flex items-center justify-center py-2 text-xs text-gray-500">
          {browserPDF.pdfState.cached && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Cached PDF
            </span>
          )}
          {!browserPDF.pdfState.cached && browserPDF.pdfState.pdfUrl && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Fresh PDF
            </span>
          )}
          {browserPDF.isUserTyping && (
            <span className="flex items-center gap-1 ml-4">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Typing...
            </span>
          )}
          {/* DEBUG: Direct PDF download link for testing */}
          {browserPDF.pdfState.pdfUrl && (
            <a 
              href={browserPDF.pdfState.pdfUrl} 
              download="test-preview.pdf"
              className="ml-4 text-blue-600 hover:text-blue-800 underline"
              target="_blank"
            >
              Test Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Display name for React DevTools
PreviewPanel.displayName = 'PreviewPanel';