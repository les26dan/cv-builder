import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WaitlistSection from './WaitlistSection';

// Mock console.log to avoid noise in tests
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('WaitlistSection', () => {
  it('renders WaitlistSection with correct text', () => {
    render(<WaitlistSection />);
    
    // Check for the updated content from the design
    const headingElement = screen.getByText(/Sẵn sàng thay đổi cách bạn tìm việc\?/i);
    const descriptionElement = screen.getByText(/Tham gia danh sách ưu tiên để là một trong những người đầu tiên trải nghiệm CV Builder/i);
    const inputElement = screen.getByPlaceholderText(/Nhập email của bạn/i);
    const buttonElement = screen.getByRole('button', { name: /Tham gia ngay/i });

    expect(headingElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
    expect(inputElement).toBeInTheDocument();
    expect(buttonElement).toBeInTheDocument();
  });

  it('handles form submission correctly', async () => {
    render(<WaitlistSection />);
    
    const inputElement = screen.getByPlaceholderText(/Nhập email của bạn/i);
    const form = inputElement.closest('form');

    // Test valid email submission
    fireEvent.change(inputElement, { target: { value: 'test@example.com' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm/i)).toBeInTheDocument();
    });
  });

  it('validates email input', async () => {
    render(<WaitlistSection />);
    
    const inputElement = screen.getByPlaceholderText(/Nhập email của bạn/i);
    const form = inputElement.closest('form');

    // Test invalid email submission - remove required attribute to bypass browser validation
    inputElement.removeAttribute('required');
    fireEvent.change(inputElement, { target: { value: 'invalid-email' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/Vui lòng nhập email hợp lệ/i)).toBeInTheDocument();
    });
  });
}); 