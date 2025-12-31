/**
 * CV Completion Validation Utility
 * Following OkBuddy development tenets - modular, testable logic
 * Validates CV prerequisites for JD optimization feature
 */

export interface CVCompletionStatus {
  isComplete: boolean;
  hasContactInfo: boolean;
  hasWorkExperience: boolean;
  workExperienceCount: number;
  missingFields: string[];
  completionPercentage: number;
}

/**
 * Validates if CV meets minimum requirements for JD optimization
 * Requirement: Contact Info + at least 1 Work Experience entry
 */
export function validateCVCompletion(cvData: any): CVCompletionStatus {
  if (!cvData) {
    return {
      isComplete: false,
      hasContactInfo: false,
      hasWorkExperience: false,
      workExperienceCount: 0,
      missingFields: ['Contact Info', 'Work Experience'],
      completionPercentage: 0
    };
  }

  const missingFields: string[] = [];
  
  // Check contact information
  const hasContactInfo = validateContactInfo(cvData);
  if (!hasContactInfo) {
    missingFields.push('Contact Info');
  }

  // Check work experience
  const workExperienceCount = getWorkExperienceCount(cvData);
  const hasWorkExperience = workExperienceCount >= 1;
  if (!hasWorkExperience) {
    missingFields.push('Work Experience');
  }

  const isComplete = hasContactInfo && hasWorkExperience;
  
  // Calculate completion percentage for UI feedback
  const completionPercentage = calculateCompletionPercentage(hasContactInfo, hasWorkExperience);

  return {
    isComplete,
    hasContactInfo,
    hasWorkExperience,
    workExperienceCount,
    missingFields,
    completionPercentage
  };
}

/**
 * Validates contact information section
 */
function validateContactInfo(cvData: any): boolean {
  const contact = cvData.contact || cvData.contactInfo;
  
  if (!contact) return false;
  
  // Check for essential contact fields
  const hasName = !!(contact.name || contact.fullName || '').trim();
  const hasEmail = !!(contact.email || '').trim();
  
  // At minimum, need name and email
  return hasName && hasEmail;
}

/**
 * Counts valid work experience entries
 */
function getWorkExperienceCount(cvData: any): number {
  const workExperience = cvData.workExperience || cvData.experience || [];
  
  if (!Array.isArray(workExperience)) return 0;
  
  // Count entries that have at least title and company
  return workExperience.filter((entry: any) => {
    const hasTitle = !!(entry.title || entry.position || entry.jobTitle || '').trim();
    const hasCompany = !!(entry.company || entry.organization || '').trim();
    return hasTitle && hasCompany;
  }).length;
}

/**
 * Calculates completion percentage for progress indicators
 */
function calculateCompletionPercentage(hasContactInfo: boolean, hasWorkExperience: boolean): number {
  let percentage = 0;
  
  if (hasContactInfo) percentage += 50;
  if (hasWorkExperience) percentage += 50;
  
  return percentage;
}

/**
 * Gets user-friendly missing fields message
 */
export function getMissingFieldsMessage(status: CVCompletionStatus, language: 'vi' | 'en' = 'vi'): string {
  if (status.isComplete) return '';
  
  const messages = {
    vi: {
      contactInfo: 'thông tin liên hệ',
      workExperience: 'kinh nghiệm làm việc',
      and: ' và ',
      missing: 'Vui lòng hoàn thiện '
    },
    en: {
      contactInfo: 'contact information',
      workExperience: 'work experience',
      and: ' and ',
      missing: 'Please complete '
    }
  };
  
  const lang = messages[language];
  const missingFields = status.missingFields.map(field => {
    if (field === 'Contact Info') return lang.contactInfo;
    if (field === 'Work Experience') return lang.workExperience;
    return field;
  });
  
  return lang.missing + missingFields.join(lang.and) + '.';
}

/**
 * Checks if user can access JD optimization features
 */
export function canAccessJDOptimization(cvData: any): boolean {
  const status = validateCVCompletion(cvData);
  return status.isComplete;
} 