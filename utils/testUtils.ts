import { vi } from 'vitest';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock implementations for common dependencies
export const mockAiService = {
  generateSummary: vi.fn(),
  generateBulletPoints: vi.fn(),
  generateBulletFromWizard: vi.fn(),
  generateEnhancedSummary: vi.fn(),
  suggestSkills: vi.fn(),
  analyzeJobDescription: vi.fn(),
  improveContent: vi.fn()
};

export const mockCrossAppDataService = {
  storeCVData: vi.fn(),
  getCVData: vi.fn(),
  clearCVData: vi.fn(),
  storeUploadedFile: vi.fn(),
  getUploadedFile: vi.fn(),
  clearUploadedFile: vi.fn(),
  storeAnalysisResults: vi.fn(),
  getAnalysisResults: vi.fn(),
  clearAnalysisResults: vi.fn()
};

export const mockCvWorkflowDataService = {
  getCVById: vi.fn(),
  updateCV: vi.fn(),
  createCV: vi.fn(),
  deleteCV: vi.fn(),
  listCVs: vi.fn(),
  getCVsByUserId: vi.fn(),
  updateCVStatus: vi.fn()
};

export const mockWorkflowAuthService = {
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  verifyToken: vi.fn(),
  refreshToken: vi.fn()
};

export const mockDatabaseService = {
  getClient: vi.fn(),
  query: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn()
};

// Common test data
export const mockCVData = {
  id: 'test-cv-1',
  contact: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/johndoe'
  },
  summary: {
    content: 'Experienced software engineer with 5+ years of experience'
  },
  experience: {
    items: [
      {
        id: 'exp-1',
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'New York, NY',
        startDate: '2020-01',
        endDate: '2024-01',
        current: false,
        bullets: [
          'Led development of microservices architecture',
          'Improved system performance by 40%',
          'Mentored 5 junior developers'
        ]
      }
    ]
  },
  skills: {
    items: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS']
  },
  education: {
    items: [
      {
        id: 'edu-1',
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of Technology',
        location: 'New York, NY',
        graduationDate: '2019-05',
        description: 'Magna Cum Laude'
      }
    ]
  },
  targetJobDescription: '',
  suggestions: {}
};

export const mockWorkflowCVData = {
  id: 'workflow-cv-1',
  userId: 'user-1',
  status: 'draft' as const,
  originalFileName: 'resume.pdf',
  extractedText: 'Sample extracted text',
  parsedData: mockCVData,
  analysisResults: {
    score: 85,
    suggestions: {
      summary: ['Improve professional summary'],
      workExperience: ['Add quantifiable achievements'],
      skills: ['Add technical skills'],
      education: ['Consider additional certifications']
    },
    keywords: ['React', 'JavaScript', 'Node.js'],
    improvements: ['Add more specific metrics']
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  version: 1
};

export const mockJobAnalysisResponse = {
  summary: ['Improve professional summary'],
  workExperience: ['Add quantifiable achievements'],
  skills: ['Add technical skills'],
  education: ['Consider additional certifications']
};

// Test utilities
export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  currentTarget: { value: '' },
  ...overrides
});

export const createMockFile = (overrides = {}) => ({
  name: 'test-file.pdf',
  size: 1024,
  type: 'application/pdf',
  lastModified: Date.now(),
  ...overrides
});

// Custom render function with providers
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, options);
};

// Mock window methods
export const mockWindowMethods = () => {
  Object.defineProperty(window, 'alert', {
    value: vi.fn(),
    writable: true
  });
  
  Object.defineProperty(window, 'confirm', {
    value: vi.fn(() => true),
    writable: true
  });
  
  Object.defineProperty(window, 'prompt', {
    value: vi.fn(() => 'test'),
    writable: true
  });
  
  Object.defineProperty(window, 'open', {
    value: vi.fn(),
    writable: true
  });
};

// Mock localStorage
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

// Mock sessionStorage
export const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

// Mock fetch
export const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
    url: '',
    type: 'default',
    redirected: false,
    bodyUsed: false,
    body: null,
    clone: vi.fn(),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData())
  } as unknown as Response)
);

// Test assertion helpers
export const waitForElement = async (callback: () => void, timeout = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  throw new Error(`Element not found within ${timeout}ms`);
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { vi } from 'vitest'; 