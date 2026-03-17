export const workspace = {
  header: {
    logo: 'OkBuddy',
    autosave: {
      saving: 'Saving...',
      saved: 'Auto-saved',
      error: 'Save error',
      offline: 'Offline mode',
      guestWarning: 'Your progress is not saved. Log in to save now',
    },
    userAvatar: 'U', // Will be dynamically set based on user's first name
  },
  page: {
    title: 'My Resumes',
    subtitle: 'Manage and optimize resumes for each job application',
    createButton: 'Create New Resume',
  },
  empty: {
    title: 'You don\'t have any resumes yet!',
    subtitle: 'Get started by creating your first resume right now.',
    cta: 'Get Started',
  },
  cvCard: {
    status: {
      inProgress: 'IN PROGRESS',
      completed: 'COMPLETED',
      new: 'JUST STARTED',
    },
    actions: {
      continue: 'Continue',
      edit: 'Edit',
      download: 'Download',
      delete: 'Delete',
    },
    lastUpdated: {
      prefix: 'Last updated:',
      minutes: (n: number) => `${n} minutes ago`,
      hours: (n: number) => `${n} hours ago`,
      days: (n: number) => `${n} days ago`,
      weeks: (n: number) => `${n} weeks ago`,
      years: 'Over 1 year ago',
    },
    score: (score: number) => `${score}%`,
  },
  modals: {
    deleteConfirm: {
      title: 'Confirm Resume Deletion',
      message: 'Are you sure you want to delete this resume?',
      cancel: 'Cancel',
      confirm: 'Delete',
    },
  },
} as const 