import React from 'react'
import type { ColorTheme } from './colorThemes'
import {
  CLASSIC_DEFAULT_THEME, CLASSIC_NAVY_THEME, CLASSIC_FOREST_THEME, CLASSIC_ROSE_THEME,
  SLATE_THEME, NAVY_THEME, FOREST_THEME, ROSE_THEME,
  TIMELINE_BLUE_THEME, TIMELINE_TEAL_THEME, TIMELINE_VIOLET_THEME, TIMELINE_SLATE_THEME,
  EXECUTIVE_MIDNIGHT_THEME, EXECUTIVE_CHARCOAL_THEME, EXECUTIVE_WINE_THEME, EXECUTIVE_FOREST_THEME,
} from './colorThemes'
import { DennisSchroderTemplate } from './DennisSchroderTemplate'
import { SidebarTemplate } from './SidebarTemplate'
import { MinimalTemplate } from './MinimalTemplate'
import { TimelineTemplate } from './TimelineTemplate'
import { ExecutiveTemplate } from './ExecutiveTemplate'

export type { ColorTheme }

/**
 * Shared props contract — ALL templates must accept exactly this interface.
 * colorTheme is optional so DennisSchroderTemplate needs no modification.
 */
export interface CVTemplateProps {
  cvData: any
  activeSection?: string | null
  onSectionClick: (sectionId: string) => void
  currentPage?: number
  totalPages?: number
  isPreview?: boolean
  language?: string
  colorTheme?: ColorTheme
}

export interface TemplateDefinition {
  id: string
  label: string
  labelVi: string
  component: React.ComponentType<CVTemplateProps>
  themes: ColorTheme[]
  defaultThemeId: string
}

export const templateRegistry: Record<string, TemplateDefinition> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    labelVi: 'Cổ điển',
    component: DennisSchroderTemplate as React.ComponentType<CVTemplateProps>,
    themes: [CLASSIC_DEFAULT_THEME, CLASSIC_NAVY_THEME, CLASSIC_FOREST_THEME, CLASSIC_ROSE_THEME],
    defaultThemeId: 'default',
  },
  sidebar: {
    id: 'sidebar',
    label: 'Sidebar',
    labelVi: 'Hai cột',
    component: SidebarTemplate,
    themes: [SLATE_THEME, NAVY_THEME, FOREST_THEME, ROSE_THEME],
    defaultThemeId: 'slate',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    labelVi: 'Tối giản',
    component: MinimalTemplate,
    themes: [SLATE_THEME, NAVY_THEME, FOREST_THEME, ROSE_THEME],
    defaultThemeId: 'slate',
  },
  timeline: {
    id: 'timeline',
    label: 'Timeline',
    labelVi: 'Timeline',
    component: TimelineTemplate,
    themes: [TIMELINE_BLUE_THEME, TIMELINE_TEAL_THEME, TIMELINE_VIOLET_THEME, TIMELINE_SLATE_THEME],
    defaultThemeId: 'blue',
  },
  executive: {
    id: 'executive',
    label: 'Executive',
    labelVi: 'Chuyên nghiệp',
    component: ExecutiveTemplate,
    themes: [EXECUTIVE_MIDNIGHT_THEME, EXECUTIVE_CHARCOAL_THEME, EXECUTIVE_WINE_THEME, EXECUTIVE_FOREST_THEME],
    defaultThemeId: 'midnight',
  },
}

export const DEFAULT_TEMPLATE_ID = 'classic'
export const DEFAULT_THEME_ID = 'default'

/**
 * Parse the compound "templateId:themeId" string stored in settings.template.
 * Handles legacy "default" value and missing fields gracefully.
 */
export function parseTemplateSetting(setting: string | undefined): { templateId: string; themeId: string } {
  if (!setting || setting === 'default' || setting === '') {
    return { templateId: DEFAULT_TEMPLATE_ID, themeId: DEFAULT_THEME_ID }
  }
  const [templateId, themeId = DEFAULT_THEME_ID] = setting.split(':')
  const resolvedTemplateId = templateRegistry[templateId] ? templateId : DEFAULT_TEMPLATE_ID
  return { templateId: resolvedTemplateId, themeId }
}

/**
 * Serialize template + theme selection to a compound string for storage.
 */
export function buildTemplateSetting(templateId: string, themeId: string): string {
  return `${templateId}:${themeId}`
}

