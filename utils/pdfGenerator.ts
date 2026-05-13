/**
 * PDF generator via html2canvas + jsPDF.
 *
 * Why rasterized (not window.print)?
 *   The print dialog respects content flow: even when a wrapper has
 *   `height:1123px; overflow:hidden`, Chrome's print engine paginates
 *   the underlying content. A 1-page preview could spill into 3–4
 *   PDF pages whenever the template's rendered content was slightly
 *   taller than the page box. Rendering each .cv-page to a canvas and
 *   embedding it into jsPDF gives us pixel-perfect WYSIWYG and exactly
 *   `pageCount` pages.
 *
 * Tradeoff: the resulting PDF is image-based (not selectable text).
 * For text-selectable PDFs we'd need a different pipeline (pdf-lib +
 * manual layout, or a server-side puppeteer service).
 */
import type { CVData } from './downloadUtils.types';

const A4_WIDTH_PX = 794;   // 210mm @ 96 DPI
const A4_HEIGHT_PX = 1123; // 297mm @ 96 DPI

/**
 * Mount the rendered template offscreen, capture each page with html2canvas,
 * assemble into a multi-page A4 PDF, and trigger a browser download.
 */
export const generatePdfFromTemplate = async (
  cvData: CVData,
  templateSetting: string | undefined,
  pageCount: number,
  filename: string,
): Promise<void> => {
  const [
    React,
    ReactDOMClient,
    html2canvasMod,
    jsPDFMod,
    { parseTemplateSetting, templateRegistry, DEFAULT_TEMPLATE_ID },
    { injectThemeVars },
  ] = await Promise.all([
    import('react').then(m => m.default),
    import('react-dom/client'),
    import('html2canvas'),
    import('jspdf'),
    import('../components/templates/templateRegistry'),
    import('../components/templates/colorThemes'),
  ]);
  const html2canvas = (html2canvasMod as any).default;
  const jsPDF = (jsPDFMod as any).jsPDF || (jsPDFMod as any).default;

  const { templateId, themeId } = parseTemplateSetting(templateSetting);
  const def = templateRegistry[templateId] ?? templateRegistry[DEFAULT_TEMPLATE_ID];
  const ActiveTemplate = def.component;
  const theme = def.themes.find((t: any) => t.id === themeId) ?? def.themes[0];
  const themeVars = injectThemeVars(theme) as Record<string, string>;

  const total = Math.max(1, pageCount | 0);

  // Offscreen mount point — must be in the DOM (not display:none) so
  // html2canvas can read computed styles and layout.
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${A4_WIDTH_PX}px`,
    background: '#fff',
    pointerEvents: 'none',
  } as CSSStyleDeclaration);
  document.body.appendChild(host);

  const pdf = new jsPDF({ unit: 'px', format: [A4_WIDTH_PX, A4_HEIGHT_PX], orientation: 'portrait' });

  // Wait for webfonts (Inter etc.) so html2canvas captures the same glyph metrics
  // as the on-screen preview. Without this the first page often rasterizes with
  // fallback fonts → different line breaks → different page count vs preview.
  if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
    try { await (document as any).fonts.ready; } catch { /* ignore */ }
  }

  try {
    for (let p = 1; p <= total; p++) {
      // Each page rendered as its own React root with the right currentPage.
      const pageDiv = document.createElement('div');
      Object.assign(pageDiv.style, {
        width: `${A4_WIDTH_PX}px`,
        height: `${A4_HEIGHT_PX}px`,
        background: '#fff',
        overflow: 'hidden',
        fontSize: '12px',
        lineHeight: '1.4',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      } as CSSStyleDeclaration);
      for (const [k, v] of Object.entries(themeVars)) pageDiv.style.setProperty(k, v);

      host.appendChild(pageDiv);

      const root = ReactDOMClient.createRoot(pageDiv);
      root.render(
        React.createElement(ActiveTemplate, {
          cvData,
          activeSection: null,
          onSectionClick: () => {},
          currentPage: p,
          totalPages: total,
          // Match the preview's render flag — the templates branch on this and
          // we want byte-identical output.
          isPreview: true,
          language: undefined,
          colorTheme: theme,
        })
      );
      // Two RAFs then a small settle delay — covers React commit + layout +
      // any async style application. Without this, the first capture can race
      // before children have laid out.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await new Promise<void>((resolve) => setTimeout(resolve, 60));

      const canvas = await html2canvas(pageDiv, {
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        windowWidth: A4_WIDTH_PX,
        windowHeight: A4_HEIGHT_PX,
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      if (p > 1) pdf.addPage([A4_WIDTH_PX, A4_HEIGHT_PX], 'portrait');
      pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);

      root.unmount();
      host.removeChild(pageDiv);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(host);
  }
};
