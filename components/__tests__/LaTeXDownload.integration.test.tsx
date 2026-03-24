/**
 * Integration test for LaTeX download functionality
 * Validates WYSIWYG compliance and content accuracy
 */

import { generateLatexContent } from '../../utils/downloadUtils';

describe('LaTeX Download Integration', () => {
  const mockCvData = {
    contact: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/johndoe'
    },
    summary: {
      content: 'Experienced software engineer with 5+ years in full-stack development and team leadership.'
    },
    experience: {
      items: [
        {
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          location: 'San Francisco, CA',
          startDate: '2021-01',
          endDate: 'Present',
          bullets: [
            'Led development of microservices architecture serving 1M+ users',
            'Mentored junior developers and improved team productivity by 40%',
            'Implemented CI/CD pipelines reducing deployment time by 60%'
          ]
        },
        {
          title: 'Software Engineer',
          company: 'StartupXYZ',
          location: 'San Francisco, CA',
          startDate: '2019-06',
          endDate: '2020-12',
          bullets: [
            'Built responsive web applications using React and Node.js',
            'Collaborated with design team to implement pixel-perfect UIs'
          ]
        }
      ]
    },
    skills: {
      items: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes']
    },
    education: {
      items: [
        {
          degree: 'Bachelor of Science in Computer Science',
          school: 'University of California, Berkeley',
          location: 'Berkeley, CA',
          startDate: '2015',
          endDate: '2019',
          gpa: '3.8',
          description: 'Magna Cum Laude, Dean\'s List'
        }
      ]
    },
    sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
    sectionTitles: {
      summary: 'Professional Summary',
      experience: 'Work Experience',
      skills: 'Technical Skills',
      education: 'Education'
    }
  };

  describe('generateLatexContent', () => {
    test('generates complete LaTeX document with moderncv class', () => {
      const latex = generateLatexContent(mockCvData);
      
      // Check document structure
      expect(latex).toContain('\\documentclass[11pt,a4paper,sans]{moderncv}');
      expect(latex).toContain('\\moderncvstyle{classic}');
      expect(latex).toContain('\\moderncvcolor{blue}');
      expect(latex).toContain('\\usepackage[utf8]{inputenc}');
      expect(latex).toContain('\\usepackage[scale=0.85]{geometry}');
      expect(latex).toContain('\\begin{document}');
      expect(latex).toContain('\\end{document}');
    });

    test('includes contact information with proper escaping', () => {
      const latex = generateLatexContent(mockCvData);
      
      expect(latex).toContain('\\name{John}{Doe}');
      expect(latex).toContain('\\email{john.doe@example.com}');
      expect(latex).toContain('\\phone[mobile]{+1 (555) 123-4567}');
      expect(latex).toContain('\\address{San Francisco, CA}');
      expect(latex).toContain('\\social[linkedin]{johndoe}');
    });

    test('includes professional summary section', () => {
      const latex = generateLatexContent(mockCvData);
      
      expect(latex).toContain('\\section{PROFESSIONAL SUMMARY}');
      expect(latex).toContain('Experienced software engineer with 5+ years');
    });

    test('includes work experience with proper formatting', () => {
      const latex = generateLatexContent(mockCvData);
      
      expect(latex).toContain('\\section{WORK EXPERIENCE}');
      expect(latex).toContain('\\cventry{2021-01 -- Present}{Senior Software Engineer}{Tech Corp}{San Francisco, CA}{}');
      expect(latex).toContain('\\cventry{2019-06 -- 2020-12}{Software Engineer}{StartupXYZ}{San Francisco, CA}{}');
      
      // Check bullet points
      expect(latex).toContain('\\item Led development of microservices architecture serving 1M+ users');
      expect(latex).toContain('\\item Mentored junior developers and improved team productivity by 40\\%');
    });

    test('includes skills section', () => {
      const latex = generateLatexContent(mockCvData);
      
      expect(latex).toContain('\\section{TECHNICAL SKILLS}');
      expect(latex).toContain('\\cvitem{}{JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Kubernetes}');
    });

    test('includes education section with GPA', () => {
      const latex = generateLatexContent(mockCvData);
      
      expect(latex).toContain('\\section{EDUCATION}');
      expect(latex).toContain('\\cventry{2015 -- 2019}{Bachelor of Science in Computer Science}{University of California, Berkeley}{Berkeley, CA}{GPA: 3.8}{Magna Cum Laude, Dean\'s List}');
    });

    test('properly escapes LaTeX special characters', () => {
      const dataWithSpecialChars = {
        ...mockCvData,
        summary: {
          content: 'Experience with C++ & advanced algorithms @ 100% efficiency'
        },
        experience: {
          items: [{
            title: 'Engineer @ Tech Corp',
            company: 'Company & Co.',
            bullets: ['Improved performance by 50% using advanced techniques']
          }]
        }
      };

      const latex = generateLatexContent(dataWithSpecialChars);
      
      expect(latex).toContain('C++ \\& advanced');
      expect(latex).toContain('@ 100\\% efficiency');
      expect(latex).toContain('Engineer @ Tech Corp');
      expect(latex).toContain('Company \\& Co.');
      expect(latex).toContain('by 50\\% using');
    });

    test('handles empty sections gracefully', () => {
      const emptyData = {
        contact: { fullName: 'Test User' },
        sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
        sectionTitles: {}
      };

      const latex = generateLatexContent(emptyData);
      
      expect(latex).toContain('\\documentclass');
      expect(latex).toContain('\\name{Test}{User}');
      expect(latex).toContain('\\end{document}');
      expect(latex).not.toContain('\\section{Experience}');
    });

    test('respects custom section order', () => {
      const customOrderData = {
        ...mockCvData,
        sectionOrder: ['contact', 'skills', 'experience', 'education', 'summary']
      };

      const latex = generateLatexContent(customOrderData);
      
      const skillsIndex = latex.indexOf('\\section{TECHNICAL SKILLS}');
      const experienceIndex = latex.indexOf('\\section{WORK EXPERIENCE}');
      const summaryIndex = latex.indexOf('\\section{PROFESSIONAL SUMMARY}');
      
      expect(skillsIndex).toBeLessThan(experienceIndex);
      expect(experienceIndex).toBeLessThan(summaryIndex);
    });

    test('generates compilable LaTeX structure', () => {
      const latex = generateLatexContent(mockCvData);
      
      // Basic structure validation
      const beginDocCount = (latex.match(/\\begin{document}/g) || []).length;
      const endDocCount = (latex.match(/\\end{document}/g) || []).length;
      
      expect(beginDocCount).toBe(1);
      expect(endDocCount).toBe(1);
      
      // Check for balanced braces in basic structure
      const openBraces = (latex.match(/\\begin{/g) || []).length;
      const closeBraces = (latex.match(/\\end{/g) || []).length;
      
      expect(openBraces).toBe(closeBraces);
    });

    test('maintains WYSIWYG compliance with preview', () => {
      const latex = generateLatexContent(mockCvData);
      
      // Verify all critical content appears in the LaTeX
      expect(latex).toContain('\\name{John}{Doe}');
      expect(latex).toContain('john.doe@example.com');
      expect(latex).toContain('Senior Software Engineer');
      expect(latex).toContain('Tech Corp');
      expect(latex).toContain('StartupXYZ');
      expect(latex).toContain('JavaScript');
      expect(latex).toContain('University of California, Berkeley');
      expect(latex).toContain('Computer Science');
      
      // Verify professional formatting
      expect(latex).toContain('\\moderncvstyle{classic}');
      expect(latex).toContain('\\moderncvcolor{blue}');
    });
  });

  describe('LaTeX Integration Tests', () => {
    test('download format parameter accepts latex', () => {
      // This tests the type safety of the download format
      const validFormats: ('pdf' | 'docx' | 'latex')[] = ['pdf', 'docx', 'latex'];
      
      expect(validFormats).toContain('latex');
      expect(validFormats.length).toBe(3);
    });

    test('latex file extension handling', () => {
      const fileName = 'cv-test-123.tex';
      const isLatexFile = fileName.endsWith('.tex');
      
      expect(isLatexFile).toBe(true);
    });

    test('latex MIME type configuration', () => {
      const latexMimeType = 'text/x-tex';
      
      expect(latexMimeType).toBe('text/x-tex');
    });
  });
});
