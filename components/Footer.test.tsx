import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from './Footer';

describe('Footer', () => {
  it('renders Footer with correct content', () => {
    render(<Footer />);
    
    // Check for logo and description
    expect(screen.getByText('CV Builder')).toBeInTheDocument();
    expect(screen.getByText(/Trợ lý AI giúp bạn tối ưu hóa CV và tìm việc hiệu quả hơn/i)).toBeInTheDocument();
    
    // Check for section headers
    expect(screen.getByText('Sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('Công ty')).toBeInTheDocument();
    expect(screen.getByText('Pháp lý')).toBeInTheDocument();
    
    // Check for updated copyright with 2025
    expect(screen.getByText(/© 2025 CV Builder. Tất cả quyền được bảo lưu/i)).toBeInTheDocument();
  });

  it('renders all footer links', () => {
    render(<Footer />);
    
    // Check for product links
    expect(screen.getByText('Tính năng')).toBeInTheDocument();
    expect(screen.getByText('Giá cả')).toBeInTheDocument();
    expect(screen.getByText('Câu hỏi thường gặp')).toBeInTheDocument();
    
    // Check for company links
    expect(screen.getByText('Giới thiệu')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Liên hệ')).toBeInTheDocument();
    
    // Check for legal links
    expect(screen.getByText('Chính sách bảo mật')).toBeInTheDocument();
    expect(screen.getByText('Điều khoản dịch vụ')).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    const { container } = render(<Footer />);
    const footer = container.firstChild;
    
    expect(footer).toHaveClass('flex', 'flex-col', 'justify-center', 'items-center');
  });
}); 