import React from 'react';
import { render, screen } from '@testing-library/react';
import TestimonialsSection from './TestimonialsSection';

describe('TestimonialsSection', () => {
  it('renders the testimonials section with title', () => {
    render(<TestimonialsSection />);
    
    // Check if updated title is rendered
    expect(screen.getByText('Hơn 1000+ người đã tìm được việc mơ ước nhờ CV Builder')).toBeInTheDocument();
  });

  it('renders all testimonial cards', () => {
    render(<TestimonialsSection />);
    
    // Check if all testimonial names are rendered
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    expect(screen.getByText('Lê Văn C')).toBeInTheDocument();
    
    // Check if roles are rendered
    expect(screen.getByText('Kỹ sư phần mềm')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Sinh viên mới tốt nghiệp')).toBeInTheDocument();
  });

  it('renders testimonial content', () => {
    render(<TestimonialsSection />);
    
    // Check if testimonial content is rendered
    const testimonialContent = screen.getByText(/CV Builder giúp tôi có được phỏng vấn tại 3 công ty/);
    expect(testimonialContent).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    const { container } = render(<TestimonialsSection />);
    const section = container.firstChild;
    
    expect(section).toHaveClass('flex', 'flex-col', 'justify-center', 'items-center');
  });
}); 