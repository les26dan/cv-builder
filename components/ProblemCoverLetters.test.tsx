import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProblemCoverLetters from './ProblemCoverLetters';

describe('ProblemCoverLetters', () => {
  it('renders ProblemCoverLetters with correct text', () => {
    render(<ProblemCoverLetters />);
    
    // Check for the updated content from the design - use more specific selectors
    const labelElement = screen.getByText('TẠO THƯ XIN VIỆC NỔI BẬT');
    const titleElement = screen.getByText(/Thư xin việc tốt tăng ngay 55% cơ hội phỏng vấn, nhưng bạn đang mất hàng giờ để viết?/i);
    const descriptionElement = screen.getByText(/CV Builder phân tích mô tả công việc, văn hoá công ty và lịch sử làm việc/i);

    expect(labelElement).toBeInTheDocument();
    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
  });

  it('renders cover letter interface', () => {
    render(<ProblemCoverLetters />);
    
    // Check for cover letter UI content - use more specific text
    expect(screen.getByText('Tạo thư xin việc tùy chỉnh ngay lập tức')).toBeInTheDocument();
    expect(screen.getByText('Kính gửi Nhà tuyển dụng,')).toBeInTheDocument();
    expect(screen.getByText('Ứng tuyển vị trí: Frontend Developer tại Zalo')).toBeInTheDocument();
    
    // Check for the generate button by role and name
    const generateButton = screen.getByRole('button', { name: /Tạo thư xin việc/i });
    expect(generateButton).toBeInTheDocument();
  });
}); 