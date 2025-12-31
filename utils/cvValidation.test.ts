/**
 * CV Validation Tests
 * Following OkBuddy development tenets - comprehensive testing for core functionality
 */

import { describe, it, expect } from 'vitest';
import { validateCVCompletion, getMissingFieldsMessage, canAccessJDOptimization } from './cvValidation';

describe('validateCVCompletion', () => {
  it('returns incomplete status for null CV data', () => {
    const result = validateCVCompletion(null);
    
    expect(result.isComplete).toBe(false);
    expect(result.hasContactInfo).toBe(false);
    expect(result.hasWorkExperience).toBe(false);
    expect(result.workExperienceCount).toBe(0);
    expect(result.missingFields).toEqual(['Contact Info', 'Work Experience']);
    expect(result.completionPercentage).toBe(0);
  });

  it('validates complete CV with all required fields', () => {
    const completeCV = {
      contact: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      workExperience: [
        {
          title: 'Software Developer',
          company: 'Tech Corp'
        }
      ]
    };

    const result = validateCVCompletion(completeCV);
    
    expect(result.isComplete).toBe(true);
    expect(result.hasContactInfo).toBe(true);
    expect(result.hasWorkExperience).toBe(true);
    expect(result.workExperienceCount).toBe(1);
    expect(result.missingFields).toEqual([]);
    expect(result.completionPercentage).toBe(100);
  });

  it('validates CV with missing contact info', () => {
    const cvWithoutContact = {
      workExperience: [
        {
          title: 'Software Developer',
          company: 'Tech Corp'
        }
      ]
    };

    const result = validateCVCompletion(cvWithoutContact);
    
    expect(result.isComplete).toBe(false);
    expect(result.hasContactInfo).toBe(false);
    expect(result.hasWorkExperience).toBe(true);
    expect(result.missingFields).toEqual(['Contact Info']);
    expect(result.completionPercentage).toBe(50);
  });

  it('validates CV with missing work experience', () => {
    const cvWithoutExperience = {
      contact: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      workExperience: []
    };

    const result = validateCVCompletion(cvWithoutExperience);
    
    expect(result.isComplete).toBe(false);
    expect(result.hasContactInfo).toBe(true);
    expect(result.hasWorkExperience).toBe(false);
    expect(result.missingFields).toEqual(['Work Experience']);
    expect(result.completionPercentage).toBe(50);
  });

  it('handles different contact field names', () => {
    const cvWithAltFields = {
      contactInfo: {
        fullName: 'John Doe',
        email: 'john@example.com'
      },
      experience: [
        {
          position: 'Developer',
          organization: 'Tech Corp'
        }
      ]
    };

    const result = validateCVCompletion(cvWithAltFields);
    
    expect(result.isComplete).toBe(true);
    expect(result.hasContactInfo).toBe(true);
    expect(result.hasWorkExperience).toBe(true);
  });

  it('counts multiple work experience entries', () => {
    const cvWithMultipleJobs = {
      contact: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      workExperience: [
        { title: 'Senior Developer', company: 'Tech Corp' },
        { title: 'Junior Developer', company: 'StartupCo' },
        { title: 'Intern', company: 'BigCorp' }
      ]
    };

    const result = validateCVCompletion(cvWithMultipleJobs);
    
    expect(result.workExperienceCount).toBe(3);
    expect(result.isComplete).toBe(true);
  });

  it('ignores incomplete work experience entries', () => {
    const cvWithIncompleteExperience = {
      contact: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      workExperience: [
        { title: 'Developer', company: 'Tech Corp' }, // Complete
        { title: 'Developer' }, // Missing company
        { company: 'StartupCo' }, // Missing title
        { title: '', company: 'BigCorp' } // Empty title
      ]
    };

    const result = validateCVCompletion(cvWithIncompleteExperience);
    
    expect(result.workExperienceCount).toBe(1);
    expect(result.isComplete).toBe(true);
  });
});

describe('getMissingFieldsMessage', () => {
  it('returns empty string for complete CV', () => {
    const completeStatus = {
      isComplete: true,
      hasContactInfo: true,
      hasWorkExperience: true,
      workExperienceCount: 1,
      missingFields: [],
      completionPercentage: 100
    };

    expect(getMissingFieldsMessage(completeStatus, 'en')).toBe('');
    expect(getMissingFieldsMessage(completeStatus, 'vi')).toBe('');
  });

  it('returns English message for missing contact info', () => {
    const incompleteStatus = {
      isComplete: false,
      hasContactInfo: false,
      hasWorkExperience: true,
      workExperienceCount: 1,
      missingFields: ['Contact Info'],
      completionPercentage: 50
    };

    const message = getMissingFieldsMessage(incompleteStatus, 'en');
    expect(message).toBe('Please complete contact information.');
  });

  it('returns Vietnamese message for missing fields', () => {
    const incompleteStatus = {
      isComplete: false,
      hasContactInfo: false,
      hasWorkExperience: false,
      workExperienceCount: 0,
      missingFields: ['Contact Info', 'Work Experience'],
      completionPercentage: 0
    };

    const message = getMissingFieldsMessage(incompleteStatus, 'vi');
    expect(message).toBe('Vui lòng hoàn thiện thông tin liên hệ và kinh nghiệm làm việc.');
  });
});

describe('canAccessJDOptimization', () => {
  it('allows access for complete CV', () => {
    const completeCV = {
      contact: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      workExperience: [
        {
          title: 'Software Developer',
          company: 'Tech Corp'
        }
      ]
    };

    expect(canAccessJDOptimization(completeCV)).toBe(true);
  });

  it('denies access for incomplete CV', () => {
    const incompleteCV = {
      contact: {
        name: 'John Doe'
        // missing email
      },
      workExperience: []
    };

    expect(canAccessJDOptimization(incompleteCV)).toBe(false);
  });

  it('denies access for null CV', () => {
    expect(canAccessJDOptimization(null)).toBe(false);
  });
}); 