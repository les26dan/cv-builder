import React from 'react'

export interface ColorTheme {
  id: string
  label: string
  primary: string   // headings, borders, accents
  accent: string    // sidebar bg, tag backgrounds, light highlights
  text: string      // main body text
  muted: string     // dates, contact info, secondary text
}

// Shared palettes used across templates
export const SLATE_THEME: ColorTheme = {
  id: 'slate',
  label: 'Slate',
  primary: '#334155',
  accent: '#f1f5f9',
  text: '#0f172a',
  muted: '#475569',
}

export const NAVY_THEME: ColorTheme = {
  id: 'navy',
  label: 'Navy',
  primary: '#1e3a8a',
  accent: '#dbeafe',
  text: '#1e293b',
  muted: '#475569',
}

export const FOREST_THEME: ColorTheme = {
  id: 'forest',
  label: 'Forest',
  primary: '#166534',
  accent: '#dcfce7',
  text: '#14532d',
  muted: '#4b5563',
}

export const ROSE_THEME: ColorTheme = {
  id: 'rose',
  label: 'Rose',
  primary: '#9f1239',
  accent: '#ffe4e6',
  text: '#1f2937',
  muted: '#4b5563',
}

// Default classic theme (matches DennisSchroderTemplate hardcoded colors)
export const CLASSIC_DEFAULT_THEME: ColorTheme = {
  id: 'default',
  label: 'Default',
  primary: '#111827',
  accent: '#d1d5db',
  text: '#111827',
  muted: '#4b5563',
}

export const CLASSIC_NAVY_THEME: ColorTheme = {
  id: 'navy',
  label: 'Navy',
  primary: '#1e3a8a',
  accent: '#bfdbfe',
  text: '#111827',
  muted: '#4b5563',
}

export const CLASSIC_FOREST_THEME: ColorTheme = {
  id: 'forest',
  label: 'Forest',
  primary: '#166534',
  accent: '#bbf7d0',
  text: '#111827',
  muted: '#4b5563',
}

export const CLASSIC_ROSE_THEME: ColorTheme = {
  id: 'rose',
  label: 'Rose',
  primary: '#9f1239',
  accent: '#fecdd3',
  text: '#111827',
  muted: '#4b5563',
}

// ── Timeline themes ──────────────────────────────────────────────────────────
export const TIMELINE_BLUE_THEME: ColorTheme = {
  id: 'blue',
  label: 'Blue',
  primary: '#1e3a8a',
  accent: '#dbeafe',
  text: '#1e293b',
  muted: '#475569',
}

export const TIMELINE_TEAL_THEME: ColorTheme = {
  id: 'teal',
  label: 'Teal',
  primary: '#0f766e',
  accent: '#ccfbf1',
  text: '#134e4a',
  muted: '#4b5563',
}

export const TIMELINE_VIOLET_THEME: ColorTheme = {
  id: 'violet',
  label: 'Violet',
  primary: '#5b21b6',
  accent: '#ede9fe',
  text: '#1e1b4b',
  muted: '#4b5563',
}

export const TIMELINE_SLATE_THEME: ColorTheme = {
  id: 'slate',
  label: 'Slate',
  primary: '#334155',
  accent: '#f1f5f9',
  text: '#0f172a',
  muted: '#475569',
}

// ── Executive themes ─────────────────────────────────────────────────────────
export const EXECUTIVE_MIDNIGHT_THEME: ColorTheme = {
  id: 'midnight',
  label: 'Midnight',
  primary: '#0f2942',
  accent: '#e8eef7',
  text: '#1a202c',
  muted: '#475569',
}

export const EXECUTIVE_CHARCOAL_THEME: ColorTheme = {
  id: 'charcoal',
  label: 'Charcoal',
  primary: '#1c1c2e',
  accent: '#f0f0f5',
  text: '#1a1a2e',
  muted: '#4b5563',
}

export const EXECUTIVE_WINE_THEME: ColorTheme = {
  id: 'wine',
  label: 'Wine',
  primary: '#6b1c3f',
  accent: '#fce7ef',
  text: '#1f1020',
  muted: '#4b5563',
}

export const EXECUTIVE_FOREST_THEME: ColorTheme = {
  id: 'forest',
  label: 'Forest',
  primary: '#14532d',
  accent: '#f0fdf4',
  text: '#052e16',
  muted: '#4b5563',
}

/**
 * Converts a ColorTheme into CSS custom property overrides.
 * Apply to the root element of each template via the `style` prop.
 */
export function injectThemeVars(theme: ColorTheme): React.CSSProperties {
  return {
    '--cv-primary': theme.primary,
    '--cv-accent': theme.accent,
    '--cv-text': theme.text,
    '--cv-muted': theme.muted,
  } as React.CSSProperties
}
