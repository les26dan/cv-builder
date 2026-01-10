export const cvUpload = {
  header: {
    title: "Optimize CV in 5 minutes",
    subtitle: "OkBuddy will analyze and help you improve your CV, increasing interview chances",
    exitButton: "Exit",
    autoSaveStatus: "Auto-saved",
    userAvatar: "U",
    backToWorkspace: "← Back to Workspace"
  },
  progress: {
    step1: "Upload CV & Job Description",
    step2: "Analyze & Evaluate CV", 
    step3: "Apply Changes"
  },
  upload: {
    title: "Drag & drop CV or click to select",
    supportedFormats: "Supports PDF, DOCX • Max 10MB",
    uploadButton: "Upload your CV",
    privacyNote: "Data is secure and only used to analyze & optimize your CV",
    uploadSuccess: "✅ Upload successful",
    fileName: "CV_JohnDoe_Frontend.pdf",
    fileSize: "2.3 MB",
    removeFile: "×"
  },
  jobDescription: {
    title: "Job Description",
    subtitle: "Applying for a specific position?",
    description: "Add job description to improve & optimize CV, gain advantage over other candidates",
    urlPlaceholder: "Paste JD link here",
    textPlaceholder: "Copy paste job description here...",
    characterCount: "247/2000",
    sampleText: "We are looking for an experienced Frontend Developer with React and TypeScript to join our product development team. Candidates should be able to work independently, have good logical thinking, and passion for technology..."
  },
  actions: {
    startAnalysis: "Start Analysis",
    createNewCV: "Create New CV",
    analyzeDisabled: "Please upload your CV first"
  },
  errors: {
    unsupportedFormat: "Unsupported file format. Please upload PDF or DOCX file.",
    fileTooLarge: "File exceeds 10MB. Please choose a smaller file.",
    textTooLong: "Text too long, please shorten description (max 2000 characters).",
    uploadFailed: "File upload failed. Please try again.",
    invalidUrl: "Invalid URL"
  },
  loading: {
    analyzing: "Analyzing CV…",
    comparing: "Comparing with JD…", 
    applying: "Applying suggested changes…",
    loadingMessage: "Your CV is being analyzed by OkBuddy's most advanced AI",
    processingMessage: "We are comparing your CV with the job description and optimizing every detail"
  },
  freshGraduate: {
    title: "Fresh graduate?",
    subtitle: "Create professional CV from scratch with step-by-step guidance",
    createButton: "Create CV from scratch",
    icon: "🎓"
  }
} as const 