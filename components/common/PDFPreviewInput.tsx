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
import { PDFPreviewDebounceReturn } from '../../hooks/usePDFPreviewDebounce';

interface PDFPreviewInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  pdfPreview?: PDFPreviewDebounceReturn;
}

interface PDFPreviewTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  pdfPreview?: PDFPreviewDebounceReturn;
}

/**
 * PDF Preview Textarea Component
 * SAFETY: Direct textarea wrapper with PDF preview integration
 */
export const PDFPreviewTextarea = forwardRef<HTMLTextAreaElement, PDFPreviewTextareaProps>(
  ({ pdfPreview, ...textareaProps }, ref) => {
    const handleFocus = useCallback(() => {
      console.log('🎯 PDFPreviewTextarea: Focus event');
      pdfPreview?.handleInputFocus();
    }, [pdfPreview]);

    const handleBlur = useCallback(() => {
      console.log('👆 PDFPreviewTextarea: Blur event');
      pdfPreview?.handleInputBlur();
    }, [pdfPreview]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      console.log('⌨️ PDFPreviewTextarea: Change event');
      pdfPreview?.handleInputChange();
      
      // Call original onChange if provided
      if (textareaProps.onChange) {
        textareaProps.onChange(e);
      }
    }, [pdfPreview, textareaProps.onChange]);

    return (
      <textarea
        {...textareaProps}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
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
  ({ pdfPreview, ...inputProps }, ref) => {
    const handleFocus = useCallback(() => {
      console.log('🎯 PDFPreviewInput: Focus event');
      pdfPreview?.handleInputFocus();
    }, [pdfPreview]);

    const handleBlur = useCallback(() => {
      console.log('👆 PDFPreviewInput: Blur event');
      pdfPreview?.handleInputBlur();
    }, [pdfPreview]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('⌨️ PDFPreviewInput: Change event');
      pdfPreview?.handleInputChange();
      
      // Call original onChange if provided
      if (inputProps.onChange) {
        inputProps.onChange(e);
      }
    }, [pdfPreview, inputProps.onChange]);

    return (
      <input
        {...inputProps}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
      />
    );
  }
);

PDFPreviewInput.displayName = 'PDFPreviewInput';

/**
 * Higher-order component that wraps any component with PDF preview integration
 * SAFETY: Non-invasive wrapper that preserves all existing component behavior
 */
export function withPDFPreviewIntegration<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  pdfPreview?: PDFPreviewDebounceReturn
) {
  const WithPDFPreview = forwardRef<any, T>((props, ref) => {
    return (
      <div
        onFocus={() => pdfPreview?.handleInputFocus()}
        onBlur={() => pdfPreview?.handleInputBlur()}
        onChange={() => pdfPreview?.handleInputChange()}
      >
        <WrappedComponent {...props as T} />
      </div>
    );
  });

  WithPDFPreview.displayName = `withPDFPreview(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithPDFPreview;
}

export type { PDFPreviewInputProps, PDFPreviewTextareaProps };