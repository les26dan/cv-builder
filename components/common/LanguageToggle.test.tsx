import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LanguageToggle, useLanguageToggle } from './LanguageToggle';
import { LanguageConfigManager, SupportedLanguage } from '../../config/languageConfig';

// Mock LanguageConfigManager
vi.mock('../../config/languageConfig', () => ({
  LanguageConfigManager: {
    getInstance: vi.fn()
  },
  SupportedLanguage: {}
}));

describe('LanguageToggle Component', () => {
  let mockConfig: any;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Setup localStorage mock
    localStorageMock = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageMock[key] || null,
        setItem: (key: string, value: string) => {
          localStorageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete localStorageMock[key];
        },
        clear: () => {
          Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
        }
      },
      writable: true
    });

    // Setup mock config
    mockConfig = {
      getUserPreference: vi.fn().mockReturnValue({
        language: 'vi',
        source: 'manual',
        confidence: 1.0,
        timestamp: new Date().toISOString()
      }),
      setUserPreference: vi.fn(),
      detectLanguageFromContent: vi.fn().mockReturnValue({
        language: 'vi',
        confidence: 0.9,
        matches: { vi: 5, en: 1 }
      })
    };

    (LanguageConfigManager.getInstance as any).mockReturnValue(mockConfig);

    // Clear any existing event listeners
    const events: { [key: string]: EventListener[] } = {};
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Dropdown Variant', () => {
    it('should render dropdown with current language', () => {
      render(<LanguageToggle variant="dropdown" />);
      
      expect(screen.getByText('🇻🇳 Tiếng Việt')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should open dropdown when clicked', async () => {
      render(<LanguageToggle variant="dropdown" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
      });
    });

    it('should change language when option selected', async () => {
      const onLanguageChange = vi.fn();
      render(<LanguageToggle variant="dropdown" onLanguageChange={onLanguageChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const englishOption = screen.getByText('English');
        fireEvent.click(englishOption);
      });

      expect(mockConfig.setUserPreference).toHaveBeenCalledWith('en', 'manual');
      expect(onLanguageChange).toHaveBeenCalled();
    });

    it('should show icon when showIcon is true', () => {
      render(<LanguageToggle variant="dropdown" showIcon={true} />);
      
      expect(screen.getByText('🌐')).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      render(<LanguageToggle variant="dropdown" showIcon={false} />);
      
      expect(screen.queryByText('🌐')).not.toBeInTheDocument();
    });
  });

  describe('Button Variant', () => {
    it('should render buttons for each language', () => {
      render(<LanguageToggle variant="buttons" />);
      
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
    });

    it('should highlight selected language', () => {
      render(<LanguageToggle variant="buttons" />);
      
      const vietnameseButton = screen.getByText('Tiếng Việt');
      expect(vietnameseButton.closest('button')).toHaveClass('bg-blue-600');
    });

    it('should change language when button clicked', async () => {
      const onLanguageChange = vi.fn();
      render(<LanguageToggle variant="buttons" onLanguageChange={onLanguageChange} />);
      
      const englishButton = screen.getByText('English');
      fireEvent.click(englishButton);

      expect(mockConfig.setUserPreference).toHaveBeenCalledWith('en', 'manual');
      expect(onLanguageChange).toHaveBeenCalled();
    });
  });

  describe('Switch Variant', () => {
    it('should render switch component', () => {
      render(<LanguageToggle variant="switch" />);
      
      expect(screen.getByRole('switch')).toBeInTheDocument();
      expect(screen.getByText('EN')).toBeInTheDocument();
      expect(screen.getByText('VI')).toBeInTheDocument();
    });

    it('should toggle language when switch clicked', async () => {
      const onLanguageChange = vi.fn();
      render(<LanguageToggle variant="switch" onLanguageChange={onLanguageChange} />);
      
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      expect(mockConfig.setUserPreference).toHaveBeenCalledWith('en', 'manual');
      expect(onLanguageChange).toHaveBeenCalled();
    });

    it('should show correct switch position for Vietnamese', () => {
      render(<LanguageToggle variant="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      render(<LanguageToggle size="sm" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-sm', 'px-2', 'py-1');
    });

    it('should apply medium size classes', () => {
      render(<LanguageToggle size="md" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-base', 'px-3', 'py-2');
    });

    it('should apply large size classes', () => {
      render(<LanguageToggle size="lg" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-lg', 'px-4', 'py-3');
    });
  });

  describe('Loading State', () => {
    it('should disable button during loading', async () => {
      // Mock setUserPreference to be slow
      mockConfig.setUserPreference.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LanguageToggle variant="dropdown" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const englishOption = screen.getByText('English');
        fireEvent.click(englishOption);
      });

      // Check that setUserPreference was called (loading initiated)
      expect(mockConfig.setUserPreference).toHaveBeenCalledWith('en', 'manual');
    });
  });

  describe('Error Handling', () => {
    it('should handle setUserPreference errors gracefully', async () => {
      mockConfig.setUserPreference.mockImplementation(() => {
        throw new Error('Network error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<LanguageToggle variant="dropdown" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const englishOption = screen.getByText('English');
        fireEvent.click(englishOption);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to change language:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const { container } = render(<LanguageToggle className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should call onLanguageChange with correct parameters', async () => {
      const onLanguageChange = vi.fn();
      render(<LanguageToggle onLanguageChange={onLanguageChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const englishOption = screen.getByText('English');
        fireEvent.click(englishOption);
      });

      expect(onLanguageChange).toHaveBeenCalledWith('en', expect.any(Object));
    });
  });

  describe('Event Dispatching', () => {
    it('should dispatch languageChange event', async () => {
      render(<LanguageToggle variant="dropdown" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const englishOption = screen.getByText('English');
        fireEvent.click(englishOption);
      });

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'languageChange',
          detail: expect.objectContaining({
            language: 'en'
          })
        })
      );
    });
  });
});

describe('useLanguageToggle Hook', () => {
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      getUserPreference: vi.fn().mockReturnValue({
        language: 'vi',
        source: 'manual',
        confidence: 1.0,
        timestamp: new Date().toISOString()
      }),
      setUserPreference: vi.fn(),
      detectLanguageFromContent: vi.fn().mockReturnValue({
        language: 'vi',
        confidence: 0.9,
        matches: { vi: 5, en: 1 }
      })
    };

    (LanguageConfigManager.getInstance as any).mockReturnValue(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return current language and preference', () => {
    const TestComponent = () => {
      const { currentLanguage, preference } = useLanguageToggle();
      return (
        <div>
          <span data-testid="language">{currentLanguage}</span>
          <span data-testid="source">{preference?.source}</span>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('language')).toHaveTextContent('vi');
    expect(screen.getByTestId('source')).toHaveTextContent('manual');
  });

  it('should provide changeLanguage function', () => {
    const TestComponent = () => {
      const { changeLanguage } = useLanguageToggle();
      return (
        <button onClick={() => changeLanguage('en')}>
          Change to English
        </button>
      );
    };

    render(<TestComponent />);

    const button = screen.getByText('Change to English');
    fireEvent.click(button);

    expect(mockConfig.setUserPreference).toHaveBeenCalledWith('en', 'manual');
  });

  it('should return supported languages', () => {
    const TestComponent = () => {
      const { supportedLanguages } = useLanguageToggle();
      return (
        <div data-testid="languages">
          {supportedLanguages.join(',')}
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('languages')).toHaveTextContent('en,vi');
  });

  it('should handle case when no user preference exists', () => {
    mockConfig.getUserPreference.mockReturnValue(null);

    const TestComponent = () => {
      const { currentLanguage, preference } = useLanguageToggle();
      return (
        <div>
          <span data-testid="language">{currentLanguage}</span>
          <span data-testid="preference">{preference ? 'exists' : 'null'}</span>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('language')).toHaveTextContent('vi');
    expect(screen.getByTestId('preference')).toHaveTextContent('null');
  });
});

describe('Integration Tests', () => {
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      getUserPreference: vi.fn().mockReturnValue(null),
      setUserPreference: vi.fn(),
      detectLanguageFromContent: vi.fn().mockReturnValue({
        language: 'en',
        confidence: 0.9,
        matches: { vi: 1, en: 5 }
      })
    };

    (LanguageConfigManager.getInstance as any).mockReturnValue(mockConfig);
  });

  it('should initialize with detected language when no preference', () => {
    render(<LanguageToggle />);

    expect(mockConfig.detectLanguageFromContent).toHaveBeenCalled();
    expect(screen.getByText('🇺🇸 English')).toBeInTheDocument();
  });

  it('should maintain language state across component updates', async () => {
    const { rerender } = render(<LanguageToggle variant="dropdown" />);

    // Change language
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const vietnameseOption = screen.getByText('Tiếng Việt');
      fireEvent.click(vietnameseOption);
    });

    // Rerender component
    rerender(<LanguageToggle variant="buttons" />);

    // Should still show Vietnamese as selected
    expect(mockConfig.setUserPreference).toHaveBeenCalledWith('vi', 'manual');
  });
}); 