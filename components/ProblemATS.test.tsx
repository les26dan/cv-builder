import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProblemATS from './ProblemATS';

describe('ProblemATS', () => {
  it('renders ProblemATS with correct text', () => {
    render(<ProblemATS />);
    
    // Check for the updated content from the design
    const labelElement = screen.getByText(/CHUẨN HOÁ CV CỦA BẠN/i);
    const titleElement = screen.getByText(/75% CV bị loại bởi hệ thống lọc tự động ATS trước khi đến tay nhà tuyển dụng/i);
    const descriptionElement = screen.getByText(/Đừng để CV của bạn bị từ chối vì lỗi định dạng và thiếu từ khóa quan trọng/i);

    expect(labelElement).toBeInTheDocument();
    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
  });

  it('renders score card with issues', () => {
    render(<ProblemATS />);
    
    // Check for score card content
    expect(screen.getByText('Điểm CV')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('12 vấn đề được tìm thấy')).toBeInTheDocument();
    expect(screen.getByText('Sửa tất cả vấn đề ngay')).toBeInTheDocument();
    
    // Check for updated specific issues
    expect(screen.getByText('Định dạng phức tạp, có thể gây nhầm lẫn cho ATS')).toBeInTheDocument();
    expect(screen.getByText('Thiếu từ khóa đặc thù cho công việc')).toBeInTheDocument();
    expect(screen.getByText('Phát hiện lỗi font và lỗi chính tả')).toBeInTheDocument();
  });
}); 