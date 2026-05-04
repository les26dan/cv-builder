import React from 'react'

/**
 * Design tokens for CV templates.
 *
 * Single source of truth for typography, spacing, and bullet styling so all
 * templates feel like the same product. Each template is still free to do its
 * own layout (sidebar, timeline, etc.) — they just consume these tokens for
 * the values that should be uniform across the family.
 *
 * Conventions:
 * - Numbers without units = pixels (consumed as React.CSSProperties values).
 * - Sizes are tuned for an A4 canvas at 794×1123 px (96dpi).
 */

// ── Typography ──────────────────────────────────────────────────────────────
export const cvType = {
  /** Person's full name in the header. Templates may override fontSize for hero variants. */
  name: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
    wordBreak: 'break-word' as const,
  },
  /** Tagline / job title under the name. */
  tagline: {
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.02em',
    lineHeight: 1.35,
  },
  /** Contact line (email · phone · location). */
  contact: {
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.5,
  },
  /** Section header (EXPERIENCE, EDUCATION, …). Uppercase. */
  sectionHeader: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    lineHeight: 1.3,
    textTransform: 'uppercase' as const,
  },
  /** Job/role title within an experience or education item. */
  itemTitle: {
    fontSize: 12.5,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  /** Company / institution name. */
  itemSubtitle: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.35,
  },
  /** Date ranges. Tabular numerals so digits align across rows. */
  date: {
    fontSize: 11,
    fontWeight: 400,
    fontVariantNumeric: 'tabular-nums' as const,
    whiteSpace: 'nowrap' as const,
    lineHeight: 1.4,
  },
  /** Body paragraph (summary, descriptions). */
  body: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.55,
  },
  /** Individual bullet text. */
  bullet: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.55,
  },
} as const

// ── Spacing scale ───────────────────────────────────────────────────────────
export const cvSpace = {
  /** marginBottom between top-level sections. */
  sectionGap: 18,
  /** Gap from a section header down to the first item under it. */
  headerGap: 10,
  /** marginBottom between items within a section (e.g. between job entries). */
  itemGap: 12,
  /** marginBottom between bullets within a single item. */
  bulletGap: 4,
  /** Inline gap inside an item header row (title ↔ date). */
  rowGap: 12,
} as const

// ── Bullet style fragment ───────────────────────────────────────────────────
/**
 * Hanging-indent bullet style. Apply this `li` style to every bullet `<li>` so
 * wrapped lines align under the first character of text, not the page margin.
 *
 * The marker is rendered separately as an absolutely-positioned `<span>` so
 * the indent math is exact regardless of glyph width.
 */
export const cvBullet = {
  /** Style for the `<ul>`. */
  ul: {
    listStyle: 'none' as const,
    margin: 0,
    padding: 0,
  },
  /** Style for each `<li>`. */
  li: {
    position: 'relative' as const,
    paddingLeft: 16,
    marginBottom: cvSpace.bulletGap,
    ...cvType.bullet,
  },
  /** Style for the marker span placed inside each `<li>` at position absolute. */
  marker: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    fontWeight: 700,
    lineHeight: cvType.bullet.lineHeight,
  },
  /** Default marker glyph. Templates may override with '•' or a Lucide icon. */
  defaultGlyph: '›',
} as const

// ── Section header style fragments ──────────────────────────────────────────
/**
 * Pre-composed style fragments for a section header. Keeps spacing under the
 * header consistent across templates.
 */
export const cvHeader = {
  /** Style for the wrapper that contains the header text + any divider. */
  wrapper: {
    marginBottom: cvSpace.headerGap,
  },
  /** Style for the header text itself. */
  text: {
    ...cvType.sectionHeader,
    margin: 0,
  },
} as const

// ── Page / canvas constants ─────────────────────────────────────────────────
export const cvPage = {
  /** A4 width at 96dpi. */
  widthPx: 794,
  /** A4 height at 96dpi. */
  heightPx: 1123,
} as const

// ── className hooks for print page-break rules ──────────────────────────────
/**
 * Stable class names that the print stylesheet hooks into. Apply these to the
 * outermost wrapper of each item so `page-break-inside: avoid` can keep an
 * entry from splitting across pages.
 */
export const cvClass = {
  experienceItem: 'cv-experience-item',
  educationItem: 'cv-education-item',
  projectItem: 'cv-project-item',
  section: 'cv-section',
} as const

/**
 * Helper: merge a typography token with a color so callers can write
 *   style={typeWithColor(cvType.itemTitle, theme.text)}
 * instead of spreading by hand.
 */
export function typeWithColor(
  token: React.CSSProperties,
  color: string,
  extra: React.CSSProperties = {}
): React.CSSProperties {
  return { ...token, color, ...extra }
}
