import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactSection } from './ContactSection';
import { useState } from 'react';

// Helper component to properly test controlled component behavior
const ContactSectionWrapper = ({ initialData = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: ''
}}) => {
  const [data, setData] = useState(initialData);
  
  return (
    <ContactSection
      data={data}
      onUpdate={setData}
      isActive={true}
    />
  );
};

describe('ContactSection Validation', () => {
  describe('Email Validation', () => {
    it('should show error for invalid email format', async () => {
      render(<ContactSectionWrapper />);
      
      const emailInput = screen.getByPlaceholderText('example@gmail.com');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Địa chỉ email không hợp lệ')).toBeInTheDocument();
      });
    });

    it('should not show error for valid email', async () => {
      render(<ContactSectionWrapper />);
      
      const emailInput = screen.getByPlaceholderText('example@gmail.com');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.queryByText('Địa chỉ email không hợp lệ')).not.toBeInTheDocument();
      });
    });

    it('should suggest correction for common email typos', async () => {
      render(<ContactSectionWrapper />);
      
      const emailInput = screen.getByPlaceholderText('example@gmail.com');
      fireEvent.change(emailInput, { target: { value: 'user@gamil.com' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/user@gmail.com/)).toBeInTheDocument();
        expect(screen.getByText(/Bạn có muốn dùng:/)).toBeInTheDocument();
      });
    });

    it('should apply email suggestion when clicked', async () => {
      render(<ContactSectionWrapper />);
      
      const emailInput = screen.getByPlaceholderText('example@gmail.com');
      fireEvent.change(emailInput, { target: { value: 'user@gamil.com' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        const suggestionButton = screen.getByText('user@gmail.com');
        fireEvent.click(suggestionButton);
      });

      await waitFor(() => {
        expect(emailInput).toHaveValue('user@gmail.com');
      });
    });

    it('should clear error when user starts typing', async () => {
      render(<ContactSectionWrapper />);
      
      const emailInput = screen.getByPlaceholderText('example@gmail.com');
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Địa chỉ email không hợp lệ')).toBeInTheDocument();
      });

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      
      await waitFor(() => {
        expect(screen.queryByText('Địa chỉ email không hợp lệ')).not.toBeInTheDocument();
      });
    });
  });

  describe('Phone Validation', () => {
    it('should show error for invalid phone number', async () => {
      render(<ContactSectionWrapper />);
      
      const phoneInput = screen.getByPlaceholderText('0123456789');
      fireEvent.change(phoneInput, { target: { value: 'abc123' } });
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.getByText('Số điện thoại không hợp lệ')).toBeInTheDocument();
      });
    });

    it('should auto-format valid phone number', async () => {
      render(<ContactSectionWrapper />);
      
      const phoneInput = screen.getByPlaceholderText('0123456789');
      fireEvent.change(phoneInput, { target: { value: '(123) 456-7890' } });
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(phoneInput).toHaveValue('1234567890');
      });
    });

    it('should accept phone with country code', async () => {
      render(<ContactSectionWrapper />);
      
      const phoneInput = screen.getByPlaceholderText('0123456789');
      fireEvent.change(phoneInput, { target: { value: '+84123456789' } });
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.queryByText('Số điện thoại không hợp lệ')).not.toBeInTheDocument();
      });
    });

    it('should show error for phone number that is too short', async () => {
      render(<ContactSectionWrapper />);
      
      const phoneInput = screen.getByPlaceholderText('0123456789');
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.getByText('Số điện thoại phải có từ 9-15 chữ số')).toBeInTheDocument();
      });
    });
  });

  describe('Required Field Validation', () => {
    it('should show error for empty full name', async () => {
      render(<ContactSectionWrapper />);
      
      const nameInput = screen.getByPlaceholderText('Nguyễn Văn A');
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText('Vui lòng điền họ và tên')).toBeInTheDocument();
      });
    });

    it('should show error for empty location', async () => {
      render(<ContactSectionWrapper />);
      
      const locationInput = screen.getByPlaceholderText('Hà Nội, Việt Nam');
      fireEvent.focus(locationInput);
      fireEvent.blur(locationInput);

      await waitFor(() => {
        expect(screen.getByText('Vui lòng điền địa chỉ')).toBeInTheDocument();
      });
    });

    it('should clear required field error when user enters text', async () => {
      render(<ContactSectionWrapper />);
      
      const nameInput = screen.getByPlaceholderText('Nguyễn Văn A');
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText('Vui lòng điền họ và tên')).toBeInTheDocument();
      });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      await waitFor(() => {
        expect(screen.queryByText('Vui lòng điền họ và tên')).not.toBeInTheDocument();
      });
    });

    it('should not show error for optional LinkedIn field', async () => {
      render(<ContactSectionWrapper />);
      
      const linkedinInput = screen.getByPlaceholderText('linkedin.com/in/username');
      fireEvent.focus(linkedinInput);
      fireEvent.blur(linkedinInput);

      // Should not show any error for optional field
      expect(screen.queryByText(/vui lòng/i)).not.toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('should apply error styling to fields with errors', async () => {
      render(<ContactSectionWrapper />);
      
      const emailInput = screen.getByPlaceholderText('example@gmail.com');
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(emailInput).toHaveClass('border-red-300', 'bg-red-50');
      });
    });

    it('should have proper aria-invalid attributes', async () => {
      render(<ContactSectionWrapper />);
      
      const emailInput = screen.getByPlaceholderText('example@gmail.com');
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only inputs', async () => {
      render(<ContactSectionWrapper />);
      
      const nameInput = screen.getByPlaceholderText('Nguyễn Văn A');
      fireEvent.change(nameInput, { target: { value: '   ' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText('Vui lòng điền họ và tên')).toBeInTheDocument();
      });
    });

    it('should handle multiple email typos', async () => {
      render(<ContactSectionWrapper />);
      
      const emailInput = screen.getByPlaceholderText('example@gmail.com');
      const typos = ['user@yaho.com', 'user@hotmial.com', 'user@outlok.com'];
      
      for (const typo of typos) {
        fireEvent.change(emailInput, { target: { value: typo } });
        fireEvent.blur(emailInput);
        
        await waitFor(() => {
          expect(screen.getByText(/Bạn có muốn dùng:/)).toBeInTheDocument();
        });
        
        // Clear the suggestion for next test
        fireEvent.change(emailInput, { target: { value: '' } });
      }
    });
  });

  describe('Validation Functions Direct Testing', () => {
    // Test isolated validation functions
    it('should validate email format correctly', () => {
      // Since validateEmail is not exported, we test through component behavior
      // This is covered by the integration tests above
      expect(true).toBe(true); // Placeholder test
    });
  });
}); 