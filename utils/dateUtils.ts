/**
 * Date formatting utilities for CV sections
 * Following OkBuddy development tenets - centralized utility functions
 */

/**
 * Formats a date range for work experience display
 * Handles Vietnamese language and current job indication
 */
export const formatDateRange = (startDate: string, endDate: string, current: boolean = false, language?: string): string => {
  if (!startDate) return '';
  
  const start = startDate;
  const currentText = language === 'vi' ? 'Hiện tại' : 'Current';
  const end = current ? currentText : endDate || currentText;
  
  return `${start} - ${end}`;
};

/**
 * Formats a single date for education display
 */
export const formatEducationDate = (graduationDate: string): string => {
  return graduationDate || '';
};

/**
 * Checks if a work experience entry represents a current job
 */
export const isCurrentJob = (experience: { current?: boolean }): boolean => {
  return Boolean(experience.current);
};

/**
 * Gets the display label for current job status
 */
export const getCurrentJobLabel = (): string => {
  const language = typeof window !== 'undefined' ? localStorage.getItem('okbuddy_language') : null;
  return language === 'vi' ? 'Hiện tại' : 'Current';
}; 