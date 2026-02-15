export const cvUpload = {
  header: {
    title: "Optimize Resume in 5 minutes",
    subtitle: "OkBuddy will analyze and help you improve your resume, increasing interview chances",
    exitButton: "Exit",
    autoSaveStatus: "Auto-saved",
    userAvatar: "U",
    backToWorkspace: "← Back to Workspace"
  },
  progress: {
    step1: "Upload Resume & Job Description",
    step2: "Analyze & Evaluate Resume", 
    step3: "Apply Changes"
  },
  upload: {
    title: "Drag & drop resume or click to select",
    supportedFormats: "Supports PDF, DOCX • Max 10MB",
    uploadButton: "Upload your resume",
    privacyNote: "Data is secure and only used to analyze & optimize your resume",
    uploadSuccess: "✅ Upload successful",
    fileName: "Resume_JohnDoe_Frontend.pdf",
    fileSize: "2.3 MB",
    removeFile: "×"
  },
  jobDescription: {
    title: "Job Description",
    subtitle: "Applying for a specific position?",
    description: "Add job description to improve & optimize resume, gain advantage over other candidates",
    urlPlaceholder: "Paste JD link here",
    textPlaceholder: "Copy paste job description here...",
    characterCount: "247/2000",
    sampleText: "We are looking for an experienced Frontend Developer with React and TypeScript to join our product development team. Candidates should be able to work independently, have good logical thinking, and passion for technology..."
  },
  actions: {
    startAnalysis: "Start Analysis",
    createNewResume: "Create New Resume",
    analyzeDisabled: "Please upload your resume first"
  },
  errors: {
    unsupportedFormat: "Unsupported file format. Please upload PDF or DOCX file.",
    fileTooLarge: "File exceeds 10MB. Please choose a smaller file.",
    textTooLong: "Text too long, please shorten description (max 2000 characters).",
    uploadFailed: "File upload failed. Please try again.",
    invalidUrl: "Invalid URL"
  },
  loading: {
    analyzing: "Analyzing resume…",
    comparing: "Comparing with JD…", 
    applying: "Applying suggested changes…",
    loadingMessage: "Your resume is being analyzed by OkBuddy's most advanced AI",
    processingMessage: "We are comparing your resume with the job description and optimizing every detail"
  },
  template: {
    title: "Start from our template",
    subtitle: "Use a professional template optimized for ATS systems",
    description: "Begin with a professional template designed for ATS success",
    startButton: "Get Started",
    icon: "📄",
    atsCompliant: "✓ ATS Compliant",
    preview: {
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "0123456789",
      location: "United States",
      summary: "Lorem Ipsum"
    }
  },
  freshGraduate: {
    title: "Fresh graduate?",
    subtitle: "Create professional resume from scratch with step-by-step guidance",
    createButton: "Create resume from scratch",
    icon: "🎓"
  },
  divider: {
    text: "Or:"
  }
} as const 