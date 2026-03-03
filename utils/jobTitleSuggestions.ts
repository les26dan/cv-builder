// Common job titles for suggestions across the application
export const COMMON_JOB_TITLES = [
  'Software Engineer',
  'Marketing Manager', 
  'Sales Executive',
  'Product Manager',
  'Data Analyst',
  'Graphic Designer',
  'Financial Analyst',
  'Project Manager',
  'Human Resources Manager',
  'Business Analyst',
  'Customer Success Manager',
  'Content Writer'
];

// Filter job titles based on user input
export const filterJobTitles = (input: string, limit: number = 3): string[] => {
  if (!input) {
    return COMMON_JOB_TITLES.slice(0, limit);
  }
  
  const filtered = COMMON_JOB_TITLES.filter(title => 
    title.toLowerCase().includes(input.toLowerCase())
  );
  
  return filtered.slice(0, limit);
};
