import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProblemKeywords from './ProblemKeywords';

describe('ProblemKeywords', () => {
  it('renders ProblemKeywords with correct text', () => {
    render(<ProblemKeywords />);
    
    // Check for the updated content from the design - use exact text match for label
    const labelElement = screen.getByText('BỔ SUNG TỪ KHÓA QUAN TRỌNG');
    const titleElement = screen.getByText(/60% CV bị loại vì thiếu các từ khóa quan trọng mà công việc yêu cầu/i);
    const descriptionElement = screen.getByText(/Mỗi công việc yêu cầu những từ khóa cụ thể. OkBuddy phân tích nhanh/i);

    expect(labelElement).toBeInTheDocument();
    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
  });

  it('renders keyword analysis interface', () => {
    render(<ProblemKeywords />);
    
    // Check for keyword analysis content - use more specific text
    expect(screen.getByText('Yếu - 2/5')).toBeInTheDocument();
    expect(screen.getByText('Yêu cầu công việc')).toBeInTheDocument();
    expect(screen.getByText('Từ khóa còn thiếu')).toBeInTheDocument();
    expect(screen.getByText('Thêm từ khóa còn thiếu ngay')).toBeInTheDocument();
    
    // Check for specific keywords - use getAllByText for keywords that appear multiple times
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getAllByText('TypeScript')).toHaveLength(2); // Appears in both sections
    expect(screen.getAllByText('AWS')).toHaveLength(2); // Appears in both sections
    expect(screen.getAllByText('Docker')).toHaveLength(2); // Appears in both sections
  });
}); 