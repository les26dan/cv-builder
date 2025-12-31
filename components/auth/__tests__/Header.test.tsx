import { render, screen } from '@testing-library/react';
import Header from '../Header';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Header Component', () => {
  it('renders the logo', () => {
    render(<Header />);
    expect(screen.getByText('OkBuddy')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('Góp ý')).toBeInTheDocument();
  });

  it('renders auth buttons', () => {
    render(<Header />);
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
    expect(screen.getByText('Đăng ký')).toBeInTheDocument();
  });

  it('has correct links for auth buttons', () => {
    render(<Header />);
    const loginLink = screen.getByRole('link', { name: 'Đăng nhập' });
    const signupLink = screen.getByRole('link', { name: 'Đăng ký' });
    
    expect(loginLink).toHaveAttribute('href', '/dang-nhap');
    expect(signupLink).toHaveAttribute('href', '/dang-ky');
  });
}); 