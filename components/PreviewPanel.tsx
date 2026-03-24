import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { DennisSchroderTemplate } from './templates/DennisSchroderTemplate';
import { ChevronDownIcon, EyeIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { downloadCV } from '../utils/downloadUtils';
import { getTexts } from '../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../config/languageConfig';
import { pdfGenerationService } from '../services/pdfGenerationService';

// 🔧 SKILLS NORMALIZATION UTILITY - Handle mixed skill data structures in PreviewPanel
const normalizeSkillsForCalculation = (skills: any[]): string[] => {
  if (!Array.isArray(skills)) return [];
  
  return skills.map((skill: any) => {
    if (typeof skill === 'object' && skill !== null && skill.name) {
      return skill.name;
    }
    if (typeof skill === 'string') {
      return skill;
    }
    return String(skill);
  }).filter(Boolean);
};

interface PreviewPanelProps {
  cvData: any;
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
  language?: SupportedLanguage;
  autoSaveStatus?: 'saving' | 'saved' | 'error' | 'offline' | 'guest';
}

// PreviewPanel component - removed memo to ensure proper re-rendering on cvData changes
export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  cvData,
  activeSection,
  setActiveSection,
  language,
  autoSaveStatus = 'saved'
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
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
      const normalizedSkills = normalizeSkillsForCalculation(cvData.skills.items);
      const skillsText = normalizedSkills.join(' | ');
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

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, []);

  // Recalculate pages when CV data changes with comprehensive debugging
  useEffect(() => {
    const experienceCount = cvData.experience?.items?.length || 0;
    const newTotalPages = calculateTotalPages();
    
    // COMPREHENSIVE PREVIEW PANEL DEBUG
    if (experienceCount > 0) {
      console.log(`\n📄 ===== PREVIEW PANEL PAGINATION DEBUG =====`);
      console.log(`📄 Experience count: ${experienceCount}`);
      console.log(`📄 Total pages calculated: ${newTotalPages}`);
      
      // Detailed height analysis
      const pageContentHeight = 980;
      let totalContentHeight = 0;
      
      // Contact section analysis
      const contactHeight = cvData.contact?.fullName ? 100 : 0;
      totalContentHeight += contactHeight;
      console.log(`📄 Contact height: ${contactHeight}px`);
      
      // Summary section analysis
      let summaryHeight = 0;
      if (cvData.summary?.content) {
        const summaryText = cvData.summary.content;
        const charactersPerLine = 85;
        const linesNeeded = Math.ceil(summaryText.length / charactersPerLine);
        summaryHeight = Math.max(60, linesNeeded * 21 + 40);
        totalContentHeight += summaryHeight;
      }
      console.log(`📄 Summary height: ${summaryHeight}px (content: ${cvData.summary?.content?.length || 0} chars)`);
      
      // Experience section analysis
      let experienceHeight = 0;
      if (cvData.experience?.items?.length) {
        experienceHeight += 60; // Section header
        cvData.experience.items.forEach((exp: any, idx: number) => {
          const jobHeight = 70; // Job header and dates
          let bulletHeight = 0;
          if (exp.bullets?.length) {
            exp.bullets.forEach((bullet: string) => {
              if (bullet.trim()) {
                const bulletLines = Math.ceil(bullet.length / 90);
                bulletHeight += bulletLines * 18;
              }
            });
          }
          const itemTotal = jobHeight + bulletHeight + 15; // Gap
          experienceHeight += itemTotal;
          
          console.log(`📄 Experience item ${idx + 1}: ${itemTotal}px (job: ${jobHeight}px, bullets: ${bulletHeight}px)`);
        });
        totalContentHeight += experienceHeight;
      }
      console.log(`📄 Total experience height: ${experienceHeight}px`);
      
      // Skills and Education
      let skillsHeight = 0;
      if (cvData.skills?.items?.length) {
        const normalizedSkills = normalizeSkillsForCalculation(cvData.skills.items);
        const skillsText = normalizedSkills.join(' | ');
        const skillLines = Math.ceil(skillsText.length / 85);
        skillsHeight = 60 + (skillLines * 20);
        totalContentHeight += skillsHeight;
      }
      console.log(`📄 Skills height: ${skillsHeight}px`);
      
      let educationHeight = 0;
      if (cvData.education?.items?.length) {
        educationHeight += 60; // Section header
        cvData.education.items.forEach((edu: any) => {
          educationHeight += 50; // Each education entry
          if (edu.description) {
            const descLines = Math.ceil(edu.description.length / 85);
            educationHeight += descLines * 18;
          }
        });
        totalContentHeight += educationHeight;
      }
      console.log(`📄 Education height: ${educationHeight}px`);
      
      console.log(`📄 TOTAL CONTENT HEIGHT: ${totalContentHeight}px`);
      console.log(`📄 PAGE CONTENT HEIGHT: ${pageContentHeight}px`);
      console.log(`📄 CALCULATED PAGES: ${Math.max(1, Math.ceil(totalContentHeight / pageContentHeight))}`);
      console.log(`📄 ===== END PREVIEW PANEL DEBUG =====\n`);
    }
  }, [calculateTotalPages]);

  // Memoized download handler for performance
  const handleDownload = useCallback(async (format: 'pdf' | 'docx' | 'latex') => {
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

  // Handle PDF preview generation
  const handlePDFPreview = useCallback(async () => {
    console.log('🔍 PDF Preview: Starting PDF generation...');
    
    // 🚨 CRITICAL: Validate CV data before PDF generation
    const isDataComplete = (
      cvData.contact?.fullName || 
      cvData.summary?.content || 
      (cvData.experience?.items && cvData.experience.items.length > 0) ||
      (cvData.skills?.items && cvData.skills.items.length > 0) ||
      (cvData.education?.items && cvData.education.items.length > 0)
    );
    
    if (!isDataComplete) {
      console.warn('⚠️ PDF Preview: CV data appears to be incomplete, skipping generation');
      console.log('⚠️ Data validation:', {
        hasContact: !!cvData.contact?.fullName,
        hasSummary: !!cvData.summary?.content,
        hasExperience: !!(cvData.experience?.items && cvData.experience.items.length > 0),
        hasSkills: !!(cvData.skills?.items && cvData.skills.items.length > 0),
        hasEducation: !!(cvData.education?.items && cvData.education.items.length > 0)
      });
      
      // Show user-friendly message
      alert('Please wait for CV data to load completely before generating PDF preview.');
      return;
    }
    
    console.log('✅ PDF Preview: CV data validation passed, proceeding with generation');
    setPdfLoading(true);
    
    try {
      const result = await pdfGenerationService.generatePDF(cvData, {
        useCache: true,
        quality: 'final'
      });
      
      console.log('🚨 PDF Preview: Generation result received:', {
        success: result.success,
        hasUrl: !!result.pdfUrl,
        hasBlobSize: result.pdfBlob?.size || 0,
        error: result.error,
        cached: result.cached
      });

      if (result.success && result.pdfUrl) {
        console.log('✅ PDF Preview: PDF generated successfully');
        console.log('✅ PDF Preview: Setting preview URL:', result.pdfUrl);
        setPdfPreviewUrl(result.pdfUrl);
        setShowPDFPreview(true);
        
        // Test if the PDF URL is actually valid
        fetch(result.pdfUrl)
          .then(response => {
            console.log('✅ PDF Preview: URL validation:', {
              ok: response.ok,
              status: response.status,
              contentType: response.headers.get('content-type'),
              contentLength: response.headers.get('content-length')
            });
          })
          .catch(error => {
            console.error('❌ PDF Preview: URL validation failed:', error);
          });
      } else {
        console.error('❌ PDF Preview: Generation failed:', result.error);
        // Fallback to download if preview fails
        await handleDownload('pdf');
      }
    } catch (error) {
      console.error('❌ PDF Preview: Error during generation:', error);
      // Fallback to download if preview fails
      await handleDownload('pdf');
    } finally {
      setPdfLoading(false);
    }
  }, [cvData]);

  // Handle closing PDF preview
  const handleClosePDFPreview = useCallback(() => {
    console.log('🔍 PDF Preview: Closing PDF preview');
    setShowPDFPreview(false);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
  }, [pdfPreviewUrl]);

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
      console.log(`📄 Navigation: Page ${page}/${totalPages}`);
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

          {/* PDF Preview Button - Sub CTA Style */}
          <button 
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm" 
            onClick={handlePDFPreview}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                <span>{currentLanguage === 'vi' ? 'Đang tạo...' : 'Generating...'}</span>
              </>
            ) : (
              <>
                <EyeIcon size={14} />
                <span>{previewTexts?.actions?.previewPDF || (currentLanguage === 'vi' ? 'Xem CV định dạng PDF' : 'Preview your resume in PDF')}</span>
              </>
            )}
          </button>

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
                  <span>{currentLanguage === 'vi' ? 'Đang tải...' : 'Downloading...'}</span>
                </>
              ) : (
                <>
                  <DownloadIcon size={16} />
                  <span>{previewTexts?.actions?.download || (currentLanguage === 'vi' ? 'Tải về' : 'Download')}</span>
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

      {/* PDF Preview Modal */}
      {showPDFPreview && pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-5/6 mx-4 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {currentLanguage === 'vi' ? 'Xem trước CV định dạng PDF' : 'PDF Preview'}
              </h3>
              <button
                onClick={handleClosePDFPreview}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XIcon size={20} className="text-gray-500" />
              </button>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 p-4">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border border-gray-300 rounded"
                title={currentLanguage === 'vi' ? 'Xem trước CV PDF' : 'CV PDF Preview'}
              />
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={handleClosePDFPreview}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {currentLanguage === 'vi' ? 'Đóng' : 'Close'}
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                className="flex items-center gap-2 px-4 py-2 bg-[#0277BD] text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <DownloadIcon size={16} />
                {currentLanguage === 'vi' ? 'Tải về PDF' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Display name for React DevTools
PreviewPanel.displayName = 'PreviewPanel';