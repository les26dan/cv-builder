export const landingPage = {
  header: {
    logo: "OkBuddy",
    nav: {
      features: "Features",
      pricing: "Pricing", 
      about: "About"
    },
    auth: {
      login: "Log In",
      signup: "Sign Up"
    }
  },
  hero: {
    title: "75% of CVs are automatically rejected before reaching recruiters. What about yours?",
    subtitle: "OkBuddy helps you save hours writing outstanding CVs and cover letters, helping you apply quickly and significantly increase your interview chances",
    cta: "Try Free Now"
  },
  problems: {
    ats: {
      label: "OPTIMIZE YOUR CV" ,
      title: "75% of CVs are rejected by automated ATS systems before reaching recruiters",
      description: "Don't let your CV get rejected due to formatting errors and missing key keywords. OkBuddy helps you optimize your CV to always catch recruiters' attention.",
      scoreCard: {
        title: "CV Score",
        score: "60",
        description: "Your CV only matches 60% of job requirements",
        issuesTitle: "12 issues found",
        issues: [
          "Complex formatting may confuse ATS systems",
          "Missing job-specific keywords", 
          "Font and spelling errors detected"
        ],
        cta: "Fix all issues now"
      }
    },
    keywords: {
      label: "ADD IMPORTANT KEYWORDS",
      title: "60% of CVs are rejected for missing important keywords that jobs require",
      description: "Each job requires specific keywords. OkBuddy quickly analyzes and clearly shows which keywords your CV is missing, greatly increasing your interview chances.",
      analysis: {
        title: "Keyword comparison",
        matchIndicator: "Weak - 2/5",
        jobRequirements: "Job requirements",
        presentKeywords: ["React", "JavaScript"],
        missingKeywords: ["TypeScript", "AWS", "Docker"],
        missingTitle: "Missing keywords",
        missingList: [
          "TypeScript",
          "AWS",
          "Docker"
        ],
        cta: "Add missing keywords now"
      }
    },
    massCV: {
      label: "APPLY QUICKLY",
      title: "Apply to 50+ jobs daily, no more manual CV editing hassle!",
      description: "Stop wasting time editing each CV individually. OkBuddy automatically customizes CVs to match each position, helping you apply faster and smarter.",
      cta: "Start mass applications",
      massApplication: {
        title: "Mass applications",
        subtitle: "Apply to multiple positions quickly with optimized CVs",
        jobs: [
          {
            title: "Frontend Developer at Zalo",
            match: "92%",
            cta: "Apply now"
          },
          {
            title: "React Developer at MoMo", 
            match: "88%",
            cta: "Optimize CV & apply"
          },
          {
            title: "Web Developer at NAB",
            match: "65%",
            cta: "Optimize CV & apply"
          }
        ]
      }
    },
    coverLetters: {
      label: "CREATE OUTSTANDING COVER LETTERS",
      title: "Good cover letters increase interview chances by 55%, but you're spending hours writing them?",
      description: "OkBuddy analyzes job descriptions, company culture, and your work history to create tailored cover letters in 30 seconds instead of 30 minutes, helping you stand out among hundreds of competing candidates!",
      coverLetterUI: {
        title: "Cover letter",
        subtitle: "Create customized cover letters instantly",
        greeting: "Dear Hiring Manager,",
        customization: "Applying for: Frontend Developer at Zalo",
        cta: "Create cover letter"
      }
    }
  },
  waitlist: {
    title: "Ready to transform how you job hunt?",
    description: "Join the priority list to be among the first to experience OkBuddy.",
    emailPlaceholder: "Enter your email",
    cta: "Join now"
  },
  testimonials: {
    title: "1000+ people have found their dream jobs with OkBuddy",
    items: [
      {
        name: "John Smith",
        role: "Software Engineer",
        content: "OkBuddy helped me get interviews at 3 top tech companies by optimizing my CV for ATS systems. The cover letter generator saved me hours of work!"
      },
      {
        name: "Sarah Johnson", 
        role: "Frontend Developer",
        content: "I was missing important keywords in my CV that caused automatic rejections. OkBuddy identified them and helped me perfectly adjust my profile."
      },
      {
        name: "Michael Brown",
        role: "Recent Graduate", 
        content: "As a fresh graduate, I struggled to get interviews. OkBuddy helped me apply to 30+ positions with customized CVs in just one day. I received 5 callback responses!"
      }
    ]
  },
  footer: {
    logo: "OkBuddy",
    description: "AI assistant helping you optimize CVs and find jobs more effectively.",
    links: {
      product: {
        title: "Product",
        items: ["Features", "Pricing", "FAQ"]
      },
      company: {
        title: "Company", 
        items: ["About", "Blog", "Contact"]
      },
      legal: {
        title: "Legal",
        items: ["Privacy Policy", "Terms of Service"]
      }
    },
    copyright: "© 2025 OkBuddy. All rights reserved."
  },
  resume: {
    preview: {
      name: "John Doe",
      role: "Software Engineer",
      experience: "Experience",
      skills: "Skills",
      skillsList: ["React", "JavaScript", "Node.js"]
    },
    aiSuggestions: {
      title: "AI Suggestions",
      subtitle: "Optimize CV for ATS systems",
      suggestions: [
        "Add \"Python\" to skills section",
        "Clarify your role in project X", 
        "Missing \"Cloud Computing\" keyword"
      ],
      cta: "Apply all suggestions"
    }
  }
}; 