export interface SectionFeedback {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  strengths: string[]
  improvements: string[]
  quickFix?: string
}

export interface CVFeedbackResult {
  overallScore: number
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  overallSummary: string
  sections: {
    contact: SectionFeedback
    summary: SectionFeedback
    experience: SectionFeedback
    skills: SectionFeedback
    education: SectionFeedback
  }
  topPriorities: string[]
  atsScore: number
  atsTips: string[]
}
