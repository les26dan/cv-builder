import { render } from '@testing-library/react';
import SectionDivider from './SectionDivider';

describe('SectionDivider', () => {
  it('renders three dots', () => {
    const { container } = render(<SectionDivider />);
    const dots = container.querySelectorAll('div[class*="w-2 h-2 rounded"]');
    
    expect(dots).toHaveLength(3);
  });

  it('highlights the correct active dot', () => {
    const { container } = render(<SectionDivider activeIndex={1} />);
    const dots = container.querySelectorAll('div[class*="w-2 h-2 rounded"]');
    
    expect(dots[0]).toHaveClass('bg-[#B2EBF2]');
    expect(dots[1]).toHaveClass('bg-[#0288D1]');
    expect(dots[2]).toHaveClass('bg-[#B2EBF2]');
  });

  it('defaults to first dot active when no activeIndex provided', () => {
    const { container } = render(<SectionDivider />);
    const dots = container.querySelectorAll('div[class*="w-2 h-2 rounded"]');
    
    expect(dots[0]).toHaveClass('bg-[#0288D1]');
    expect(dots[1]).toHaveClass('bg-[#B2EBF2]');
    expect(dots[2]).toHaveClass('bg-[#B2EBF2]');
  });
}); 