/**
 * Tests for KeywordHighlighter Component
 * Feature 4: Bold keyword display implementation
 * Following OkBuddy development tenets - comprehensive testing with accessibility validation
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { KeywordHighlighter } from './KeywordHighlighter';

describe('KeywordHighlighter Component', () => {
  it('should render plain text when no keywords are provided', () => {
    const text = 'This is a simple text without any keywords';
    render(<KeywordHighlighter text={text} addedKeywords={[]} />);
    
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('should highlight single keyword correctly', () => {
    const text = 'I have experience with React development';
    const addedKeywords = ['React'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    // Check that React is highlighted
    const highlightedElement = screen.getByText('React');
    expect(highlightedElement).toHaveClass('font-bold', 'text-green-700', 'bg-green-100');
    expect(highlightedElement).toHaveAttribute('title', 'Từ khóa mới được thêm: React');
    
    // Check that other text is not highlighted
    expect(screen.getByText('I have experience with ')).toBeInTheDocument();
    expect(screen.getByText(' development')).toBeInTheDocument();
  });

  it('should highlight multiple keywords correctly', () => {
    const text = 'I have experience with React and Node.js for full-stack development';
    const addedKeywords = ['React', 'Node.js', 'full-stack'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    // Check that all keywords are highlighted
    expect(screen.getByText('React')).toHaveClass('font-bold', 'text-green-700');
    expect(screen.getByText('Node.js')).toHaveClass('font-bold', 'text-green-700');
    expect(screen.getByText('full-stack')).toHaveClass('font-bold', 'text-green-700');
  });

  it('should handle case-insensitive keyword matching', () => {
    const text = 'I have experience with REACT and javascript development';
    const addedKeywords = ['React', 'JavaScript'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    // Check that case-insensitive matches work
    expect(screen.getByText('REACT')).toHaveClass('font-bold', 'text-green-700');
    expect(screen.getByText('javascript')).toHaveClass('font-bold', 'text-green-700');
  });

  it('should handle keywords with special characters', () => {
    const text = 'I work with C++ and .NET technologies';
    const addedKeywords = ['C++', '.NET'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    // Check that special characters are handled correctly
    expect(screen.getByText('C++')).toHaveClass('font-bold', 'text-green-700');
    expect(screen.getByText('.NET')).toHaveClass('font-bold', 'text-green-700');
  });

  it('should apply different highlight colors', () => {
    const text = 'I have experience with React development';
    const addedKeywords = ['React'];
    
    const { rerender } = render(
      <KeywordHighlighter text={text} addedKeywords={addedKeywords} highlightColor="blue" />
    );
    
    expect(screen.getByText('React')).toHaveClass('font-bold', 'text-blue-700', 'bg-blue-100');
    
    rerender(
      <KeywordHighlighter text={text} addedKeywords={addedKeywords} highlightColor="orange" />
    );
    
    expect(screen.getByText('React')).toHaveClass('font-bold', 'text-orange-700', 'bg-orange-100');
  });

  it('should handle overlapping keywords correctly', () => {
    const text = 'JavaScript and Java are different languages';
    const addedKeywords = ['JavaScript', 'Java'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    // Should highlight both correctly without conflicts
    expect(screen.getByText('JavaScript')).toHaveClass('font-bold', 'text-green-700');
    expect(screen.getByText('Java')).toHaveClass('font-bold', 'text-green-700');
  });

  it('should apply custom className', () => {
    const text = 'Simple text';
    const customClass = 'custom-text-class';
    
    render(
      <KeywordHighlighter 
        text={text} 
        addedKeywords={[]} 
        className={customClass}
      />
    );
    
    const container = screen.getByText(text).parentElement;
    expect(container).toHaveClass(customClass);
  });

  it('should handle empty keywords array gracefully', () => {
    const text = 'This text has no highlighted keywords';
    
    render(<KeywordHighlighter text={text} addedKeywords={[]} />);
    
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByText(text)).not.toHaveClass('font-bold');
  });

  it('should handle empty text gracefully', () => {
    const text = '';
    const addedKeywords = ['React'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    // Should render empty content without errors
    const container = screen.getByText('').parentElement;
    expect(container).toBeInTheDocument();
  });

  it('should handle partial keyword matches correctly', () => {
    const text = 'I use React, ReactJS, and React Native for development';
    const addedKeywords = ['React'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    // Should only highlight exact matches
    const reactElements = screen.getAllByText('React');
    expect(reactElements).toHaveLength(2); // Only exact "React" matches, not "ReactJS" or "React Native"
    
    reactElements.forEach(element => {
      expect(element).toHaveClass('font-bold', 'text-green-700');
    });
  });

  it('should handle Vietnamese keywords correctly', () => {
    const text = 'Tôi có kinh nghiệm với lập trình và phát triển ứng dụng';
    const addedKeywords = ['lập trình', 'phát triển'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    expect(screen.getByText('lập trình')).toHaveClass('font-bold', 'text-green-700');
    expect(screen.getByText('phát triển')).toHaveClass('font-bold', 'text-green-700');
  });

  it('should provide proper accessibility attributes', () => {
    const text = 'I have experience with React development';
    const addedKeywords = ['React'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    const highlightedElement = screen.getByText('React');
    expect(highlightedElement).toHaveAttribute('title', 'Từ khóa mới được thêm: React');
  });

  it('should handle multiple occurrences of the same keyword', () => {
    const text = 'React is great. I love React. React makes development easier.';
    const addedKeywords = ['React'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    const reactElements = screen.getAllByText('React');
    expect(reactElements).toHaveLength(3);
    
    reactElements.forEach(element => {
      expect(element).toHaveClass('font-bold', 'text-green-700');
      expect(element).toHaveAttribute('title', 'Từ khóa mới được thêm: React');
    });
  });

  it('should preserve text structure and spacing', () => {
    const text = 'I have    experience    with    React    development';
    const addedKeywords = ['React'];
    
    render(<KeywordHighlighter text={text} addedKeywords={addedKeywords} />);
    
    // Check that spacing is preserved
    expect(screen.getByText('I have    experience    with    ')).toBeInTheDocument();
    expect(screen.getByText('    development')).toBeInTheDocument();
    expect(screen.getByText('React')).toHaveClass('font-bold', 'text-green-700');
  });

  it('should handle long text with many keywords efficiently', () => {
    const longText = `
      I am an experienced full-stack developer with expertise in JavaScript, TypeScript, React, 
      Node.js, Python, Java, Docker, Kubernetes, AWS, MongoDB, PostgreSQL, and many other 
      modern technologies. I have worked with React Native, Angular, Vue.js, Express.js, 
      and various other frameworks and libraries.
    `;
    const manyKeywords = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 
      'Docker', 'Kubernetes', 'AWS', 'MongoDB', 'PostgreSQL'
    ];
    
    render(<KeywordHighlighter text={longText} addedKeywords={manyKeywords} />);
    
    // Check that all keywords are highlighted
    manyKeywords.forEach(keyword => {
      expect(screen.getByText(keyword)).toHaveClass('font-bold', 'text-green-700');
    });
  });
}); 