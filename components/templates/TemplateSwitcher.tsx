'use client'

import React from 'react'
import { templateRegistry } from './templateRegistry'

interface TemplateSwitcherProps {
  templateId: string
  themeId: string
  onTemplateChange: (templateId: string) => void
  onThemeChange: (themeId: string) => void
  language?: string
}

export const TemplateSwitcher: React.FC<TemplateSwitcherProps> = ({
  templateId,
  themeId,
  onTemplateChange,
  onThemeChange,
  language,
}) => {
  const isVi = language === 'vi'
  const currentDef = templateRegistry[templateId]
  const themes = currentDef?.themes || []

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Template selector */}
      <select
        value={templateId}
        onChange={e => onTemplateChange(e.target.value)}
        style={{
          fontSize: '12px',
          padding: '3px 6px',
          border: '1px solid #d1d5db',
          borderRadius: '5px',
          backgroundColor: 'white',
          color: '#374151',
          cursor: 'pointer',
          outline: 'none',
          maxWidth: '110px',
        }}
        title={isVi ? 'Chọn mẫu CV' : 'Select template'}
      >
        {Object.values(templateRegistry).map(def => (
          <option key={def.id} value={def.id}>
            {isVi ? def.labelVi : def.label}
          </option>
        ))}
      </select>

      {/* Color theme dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {themes.map(theme => {
          const isActive = theme.id === themeId
          return (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              title={theme.label}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: theme.primary,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                boxShadow: isActive
                  ? `0 0 0 2px white, 0 0 0 4px ${theme.primary}`
                  : '0 0 0 1px rgba(0,0,0,0.15)',
                transition: 'box-shadow 0.15s',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
