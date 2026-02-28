import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CVWorkflowDataService } from '../cvWorkflowDataService';
import { databaseService } from '../database';

// Mock database service
vi.mock('../database', () => ({
  databaseService: {
    getClient: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CVWorkflowDataService - JD Analysis Methods', () => {
  let dataService: CVWorkflowDataService;
  let mockSupabaseClient: any;
  let mockSelect: any;
  let mockUpdate: any;

  beforeEach(() => {
    vi.clearAllMocks();
    dataService = CVWorkflowDataService.getInstance();
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    
    // Mock Supabase client with proper chaining
    const mockSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const mockEq = vi.fn(() => ({ single: mockSingle }));
    mockSelect = vi.fn(() => ({ eq: mockEq }));
    mockUpdate = vi.fn(() => ({ eq: mockEq }));
    
    mockSupabaseClient = {
      from: vi.fn(() => ({
        select: mockSelect,
        update: mockUpdate
      }))
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveJDAnalysis Method', () => {
    const mockAnalysisResults = {
      success: true,
      analysisId: 'test-analysis-id',
      originalJobDescription: 'React developer with 5+ years experience',
      jobMatch: {
        score: 85,
        missingKeywords: ['TypeScript', 'Redux'],
        matchedKeywords: ['React', 'JavaScript']
      },
      suggestions: {
        summary: [
          {
            id: 'sum-001',
            section: 'summary',
            type: 'modify',
            priority: 'high',
            title: 'Tối ưu tóm tắt',
            description: 'Thêm từ khóa React'
          }
        ],
        experience: [],
        skills: [],
        education: [],
        other: []
      },
      globalRecommendations: ['Thêm kinh nghiệm TypeScript']
    };

    it('saves to database when client is available', async () => {
      const cvId = 'test-cv-id';
      
      // Mock successful database response
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      
      // Setup the mock chain to return success
      const fromResult = mockSupabaseClient.from('cv_workflow');
      const updateResult = fromResult.update({});
      const eqResult = updateResult.eq('id', cvId);
      eqResult.select.mockResolvedValue({
        data: [{ id: cvId }],
        error: null
      });

      const result = await dataService.saveJDAnalysis(cvId, mockAnalysisResults);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnalysisResults);
    });

    it('falls back to localStorage when database client is unavailable', async () => {
      const cvId = 'test-cv-id';
      
      // Mock no database client
      vi.mocked(databaseService.getClient).mockResolvedValue(null);

      const result = await dataService.saveJDAnalysis(cvId, mockAnalysisResults);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnalysisResults);
      
      // Verify localStorage was used
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `okbuddy_jd_analysis_${cvId}`,
        expect.stringContaining('"analysisResults"')
      );
    });

    it('falls back to localStorage when database update fails', async () => {
      const cvId = 'test-cv-id';
      
      // Mock database client with error
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().update().eq().select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await dataService.saveJDAnalysis(cvId, mockAnalysisResults);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnalysisResults);
      
      // Verify localStorage fallback was used
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `okbuddy_jd_analysis_${cvId}`,
        expect.stringContaining('"analysisResults"')
      );

      expect(consoleSpy).toHaveBeenCalledWith('Save JD analysis error:', { message: 'Database error' });
      consoleSpy.mockRestore();
    });

    it('updates cache when CV is cached', async () => {
      const cvId = 'test-cv-id';
      
      // Set up cached CV data
      const cachedCV = {
        id: cvId,
        title: 'Test CV',
        contact: { fullName: 'Test User' }
      };
      
      // Access private cache through type assertion for testing
      (dataService as any).cache.set(cvId, cachedCV);
      
      // Mock successful database response
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().update().eq().select.mockResolvedValue({
        data: [{ id: cvId }],
        error: null
      });

      await dataService.saveJDAnalysis(cvId, mockAnalysisResults);

      // Verify cache was updated
      const updatedCache = (dataService as any).cache.get(cvId);
      expect(updatedCache.analysisResults).toEqual(mockAnalysisResults);
      expect(updatedCache.jobDescription).toEqual({
        text: 'React developer with 5+ years experience',
        keywords: ['TypeScript', 'Redux'],
        url: ''
      });
    });

    it('handles analysis results without job description text', async () => {
      const cvId = 'test-cv-id';
      const analysisWithoutJD = {
        ...mockAnalysisResults,
        originalJobDescription: undefined
      };
      
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().update().eq().select.mockResolvedValue({
        data: [{ id: cvId }],
        error: null
      });

      const result = await dataService.saveJDAnalysis(cvId, analysisWithoutJD);

      expect(result.success).toBe(true);
      
      // Verify database update was called with null for job description
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        analysis_results: analysisWithoutJD,
        job_description_text: null,
        job_description_keywords: ['TypeScript', 'Redux'],
        updated_at: expect.any(String)
      });
    });

    it('handles analysis results without keywords', async () => {
      const cvId = 'test-cv-id';
      const analysisWithoutKeywords = {
        ...mockAnalysisResults,
        jobMatch: {
          ...mockAnalysisResults.jobMatch,
          missingKeywords: undefined
        }
      };
      
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().update().eq().select.mockResolvedValue({
        data: [{ id: cvId }],
        error: null
      });

      const result = await dataService.saveJDAnalysis(cvId, analysisWithoutKeywords);

      expect(result.success).toBe(true);
      
      // Verify database update was called with empty array for keywords
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        analysis_results: analysisWithoutKeywords,
        job_description_text: 'React developer with 5+ years experience',
        job_description_keywords: [],
        updated_at: expect.any(String)
      });
    });
  });

  describe('loadJDAnalysis Method', () => {
    const mockDatabaseResponse = {
      analysis_results: {
        analysisId: 'test-analysis-id',
        jobMatch: {
          score: 85,
          missingKeywords: ['TypeScript', 'Redux']
        },
        suggestions: {
          summary: [],
          experience: [],
          skills: [],
          education: [],
          other: []
        }
      },
      job_description_text: 'React developer position',
      job_description_keywords: ['TypeScript', 'Redux']
    };

    it('loads from database when client is available', async () => {
      const cvId = 'test-cv-id';
      
      // Mock successful database response
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      
      // Set up the chain properly
      const mockChain = {
        single: vi.fn().mockResolvedValue({
          data: mockDatabaseResponse,
          error: null
        })
      };
      
      mockSelect.mockReturnValue({ eq: vi.fn().mockReturnValue(mockChain) });

      const result = await dataService.loadJDAnalysis(cvId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDatabaseResponse.analysis_results);
      
      // Verify database query was called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('cv_workflow');
      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith(
        'analysis_results, job_description_text, job_description_keywords'
      );
    });

    it('falls back to localStorage when database client is unavailable', async () => {
      const cvId = 'test-cv-id';
      const savedData = {
        analysisResults: mockDatabaseResponse.analysis_results,
        timestamp: new Date().toISOString()
      };
      
      // Mock no database client
      vi.mocked(databaseService.getClient).mockResolvedValue(null);
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      const result = await dataService.loadJDAnalysis(cvId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDatabaseResponse.analysis_results);
      
      // Verify localStorage was used
      expect(localStorageMock.getItem).toHaveBeenCalledWith(`okbuddy_jd_analysis_${cvId}`);
    });

    it('falls back to localStorage when database query fails', async () => {
      const cvId = 'test-cv-id';
      const savedData = {
        analysisResults: mockDatabaseResponse.analysis_results,
        timestamp: new Date().toISOString()
      };
      
      // Mock database client with error
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await dataService.loadJDAnalysis(cvId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDatabaseResponse.analysis_results);
      
      // Verify localStorage fallback was used
      expect(localStorageMock.getItem).toHaveBeenCalledWith(`okbuddy_jd_analysis_${cvId}`);

      expect(consoleSpy).toHaveBeenCalledWith('Load JD analysis error:', { message: 'Database error' });
      consoleSpy.mockRestore();
    });

    it('returns error when no analysis found in database or localStorage', async () => {
      const cvId = 'test-cv-id';
      
      // Mock database with no data
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { analysis_results: null },
        error: null
      });
      
      // Mock localStorage with no data
      localStorageMock.getItem.mockReturnValue(null);

      const result = await dataService.loadJDAnalysis(cvId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No analysis found');
    });

    it('handles corrupted localStorage data gracefully', async () => {
      const cvId = 'test-cv-id';
      
      // Mock no database client
      vi.mocked(databaseService.getClient).mockResolvedValue(null);
      
      // Mock corrupted localStorage data
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = await dataService.loadJDAnalysis(cvId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No analysis found');
    });

    it('returns error when database data exists but has no analysis_results', async () => {
      const cvId = 'test-cv-id';
      
      // Mock database response without analysis_results
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          analysis_results: null,
          job_description_text: 'Some text',
          job_description_keywords: []
        },
        error: null
      });

      const result = await dataService.loadJDAnalysis(cvId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No analysis found');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles database connection errors gracefully in saveJDAnalysis', async () => {
      const cvId = 'test-cv-id';
      const mockAnalysisResults = { test: 'data' };
      
      // Mock database service to throw an error
      vi.mocked(databaseService.getClient).mockRejectedValue(new Error('Connection failed'));

      const result = await dataService.saveJDAnalysis(cvId, mockAnalysisResults);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('handles database connection errors gracefully in loadJDAnalysis', async () => {
      const cvId = 'test-cv-id';
      
      // Mock database service to throw an error
      vi.mocked(databaseService.getClient).mockRejectedValue(new Error('Connection failed'));

      const result = await dataService.loadJDAnalysis(cvId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('handles invalid cvId in saveJDAnalysis', async () => {
      const invalidCvId = '';
      const mockAnalysisResults = { test: 'data' };
      
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().update().eq().select.mockResolvedValue({
        data: null,
        error: { message: 'Invalid ID' }
      });

      const result = await dataService.saveJDAnalysis(invalidCvId, mockAnalysisResults);

      expect(result.success).toBe(true); // Should fallback to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('handles invalid cvId in loadJDAnalysis', async () => {
      const invalidCvId = '';
      
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Invalid ID' }
      });
      
      localStorageMock.getItem.mockReturnValue(null);

      const result = await dataService.loadJDAnalysis(invalidCvId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No analysis found');
    });
  });

  describe('Data Integrity and Validation', () => {
    it('preserves all analysis data fields when saving', async () => {
      const cvId = 'test-cv-id';
      const complexAnalysisResults = {
        success: true,
        analysisId: 'complex-analysis-id',
        originalJobDescription: 'Complex job description',
        jobMatch: {
          score: 78,
          missingKeywords: ['React', 'Node.js', 'AWS'],
          matchedKeywords: ['JavaScript', 'TypeScript', 'Git'],
          industryMatch: true,
          roleMatch: false
        },
        suggestions: {
          summary: [
            { id: 'sum-1', title: 'Summary suggestion 1', priority: 'high' },
            { id: 'sum-2', title: 'Summary suggestion 2', priority: 'medium' }
          ],
          experience: [
            { id: 'exp-1', title: 'Experience suggestion 1', priority: 'high' }
          ],
          skills: [
            { id: 'skill-1', title: 'Skills suggestion 1', priority: 'low' }
          ],
          education: [],
          other: [
            { id: 'other-1', title: 'Other suggestion 1', priority: 'medium' }
          ]
        },
        globalRecommendations: [
          'Add more React experience',
          'Include Node.js projects',
          'Highlight AWS certifications'
        ]
      };
      
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().update().eq().select.mockResolvedValue({
        data: [{ id: cvId }],
        error: null
      });

      const result = await dataService.saveJDAnalysis(cvId, complexAnalysisResults);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(complexAnalysisResults);
      
      // Verify all nested data was preserved in database update
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        analysis_results: complexAnalysisResults,
        job_description_text: 'Complex job description',
        job_description_keywords: ['React', 'Node.js', 'AWS'],
        updated_at: expect.any(String)
      });
    });

    it('loads and returns complete analysis data structure', async () => {
      const cvId = 'test-cv-id';
      const complexDatabaseResponse = {
        analysis_results: {
          analysisId: 'complex-analysis-id',
          jobMatch: {
            score: 78,
            missingKeywords: ['React', 'Node.js'],
            matchedKeywords: ['JavaScript', 'TypeScript'],
            industryMatch: true,
            roleMatch: false
          },
          suggestions: {
            summary: [{ id: 'sum-1', title: 'Summary suggestion' }],
            experience: [{ id: 'exp-1', title: 'Experience suggestion' }],
            skills: [{ id: 'skill-1', title: 'Skills suggestion' }],
            education: [],
            other: []
          },
          globalRecommendations: ['Add React experience']
        }
      };
      
      vi.mocked(databaseService.getClient).mockResolvedValue(mockSupabaseClient);
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: complexDatabaseResponse,
        error: null
      });

      const result = await dataService.loadJDAnalysis(cvId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(complexDatabaseResponse.analysis_results);
      
      // Verify the structure is complete
      expect(result.data.jobMatch).toBeDefined();
      expect(result.data.suggestions).toBeDefined();
      expect(result.data.globalRecommendations).toBeDefined();
    });
  });

  describe('Singleton Pattern', () => {
    it('returns the same instance when called multiple times', () => {
      const instance1 = CVWorkflowDataService.getInstance();
      const instance2 = CVWorkflowDataService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('maintains state across multiple calls', async () => {
      const cvId = 'test-cv-id';
      const mockData = { test: 'data' };
      
      // Set up cache in first instance
      const instance1 = CVWorkflowDataService.getInstance();
      (instance1 as any).cache.set(cvId, mockData);
      
      // Verify cache exists in second instance
      const instance2 = CVWorkflowDataService.getInstance();
      const cachedData = (instance2 as any).cache.get(cvId);
      
      expect(cachedData).toEqual(mockData);
    });
  });
}); 