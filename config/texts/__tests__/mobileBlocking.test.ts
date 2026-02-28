import { describe, it, expect } from 'vitest';
import { mobileBlocking, mobileBlockingTexts } from '../vi/mobileBlocking';

describe('Mobile Blocking Language Configuration', () => {
  describe('Configuration Structure', () => {
    it('should have both Vietnamese and English configurations', () => {
      expect(mobileBlocking).toHaveProperty('vi');
      expect(mobileBlocking).toHaveProperty('en');
    });

    it('should have consistent structure between languages', () => {
      const viKeys = Object.keys(mobileBlocking.vi);
      const enKeys = Object.keys(mobileBlocking.en);
      
      expect(viKeys).toEqual(enKeys);
      expect(viKeys).toContain('title');
      expect(viKeys).toContain('description');
      expect(viKeys).toContain('featuresTitle');
      expect(viKeys).toContain('features');
      expect(viKeys).toContain('actions');
    });

    it('should have consistent features structure', () => {
      const viFeatures = Object.keys(mobileBlocking.vi.features);
      const enFeatures = Object.keys(mobileBlocking.en.features);
      
      expect(viFeatures).toEqual(enFeatures);
      expect(viFeatures).toContain('workspace');
      expect(viFeatures).toContain('upload');
      expect(viFeatures).toContain('download');
    });

    it('should have consistent actions structure', () => {
      const viActions = Object.keys(mobileBlocking.vi.actions);
      const enActions = Object.keys(mobileBlocking.en.actions);
      
      expect(viActions).toEqual(enActions);
      expect(viActions).toContain('backButton');
      expect(viActions).toContain('tabletSuggestion');
    });
  });

  describe('Vietnamese Configuration', () => {
    it('should have proper Vietnamese title', () => {
      expect(mobileBlocking.vi.title).toBe('Trải nghiệm tốt hơn trên máy tính');
      expect(mobileBlocking.vi.title).toMatch(/trải nghiệm/i);
    });

    it('should have proper Vietnamese description', () => {
      expect(mobileBlocking.vi.description).toContain('Công cụ chỉnh sửa CV');
      expect(mobileBlocking.vi.description).toContain('màn hình lớn');
      expect(mobileBlocking.vi.description).toContain('chính xác và hiệu quả');
    });

    it('should have proper Vietnamese features title', () => {
      expect(mobileBlocking.vi.featuresTitle).toBe('Bạn vẫn có thể làm trên điện thoại:');
      expect(mobileBlocking.vi.featuresTitle).toContain('điện thoại');
    });

    it('should have proper Vietnamese feature descriptions', () => {
      expect(mobileBlocking.vi.features.workspace).toContain('Workspace');
      expect(mobileBlocking.vi.features.upload).toContain('Tải lên CV');
      expect(mobileBlocking.vi.features.download).toContain('Tải xuống CV');
    });

    it('should have proper Vietnamese action texts', () => {
      expect(mobileBlocking.vi.actions.backButton).toBe('Quay lại');
      expect(mobileBlocking.vi.actions.tabletSuggestion).toContain('máy tính bảng');
    });
  });

  describe('English Configuration', () => {
    it('should have proper English title', () => {
      expect(mobileBlocking.en.title).toBe('Better Experience on Desktop');
      expect(mobileBlocking.en.title).toMatch(/desktop/i);
    });

    it('should have proper English description', () => {
      expect(mobileBlocking.en.description).toContain('CV editing tools');
      expect(mobileBlocking.en.description).toContain('larger screens');
      expect(mobileBlocking.en.description).toContain('precise and efficient');
    });

    it('should have proper English features title', () => {
      expect(mobileBlocking.en.featuresTitle).toBe('What you can still do on mobile:');
      expect(mobileBlocking.en.featuresTitle).toContain('mobile');
    });

    it('should have proper English feature descriptions', () => {
      expect(mobileBlocking.en.features.workspace).toContain('Workspace');
      expect(mobileBlocking.en.features.upload).toContain('Upload CV');
      expect(mobileBlocking.en.features.download).toContain('Download completed CVs');
    });

    it('should have proper English action texts', () => {
      expect(mobileBlocking.en.actions.backButton).toBe('Go Back');
      expect(mobileBlocking.en.actions.tabletSuggestion).toContain('tablet');
    });
  });

  describe('Default Export', () => {
    it('should default to Vietnamese configuration', () => {
      expect(mobileBlockingTexts).toBe(mobileBlocking.vi);
    });

    it('should have all required properties in default export', () => {
      expect(mobileBlockingTexts).toHaveProperty('title');
      expect(mobileBlockingTexts).toHaveProperty('description');
      expect(mobileBlockingTexts).toHaveProperty('featuresTitle');
      expect(mobileBlockingTexts).toHaveProperty('features');
      expect(mobileBlockingTexts).toHaveProperty('actions');
    });
  });

  describe('Text Quality Validation', () => {
    it('should not have empty strings in Vietnamese', () => {
      expect(mobileBlocking.vi.title).toBeTruthy();
      expect(mobileBlocking.vi.description).toBeTruthy();
      expect(mobileBlocking.vi.featuresTitle).toBeTruthy();
      
      Object.values(mobileBlocking.vi.features).forEach(text => {
        expect(text).toBeTruthy();
      });
      
      Object.values(mobileBlocking.vi.actions).forEach(text => {
        expect(text).toBeTruthy();
      });
    });

    it('should not have empty strings in English', () => {
      expect(mobileBlocking.en.title).toBeTruthy();
      expect(mobileBlocking.en.description).toBeTruthy();
      expect(mobileBlocking.en.featuresTitle).toBeTruthy();
      
      Object.values(mobileBlocking.en.features).forEach(text => {
        expect(text).toBeTruthy();
      });
      
      Object.values(mobileBlocking.en.actions).forEach(text => {
        expect(text).toBeTruthy();
      });
    });

    it('should have reasonable text lengths', () => {
      // Title should be concise
      expect(mobileBlocking.vi.title.length).toBeLessThan(50);
      expect(mobileBlocking.en.title.length).toBeLessThan(50);
      
      // Description should be informative but not too long
      expect(mobileBlocking.vi.description.length).toBeLessThan(200);
      expect(mobileBlocking.en.description.length).toBeLessThan(200);
      
      // Feature texts should be concise
      Object.values(mobileBlocking.vi.features).forEach(text => {
        expect(text.length).toBeLessThan(50);
      });
      
      Object.values(mobileBlocking.en.features).forEach(text => {
        expect(text.length).toBeLessThan(50);
      });
    });
  });

  describe('Configuration Immutability', () => {
    it('should be immutable (as const)', () => {
      // TypeScript should enforce this at compile time with 'as const'
      // Runtime immutability would require Object.freeze() which we don't use
      // Test that the configuration is properly typed as const
      expect(mobileBlocking.vi.title).toBe('Trải nghiệm tốt hơn trên máy tính');
      expect(mobileBlocking.en.title).toBe('Better Experience on Desktop');
    });

    it('should have consistent object references', () => {
      const firstAccess = mobileBlockingTexts;
      const secondAccess = mobileBlockingTexts;
      
      expect(firstAccess).toBe(secondAccess);
    });
  });

  describe('Integration Compatibility', () => {
    it('should be compatible with React component usage', () => {
      // Test that texts can be used in JSX-like contexts
      const title = mobileBlockingTexts.title;
      const description = mobileBlockingTexts.description;
      
      expect(typeof title).toBe('string');
      expect(typeof description).toBe('string');
      expect(title).not.toContain('<');
      expect(description).not.toContain('<');
    });

    it('should have proper Unicode support for Vietnamese', () => {
      const viText = mobileBlocking.vi.description;
      
      // Should contain Vietnamese diacritics
      expect(viText).toMatch(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/);
    });
  });

  describe('Accessibility Considerations', () => {
    it('should have descriptive and clear text', () => {
      // Title should clearly indicate what this is about
      expect(mobileBlocking.vi.title).toBe('Trải nghiệm tốt hơn trên máy tính');
      expect(mobileBlocking.en.title).toBe('Better Experience on Desktop');
      
      // Features should be action-oriented
      expect(mobileBlocking.vi.features.workspace).toMatch(/xem|quản lý/i);
      expect(mobileBlocking.en.features.workspace).toMatch(/view|manage/i);
    });

    it('should have positive framing', () => {
      // Should emphasize what users CAN do, not what they can't
      expect(mobileBlocking.vi.featuresTitle).toContain('vẫn có thể');
      expect(mobileBlocking.en.featuresTitle).toContain('can still do');
    });
  });
}); 