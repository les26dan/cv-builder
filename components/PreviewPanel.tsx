import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { ChevronDownIcon, EyeIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { downloadCV } from '../utils/downloadUtils';
import { getTexts } from '../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../config/languageConfig';

// PDF Preview Integration - COMPLETE REPLACEMENT OF HTML/CSS RENDERING
import { PDFPreviewDebounceReturn } from '../hooks/usePDFPreviewDebounce';

interface PreviewPanelProps {
  cvData: any;
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
  language?: SupportedLanguage;
  autoSaveStatus?: 'saving' | 'saved' | 'error' | 'offline' | 'guest';
  pdfPreview?: PDFPreviewDebounceReturn; // REQUIRED: PDF preview replaces HTML/CSS
}

// PreviewPanel component - removed memo to ensure proper re-rendering on cvData changes
export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  cvData,
  activeSection,
  setActiveSection,
  language,
  autoSaveStatus = 'saved',
  pdfPreview // REQUIRED: PDF preview replaces HTML/CSS rendering
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const cvPreviewRef = useRef<HTMLDivElement>(null);
  
  // Language and text configuration
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [previewTexts, setPreviewTexts] = useState<any>(null);
  
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
  
  // Calculate optimal scale to fit A4 in container while maintaining exact aspect ratio
  const calculateOptimalScale = useCallback(() => {
    if (!previewContainerRef.current) return 1;
    
    const container = previewContainerRef.current;
    const containerWidth = container.clientWidth - 24; // Account for padding
    const containerHeight = container.clientHeight - 24;
    
    // A4 dimensions in pixels at 96 DPI (standard web DPI)
    const A4_WIDTH_PX = 794; // 210mm at 96 DPI
    const A4_HEIGHT_PX = 1123; // 297mm at 96 DPI
    
    // Calculate scale to fit both width and height, maintaining aspect ratio
    const widthScale = containerWidth / A4_WIDTH_PX;
    const heightScale = containerHeight / A4_HEIGHT_PX;
    
    // Use the smaller scale to ensure the entire page fits
    const optimalScale = Math.min(widthScale, heightScale, 1); // Never scale above 100%
    
    return Math.max(0.3, optimalScale); // Minimum 30% scale for readability
  }, []);

  // Update scale on container resize
  useEffect(() => {
    const updateScale = () => {
      if (cvPreviewRef.current) {
        const scale = calculateOptimalScale();
        cvPreviewRef.current.style.setProperty('--preview-scale', scale.toString());
      }
    };

    // Initial scale calculation
    updateScale();

    // Handle window resize
    const handleResize = () => {
      updateScale();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateOptimalScale]);

  // Calculate total pages based on actual content height
  const calculateTotalPages = useCallback(() => {
    // A4 page content height after margins (297mm - 2*19mm margins = 259mm ≈ 980px at 96 DPI)
    const pageContentHeight = 980;
    
    // Estimate content heights more accurately
    let totalContentHeight = 0;
    
    // Contact section (fixed height)
    if (cvData.contact?.fullName) totalContentHeight += 100;
    
    // Summary section (based on text length and line wrapping)
    if (cvData.summary?.content) {
      const summaryText = cvData.summary.content;
      const charactersPerLine = 85; // Approximate for 14px font at A4 width
      const linesNeeded = Math.ceil(summaryText.length / charactersPerLine);
      totalContentHeight += Math.max(60, linesNeeded * 21 + 40); // 21px line height + margins
    }
    
    // Experience section
    if (cvData.experience?.items?.length) {
      totalContentHeight += 60; // Section header
      cvData.experience.items.forEach((exp: any) => {
        totalContentHeight += 70; // Job header and dates
        if (exp.bullets?.length) {
          exp.bullets.forEach((bullet: string) => {
            if (bullet.trim()) {
              const bulletLines = Math.ceil(bullet.length / 90); // Characters per bullet line
              totalContentHeight += bulletLines * 18; // 18px per bullet line
            }
          });
        }
        totalContentHeight += 15; // Gap between jobs
      });
    }
    
    // Skills section
    if (cvData.skills?.items?.length) {
      const skillsText = cvData.skills.items.join(' | ');
      const skillLines = Math.ceil(skillsText.length / 85);
      totalContentHeight += 60 + (skillLines * 20);
    }
    
    // Education section
    if (cvData.education?.items?.length) {
      totalContentHeight += 60; // Section header
      cvData.education.items.forEach((edu: any) => {
        totalContentHeight += 50; // Each education entry
        if (edu.description) {
          const descLines = Math.ceil(edu.description.length / 85);
          totalContentHeight += descLines * 18;
        }
      });
    }
    
    // Calculate pages
    const pages = Math.max(1, Math.ceil(totalContentHeight / pageContentHeight));
    setTotalPages(pages);
    return pages;
  }, [cvData]);

  // Recalculate pages when CV data changes
  useEffect(() => {
    const newTotalPages = calculateTotalPages();
    setTotalPages(newTotalPages);
  }, [calculateTotalPages]);

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

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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

          {/* Pagination Controls - Subtle */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button 
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon size={16} />
              </button>
              
              <span className="text-xs font-medium min-w-[30px] text-center">
                {currentPage}/{totalPages}
              </span>
              
              <button 
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon size={16} />
              </button>
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

      {/* Preview Content - Fixed Scale WYSIWYG */}
      <div 
        ref={previewContainerRef}
        className="flex-1 bg-[#f3f4f6] p-3 flex flex-col items-center justify-center overflow-hidden" 
        onClick={handlePreviewClick}
      >
        {/* DEBUG: PDF Preview State - Temporary for troubleshooting */}
        {pdfPreview && (
          <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded z-50">
            PDF: {pdfPreview.pdfState.pdfUrl ? 'Ready' : 'None'} | 
            Gen: {pdfPreview.pdfState.isGenerating ? 'Yes' : 'No'} | 
            Typing: {pdfPreview.isUserTyping ? 'Yes' : 'No'} |
            Error: {pdfPreview.pdfState.error ? 'Yes' : 'No'}
          </div>
        )}
        {/* PDF PREVIEW SYSTEM - Clean Display Like Resume.io */}
        <div className="relative w-full h-full flex items-center justify-center bg-white">
          <div className="w-full h-full overflow-hidden relative"
               style={{
                 maxWidth: '794px', // A4 width
                 maxHeight: '1123px', // A4 height
                 transform: 'scale(var(--preview-scale, 1))',
                 transformOrigin: 'center center'
               }}>
            
            {/* PDF Loading State */}
            {pdfPreview?.pdfState.isGenerating && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Generating PDF preview...</p>
                </div>
              </div>
            )}

            {/* PDF Error State */}
            {pdfPreview?.pdfState.error && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-center p-4">
                  <p className="text-sm text-red-600 mb-2">PDF Preview Error</p>
                  <p className="text-xs text-gray-500">{pdfPreview.pdfState.error}</p>
                  <button 
                    onClick={() => pdfPreview.triggerPDFGeneration(true)}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* PDF Content Display - EXTENSIVE DEBUG VERSION */}
            {(() => {
              console.log('🔍 PreviewPanel: Rendering decision point');
              console.log('🔍 PreviewPanel: pdfPreview exists:', !!pdfPreview);
              console.log('🔍 PreviewPanel: pdfState:', pdfPreview?.pdfState);
              console.log('🔍 PreviewPanel: pdfUrl exists:', !!pdfPreview?.pdfState?.pdfUrl);
              console.log('🔍 PreviewPanel: pdfUrl value:', pdfPreview?.pdfState?.pdfUrl);
              console.log('🔍 PreviewPanel: pdfUrl length:', pdfPreview?.pdfState?.pdfUrl?.length);
              console.log('🔍 PreviewPanel: isGenerating:', pdfPreview?.pdfState?.isGenerating);
              console.log('🔍 PreviewPanel: error:', pdfPreview?.pdfState?.error);
              
              return pdfPreview?.pdfState.pdfUrl ? (
                /* Show PDF when available - EXTENSIVE DEBUG */
                <div className="w-full h-full relative">
                  {/* Debug Info Overlay */}
                  <div className="absolute top-2 left-2 bg-black text-white p-2 text-xs z-50 rounded max-w-xs">
                    <div>🔍 DEBUG INFO:</div>
                    <div>PDF URL: {pdfPreview.pdfState.pdfUrl.substring(0, 40)}...</div>
                    <div>Length: {pdfPreview.pdfState.pdfUrl.length}</div>
                    <div>Generated: {pdfPreview.pdfState.lastGenerated ? new Date(pdfPreview.pdfState.lastGenerated).toLocaleTimeString() : 'Never'}</div>
                    <div>Cached: {pdfPreview.pdfState.cached ? 'Yes' : 'No'}</div>
                    <div>Generating: {pdfPreview.pdfState.isGenerating ? 'Yes' : 'No'}</div>
                  </div>
                  
                  {/* Iframe with visible borders for debugging */}
                  <iframe
                    key={pdfPreview.pdfState.pdfUrl}
                    src={`${pdfPreview.pdfState.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0`}
                    className="w-full h-full border-4 border-red-500"
                    title="CV Preview"
                    style={{
                      minHeight: '600px',
                      background: 'lightblue',
                      border: '4px solid red'
                    }}
                    onLoad={(e) => {
                      const iframe = e.target as HTMLIFrameElement;
                      console.log('✅ PDF iframe LOADED successfully');
                      console.log('✅ Iframe element:', iframe);
                      console.log('✅ Iframe src:', iframe.src);
                      console.log('✅ Iframe dimensions:', {
                        width: iframe.offsetWidth,
                        height: iframe.offsetHeight,
                        clientWidth: iframe.clientWidth,
                        clientHeight: iframe.clientHeight
                      });
                      
                      // Try to access iframe content
                      try {
                        console.log('✅ Iframe contentDocument:', iframe.contentDocument);
                        console.log('✅ Iframe contentWindow:', iframe.contentWindow);
                      } catch (err) {
                        console.log('⚠️ Cannot access iframe content (CORS):', (err as Error).message);
                      }
                    }}
                    onError={(e) => {
                      const iframe = e.target as HTMLIFrameElement;
                      console.error('❌ PDF iframe FAILED to load');
                      console.error('❌ Error event:', e);
                      console.error('❌ Iframe src:', iframe?.src);
                      console.error('❌ Error type:', e.type);
                    }}
                  />
                </div>
              ) : (
              /* Show placeholder while PDF is being generated */
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Preparing PDF preview...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                  </div>
                </div>
              </div>
            );
            })()}

            {/* PDF Cache Indicator */}
            {pdfPreview?.pdfState.cached && (
              <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Cached
              </div>
            )}
          </div>
        </div>

        {/* Pagination Controls - Always Visible for Multi-page CVs */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Page</span>
              <span className="font-medium text-gray-900">{currentPage}</span>
              <span className="text-sm text-gray-600">of {totalPages}</span>
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Display name for React DevTools
PreviewPanel.displayName = 'PreviewPanel';