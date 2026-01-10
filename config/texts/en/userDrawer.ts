export const userDrawer = {
  // User information section
  userInfo: {
    welcome: "Hello",
    email: "Email",
    role: {
      admin: "Administrator",
      user: "User"
    }
  },
  
  // Language toggle section
  language: {
    title: "Language",
    options: {
      vi: "Tiếng Việt",
      en: "English"
    },
    current: "Current"
  },
  
  // Actions section
  actions: {
    signOut: "Sign Out",
    profile: "Profile",
    settings: "Settings",
    admin: "Admin Panel"
  },
  
  // Navigation section
  navigation: {
    workspace: "CV Workspace",
    admin: "Admin Dashboard",
    landing: "Home"
  },
  
  // Confirmation messages
  confirmations: {
    signOut: "Are you sure you want to sign out?",
    languageChange: "Language will be changed after page reload"
  },
  
  // Status messages
  status: {
    signingOut: "Signing out...",
    changingLanguage: "Changing language..."
  }
} as const 