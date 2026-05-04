'use client'

import React from 'react'
import { Loader2, RefreshCw, X, Sparkles } from 'lucide-react'

export interface AIAlternativesPickerProps {
  alternatives: string[]
  onSelect: (text: string) => void
  onRegenerate: () => void
  onCancel: () => void
  isLoading?: boolean
  label?: string
  regenerateLabel?: string
  cancelLabel?: string
  errorMessage?: string | null
}

/**
 * Inline picker hiển thị các phương án AI sinh ra để user chọn 1.
 * Render ngay dưới input/textarea — không portal, không fixed.
 */
export const AIAlternativesPicker: React.FC<AIAlternativesPickerProps> = ({
  alternatives,
  onSelect,
  onRegenerate,
  onCancel,
  isLoading = false,
  label = 'Chọn 1 phương án',
  regenerateLabel = 'Tạo lại',
  cancelLabel = 'Hủy',
  errorMessage = null,
}) => {
  return (
    <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50/40 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-700">
          <Sparkles size={12} />
          {label}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600"
          aria-label={cancelLabel}
        >
          <X size={14} />
        </button>
      </div>

      {errorMessage && (
        <div className="mb-2 rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-md border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {alternatives.map((alt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(alt)}
              className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 transition hover:border-purple-400 hover:bg-purple-50"
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[10px] font-semibold text-purple-700">
                {i + 1}
              </span>
              {alt}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isLoading}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {regenerateLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  )
}

AIAlternativesPicker.displayName = 'AIAlternativesPicker'
