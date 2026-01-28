import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { DennisSchroderTemplate } from './templates/DennisSchroderTemplate';
import { ChevronDownIcon, EyeIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { downloadCV } from '../utils/downloadUtils';
import { getTexts } from '../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../config/languageConfig';

interface PreviewPanelProps {
  cvData: any;
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
  language?: SupportedLanguage;
}

// PreviewPanel component - removed memo to ensure proper re-rendering on cvData changes
export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  cvData,
  activeSection,
  setActiveSection,
  language
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
    calculateTotalPages();
  }, [calculateTotalPages]);

  // Memoized download handler for performance
  const handleDownload = useCallback(async (format: 'pdf' | 'docx') => {
    console.log('💾 Download requested for format:', format);
    
    try {
      setDownloadLoading(format);
      
      await downloadCV(cvData, format);
      const success = true;
      
      if (success) {
        console.log('✅ CV downloaded successfully as', format.toUpperCase());
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

  return (
    <div className="h-full flex flex-col">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <h2 className="text-lg font-medium">{previewTexts?.title || 'CV Preview'}</h2>
        
        <div className="flex items-center gap-4">
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
        {/* CV Preview Container - Zoom-Resistant Scaling */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div 
            ref={cvPreviewRef}
            className="bg-white shadow-lg border border-gray-300 overflow-hidden"
            style={{
              // Fixed A4 dimensions - never changes regardless of zoom
              width: '794px', // 210mm at 96 DPI
              height: '1123px', // 297mm at 96 DPI
              transform: 'scale(var(--preview-scale, 1))',
              transformOrigin: 'center center',
              // Ensure content fits exactly like PDF
              fontSize: '12px',
              lineHeight: '1.4',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            <DennisSchroderTemplate
              cvData={cvData}
              activeSection={activeSection}
              onSectionClick={setActiveSection}
              currentPage={currentPage}
              totalPages={totalPages}  // Use calculated pagination for true WYSIWYG preview
              isPreview={true}
              language={currentLanguage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Display name for React DevTools
PreviewPanel.displayName = 'PreviewPanel';