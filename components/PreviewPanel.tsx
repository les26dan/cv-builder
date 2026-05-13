import React, { useState, useCallback, memo, useEffect, useLayoutEffect, useRef } from 'react';
import { ChevronDownIcon, EyeIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { downloadCV } from '../utils/downloadUtils';
import { getTexts } from '../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../config/languageConfig';
import {
  templateRegistry,
  parseTemplateSetting,
  buildTemplateSetting,
  DEFAULT_TEMPLATE_ID,
  DEFAULT_THEME_ID,
} from './templates/templateRegistry';
import { TemplateSwitcher } from './templates/TemplateSwitcher';

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

  // Template + theme state (initialized from cvData.settings.template)
  const [templateId, setTemplateId] = useState<string>(() => {
    const { templateId } = parseTemplateSetting(cvData?.settings?.template)
    return templateId
  })
  const [themeId, setThemeId] = useState<string>(() => {
    const { themeId } = parseTemplateSetting(cvData?.settings?.template)
    return themeId
  })

  const handleTemplateChange = useCallback((newTemplateId: string) => {
    const def = templateRegistry[newTemplateId]
    if (!def) return
    setTemplateId(newTemplateId)
    setThemeId(def.defaultThemeId)
  }, [])

  const handleThemeChange = useCallback((newThemeId: string) => {
    setThemeId(newThemeId)
  }, [])

  // Persist template+theme choice back into cvData so it saves with the CV
  useEffect(() => {
    if (cvData?.settings) {
      cvData.settings.template = buildTemplateSetting(templateId, themeId)
    }
  }, [templateId, themeId, cvData])
  
  // Language and text configuration
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('vi');
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
        setCurrentLanguage('vi');
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

  // Measure full rendered content height in a hidden off-DOM probe so the visible
  // preview's pagination doesn't feed back into measurement (which would cause flicker
  // between 1↔2 pages). The probe always renders with totalPages=1 → full content,
  // we read its actual scrollHeight, then derive pagination for the visible preview.
  const probeRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const probe = probeRef.current;
      if (!probe) return;
      const content = probe.querySelector('.cv-content') as HTMLElement | null;
      if (!content) return;
      // Template padding 57px top + 57px bottom = 114px; A4 inner height = 1123 - 114 = 1009.
      const PAGE_INNER = 1009;
      // scrollHeight includes padding, so subtract it to compare against PAGE_INNER.
      const innerHeight = content.scrollHeight - 114;
      const TOLERANCE = 24;
      const pages = innerHeight > PAGE_INNER + TOLERANCE
        ? Math.max(1, Math.ceil(innerHeight / PAGE_INNER))
        : 1;
      setTotalPages(prev => (prev === pages ? prev : pages));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [cvData, templateId, themeId]);

  // Clamp currentPage if totalPages shrinks (e.g. user deletes content).
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // Download handler — single vector-print pipeline via downloadCV (PDF + DOCX share path)
  const handleDownload = useCallback(async (format: 'pdf' | 'docx') => {
    try {
      setDownloadLoading(format);
      await downloadCV(cvData, format, buildTemplateSetting(templateId, themeId), totalPages);
    } catch (error) {
      console.error('❌ Download error:', error);
    } finally {
      setDownloadLoading(null);
      setIsDropdownOpen(false);
    }
  }, [cvData, templateId, themeId]);

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
      console.log('\n📝 ===== CV PREVIEW PAGE NAVIGATION =====');
      console.log('📝 PreviewPanel: goToPage called with page:', page);
      console.log('📝 PreviewPanel: currentPage before:', currentPage);
      console.log('📝 PreviewPanel: totalPages:', totalPages);
      console.log('📝 PreviewPanel: Setting currentPage to:', page);
      setCurrentPage(page);
      console.log('📝 ===== END CV PREVIEW PAGE NAVIGATION =====\n');
    } else {
      console.log('🚀 PreviewPanel: goToPage rejected - page', page, 'not in range 1-', totalPages);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <h2 className="text-lg font-medium">{previewTexts?.title || 'CV Preview'}</h2>

        <div className="flex items-center gap-4">
          {/* Template + Theme Switcher */}
          <TemplateSwitcher
            templateId={templateId}
            themeId={themeId}
            onTemplateChange={handleTemplateChange}
            onThemeChange={handleThemeChange}
            language={currentLanguage}
          />

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
            {(() => {
              const def = templateRegistry[templateId] ?? templateRegistry[DEFAULT_TEMPLATE_ID]
              const ActiveTemplate = def.component
              const activeTheme = def.themes.find(t => t.id === themeId) ?? def.themes[0]
              return (
                <ActiveTemplate
                  cvData={cvData}
                  activeSection={activeSection}
                  onSectionClick={setActiveSection}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  isPreview={true}
                  language={currentLanguage}
                  colorTheme={activeTheme}
                />
              )
            })()}
          </div>
        </div>
      </div>

      {/* Hidden probe: renders the template at A4 width with totalPages=1 (full content)
          so we can measure actual scrollHeight without the visible preview's pagination
          interfering. Off-screen, no pointer events, aria-hidden. */}
      <div
        ref={probeRef}
        aria-hidden
        style={{
          position: 'absolute',
          left: '-99999px',
          top: 0,
          width: '794px',
          height: 'auto',
          pointerEvents: 'none',
          visibility: 'hidden',
          fontSize: '12px',
          lineHeight: '1.4',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        {(() => {
          const def = templateRegistry[templateId] ?? templateRegistry[DEFAULT_TEMPLATE_ID]
          const ActiveTemplate = def.component
          const activeTheme = def.themes.find(t => t.id === themeId) ?? def.themes[0]
          return (
            <ActiveTemplate
              cvData={cvData}
              activeSection={null}
              onSectionClick={() => {}}
              currentPage={1}
              totalPages={1}
              isPreview={true}
              language={currentLanguage}
              colorTheme={activeTheme}
            />
          )
        })()}
      </div>
    </div>
  );
};

// Display name for React DevTools
PreviewPanel.displayName = 'PreviewPanel';