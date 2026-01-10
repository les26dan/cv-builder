export const workspace = {
  header: {
    logo: 'OkBuddy',
    autosave: {
      saving: 'Saving...',
      saved: 'Auto-saved',
    },
    userAvatar: 'U', // Will be dynamically set based on user's first name
  },
  page: {
    title: 'My CVs',
    subtitle: 'Manage and optimize CVs for each job application',
    createButton: 'Create New CV',
  },
  empty: {
    title: 'You don\'t have any CVs yet!',
    subtitle: 'Get started by creating your first CV right now.',
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
      title: 'Confirm CV Deletion',
      message: 'Are you sure you want to delete this CV?',
      cancel: 'Cancel',
      confirm: 'Delete',
    },
  },
} as const 