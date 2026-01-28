import { useState, useEffect } from 'react';
import { AIAssistButton } from '../common/AIAssistButton';
import { getTexts } from '../../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../../config/languageConfig';

interface ContactSectionProps {
  data: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  onUpdate: (data: any) => void;
  isActive: boolean;
  language?: SupportedLanguage;
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

interface EmailSuggestion {
  original: string;
  suggestion: string;
}

export const ContactSection = ({
  data,
  onUpdate,
  isActive,
  language
}: ContactSectionProps) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [emailSuggestion, setEmailSuggestion] = useState<EmailSuggestion | null>(null);
  
  // Language and text configuration
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [contactTexts, setContactTexts] = useState<any>(null);
  
  // Load language configuration
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
        const effectiveLanguage = language || savedLanguage || detectLanguage().language;
        
        setCurrentLanguage(effectiveLanguage);
        const texts = await getTexts('cvEditor', effectiveLanguage);
        setContactTexts(texts.sections.contact);
      } catch (error) {
        console.error('Failed to load contact texts:', error);
        setCurrentLanguage('en');
      }
    };
    
    loadLanguage();
  }, [language]);

  // Common email domain typos
  const emailTypos: Record<string, string> = {
    'gamil.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlook.co': 'outlook.com',
    'outlok.com': 'outlook.com'
  };

  const handleChange = (field: string, value: string) => {
    onUpdate({
      ...data,
      [field]: value
    });

    // Clear errors when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Clear email suggestion when user starts typing in email field
    if (field === 'email' && emailSuggestion) {
      setEmailSuggestion(null);
    }
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return '';
    
    // Basic email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return contactTexts?.validation?.invalidEmail || 'Please enter a valid email address';
    }

    // Check for common typos
    const domain = email.split('@')[1];
    if (domain && emailTypos[domain.toLowerCase()]) {
      const correctedEmail = email.replace(domain, emailTypos[domain.toLowerCase()]);
      setEmailSuggestion({
        original: email,
        suggestion: correctedEmail
      });
      return ''; // Don't return error for typos, just show suggestion
    }

    return '';
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return '';

    // Remove formatting characters
    const cleanPhone = phone.replace(/[\s\-()+]/g, '');
    
    // Check if only digits (and possibly leading +)
    const phoneRegex = /^\+?\d+$/;
    if (!phoneRegex.test(cleanPhone)) {
      return contactTexts?.validation?.invalidPhone || 'Please enter a valid phone number';
    }

    // Check reasonable length (9-15 digits)
    const digitCount = cleanPhone.replace(/\+/, '').length;
    if (digitCount < 9 || digitCount > 15) {
      return contactTexts?.validation?.invalidPhone || 'Phone number must have 9-15 digits';
    }

    return '';
  };

  const validateRequired = (value: string, fieldName: string): string => {
    if (!value.trim()) {
      return contactTexts?.validation?.requiredField 
        ? `${contactTexts.validation.requiredField} ${fieldName.toLowerCase()}`
        : `Please enter ${fieldName.toLowerCase()}`;
    }
    return '';
  };

  const handleBlur = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'fullName':
        error = validateRequired(value, contactTexts?.fields?.fullName || 'Full Name');
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'phone':
        error = validatePhone(value);
        // Auto-format phone number if valid
        if (!error && value.trim()) {
          const cleanPhone = value.replace(/[\s\-()]/g, '');
          if (cleanPhone !== value) {
            handleChange('phone', cleanPhone);
          }
        }
        break;
      case 'location':
        error = validateRequired(value, contactTexts?.fields?.location || 'Location');
        break;
      case 'linkedin':
        // LinkedIn is optional, no validation needed
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [field]: error
    }));
  };

  const applyEmailSuggestion = () => {
    if (emailSuggestion) {
      handleChange('email', emailSuggestion.suggestion);
      setEmailSuggestion(null);
      setErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
  };

  const getInputClassName = (field: string, hasError: boolean) => {
    return `w-full p-2 border rounded-md transition-colors ${
      hasError 
        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
    } focus:outline-none focus:ring-2`;
  };

  return (
    <div className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="fullName">
          {contactTexts?.fields?.fullName || 'Full Name'} <span className="text-red-500 text-xs">*</span>
        </label>
        <input 
          type="text" 
          id="fullName" 
          className={getInputClassName('fullName', !!errors.fullName)}
          value={data.fullName} 
          onChange={e => handleChange('fullName', e.target.value)}
          onBlur={e => handleBlur('fullName', e.target.value)}
          placeholder={contactTexts?.placeholders?.fullName || 'John Doe'}
          aria-invalid={!!errors.fullName}
        />
        {errors.fullName && (
          <p className="text-red-500 text-xs mt-1 flex items-center">
            <span className="mr-1">⚠️</span>
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email <span className="text-red-500 text-xs">*</span>
          </label>
          <input 
            type="email" 
            id="email" 
            className={getInputClassName('email', !!errors.email)}
            value={data.email} 
            onChange={e => handleChange('email', e.target.value)}
            onBlur={e => handleBlur('email', e.target.value)}
            placeholder="example@gmail.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.email}
            </p>
          )}
          {emailSuggestion && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <p className="text-blue-700 mb-1">
                💡 Bạn có muốn dùng: 
                <button 
                  onClick={applyEmailSuggestion}
                  className="ml-1 text-blue-600 underline hover:text-blue-800 font-medium"
                >
                  {emailSuggestion.suggestion}
                </button>
                ?
              </p>
            </div>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="phone">
            {contactTexts?.fields?.phone || 'Phone'} <span className="text-red-500 text-xs">*</span>
          </label>
          <input 
            type="tel" 
            id="phone" 
            className={getInputClassName('phone', !!errors.phone)}
            value={data.phone} 
            onChange={e => handleChange('phone', e.target.value)}
            onBlur={e => handleBlur('phone', e.target.value)}
            placeholder={contactTexts?.placeholders?.phone || '+1 (555) 123-4567'}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.phone}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {currentLanguage === 'vi' ? 'Ví dụ: 0123456789 hoặc +84123456789' : 'Example: +1 (555) 123-4567'}
          </p>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="location">
          {contactTexts?.fields?.location || 'Location'} <span className="text-red-500 text-xs">*</span>
        </label>
        <input 
          type="text" 
          id="location" 
          className={getInputClassName('location', !!errors.location)}
          value={data.location} 
          onChange={e => handleChange('location', e.target.value)}
          onBlur={e => handleBlur('location', e.target.value)}
          placeholder={contactTexts?.placeholders?.location || 'City, State/Country'}
          aria-invalid={!!errors.location}
        />
        {errors.location && (
          <p className="text-red-500 text-xs mt-1 flex items-center">
            <span className="mr-1">⚠️</span>
            {errors.location}
          </p>
        )}
      </div>

      {/* LinkedIn (Optional) */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="linkedin">
          {contactTexts?.fields?.linkedin || 'LinkedIn'}
        </label>
        <input 
          type="text" 
          id="linkedin" 
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
          value={data.linkedin || ''} 
          onChange={e => handleChange('linkedin', e.target.value)}
          placeholder={contactTexts?.placeholders?.linkedin || 'linkedin.com/in/yourprofile'}
        />
        <p className="text-gray-500 text-xs mt-1">
          {currentLanguage === 'vi' ? 'Bao gồm URL đầy đủ hoặc chỉ username' : 'Include full URL or just username'}
        </p>
      </div>
    </div>
  );
};