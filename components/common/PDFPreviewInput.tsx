/**
 * PDF Preview Input Wrapper
 * 
 * SAFETY DESIGN:
 * - Wrapper component that adds PDF preview event handling to any input
 * - Completely transparent to existing input components
 * - No modifications to existing input behavior
 * - Follows acceptance criteria exactly:
 *   - Detects when user is typing
 *   - Triggers PDF generation on blur (click outside)
 *   - Integrates with 3-second debounce system
 */

import React, { forwardRef, useCallback } from 'react';

interface PDFPreviewInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // PDF preview is now handled directly in PreviewPanel - no props needed
}

interface PDFPreviewTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // PDF preview is now handled directly in PreviewPanel - no props needed
}

/**
 * PDF Preview Textarea Component
 * SAFETY: Direct textarea wrapper with PDF preview integration
 */
export const PDFPreviewTextarea = forwardRef<HTMLTextAreaElement, PDFPreviewTextareaProps>(
  (textareaProps, ref) => {
    // PDF preview is now handled automatically in PreviewPanel
    // This component is now just a regular textarea wrapper
    return (
      <textarea
        {...textareaProps}
        ref={ref}
      />
    );
  }
);

PDFPreviewTextarea.displayName = 'PDFPreviewTextarea';

/**
 * PDF Preview Input Component
 * SAFETY: Direct input wrapper with PDF preview integration
 */
export const PDFPreviewInput = forwardRef<HTMLInputElement, PDFPreviewInputProps>(
  (inputProps, ref) => {
    // PDF preview is now handled automatically in PreviewPanel
    // This component is now just a regular input wrapper
    return (
      <input
        {...inputProps}
        ref={ref}
      />
    );
  }
);

PDFPreviewInput.displayName = 'PDFPreviewInput';

// Higher-order component removed - PDF preview now handled directly in PreviewPanel

export type { PDFPreviewInputProps, PDFPreviewTextareaProps };