/**
 * Keyword Highlighter Component
 * Displays suggestion text with bold keyword highlighting
 * Following OkBuddy development tenets - accessible, professional UI
 * Feature 4: Bold keyword display implementation
 */

import React from 'react';

interface KeywordHighlighterProps {
  text: string;
  addedKeywords: string[];
  className?: string;
  highlightColor?: 'green' | 'blue' | 'orange';
}

export const KeywordHighlighter: React.FC<KeywordHighlighterProps> = ({
  text,
  addedKeywords,
  className = '',
  highlightColor = 'green'
}) => {
  // Defensive programming: ensure text is a string
  const safeText = String(text || '');
  
  // Defensive programming: ensure addedKeywords is an array
  const safeKeywords = Array.isArray(addedKeywords) ? addedKeywords.filter(k => typeof k === 'string' && k.trim()) : [];
  
  if (!safeText || safeKeywords.length === 0) {
    return <span className={className}>{safeText}</span>;
  }

  // Create a regex pattern to match all keywords (case insensitive)
  const keywordPattern = safeKeywords
    .map(keyword => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special chars
    .join('|');
  
  const regex = new RegExp(`(${keywordPattern})`, 'gi');
  
  // Split text by keywords while preserving the keywords
  const parts = safeText.split(regex);

  const highlightClasses = {
    green: 'font-bold text-gray-900',
    blue: 'font-bold text-gray-900', 
    orange: 'font-bold text-gray-900'
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isKeyword = safeKeywords.some(keyword =>
          keyword.toLowerCase() === part.toLowerCase()
        );

        if (isKeyword) {
          return (
            <span
              key={index}
              className={highlightClasses[highlightColor]}
              title={`Từ khóa mới được thêm: ${part}`}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}; 