import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProblemMassCV from './ProblemMassCV';

describe('ProblemMassCV', () => {
  it('renders ProblemMassCV with correct text', () => {
    render(<ProblemMassCV />);
    
    // Check for the updated content from the design - use exact text match for label
    const labelElement = screen.getByText('ỨNG TUYỂN NHANH CHÓNG');
    const titleElement = screen.getByText(/Ứng tuyển hơn 50 công việc mỗi ngày, không còn vất vả chỉnh sửa CV thủ công!/i);
    const descriptionElement = screen.getByText(/Ngừng lãng phí thời gian chỉnh sửa từng CV một/i);

    expect(labelElement).toBeInTheDocument();
    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
  });

  it('renders mass application interface', () => {
    render(<ProblemMassCV />);
    
    // Check for mass application content - use more specific text
    expect(screen.getByText('Nộp đơn nhiều vị trí nhanh chóng với CV tối ưu')).toBeInTheDocument();
    expect(screen.getByText('Bắt đầu ứng tuyển hàng loạt')).toBeInTheDocument();
    
    // Check for job listings - updated to match Vietnamese companies
    expect(screen.getByText('Frontend Developer tại Zalo')).toBeInTheDocument();
    expect(screen.getByText('React Developer tại MoMo')).toBeInTheDocument();
    expect(screen.getByText('Web Developer tại NAB')).toBeInTheDocument();
    
    // Check for match percentages
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    
    // Check for updated CTAs
    expect(screen.getByText('Ứng tuyển ngay')).toBeInTheDocument();
    expect(screen.getAllByText('Tối ưu CV & ứng tuyển')).toHaveLength(2);
  });
}); 