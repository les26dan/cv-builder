/**
 * Inline markdown renderer for free-text item notes (projects, certifications,
 * volunteer descriptions, etc.).
 *
 * Why a thin wrapper? `react-markdown` ships with default block-level styling
 * (large margins on `<p>`, `<ul>`) that breaks the dense CV layout. This
 * component overrides those defaults to inherit the surrounding type scale
 * and tight spacing, so a markdown bullet list reads identically to a
 * hand-built one.
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  /** Raw markdown source. Empty/whitespace-only input renders nothing. */
  source?: string;
  /** Text color (defaults to inherit). */
  color?: string;
}

export const MarkdownNotes: React.FC<Props> = ({ source, color }) => {
  if (!source || !source.trim()) return null;
  const baseStyle: React.CSSProperties = {
    color: color || 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
  };
  return (
    <div style={{ ...baseStyle, marginTop: 4 }}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p style={{ margin: '0 0 4px' }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: '2px 0 4px', paddingLeft: 18 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: '2px 0 4px', paddingLeft: 18 }}>{children}</ol>,
          li: ({ children }) => <li style={{ margin: 0 }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          code: ({ children }) => (
            <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.92em', background: 'rgba(0,0,0,0.04)', padding: '0 3px', borderRadius: 3 }}>
              {children}
            </code>
          ),
          a: ({ children, href }) => (
            <a href={href} style={{ color: '#0277BD', textDecoration: 'underline' }} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          h1: ({ children }) => <div style={{ fontWeight: 600, margin: '4px 0 2px' }}>{children}</div>,
          h2: ({ children }) => <div style={{ fontWeight: 600, margin: '4px 0 2px' }}>{children}</div>,
          h3: ({ children }) => <div style={{ fontWeight: 600, margin: '4px 0 2px' }}>{children}</div>,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
};
