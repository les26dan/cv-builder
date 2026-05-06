/**
 * English Feedback Text Configuration
 * Following CV Builder Tenet 9: Centralized text management
 */

export const feedback = {
  title: 'Feedback',
  buttonLabel: 'Feedback',
  description: 'Share your thoughts, suggestions, or report bugs to help us make CV Builder better.',
  
  form: {
    feedbackLabel: 'Feedback content',
    feedbackRequired: '*',
    feedbackPlaceholder: 'Share your thoughts about CV Builder...',
    
    emailLabel: 'Email',
    emailOptional: '(optional)',
    emailLoggedIn: '(logged in)',
    emailPlaceholder: 'email@example.com',
    emailHelp: 'Leave your email if you want us to respond.',
    emailHelpLoggedIn: 'We will respond via this email if needed.',
    
    characterCount: 'characters',
    overLimit: 'Exceeds limit by',
    characterLimit: '5000'
  },
  
  buttons: {
    cancel: 'Cancel',
    submit: 'Send feedback',
    submitting: 'Sending...'
  },
  
  success: {
    title: 'Thank you for your feedback!',
    message: 'We will review and respond as soon as possible.'
  },
  
  validation: {
    required: 'Please enter feedback content',
    tooLong: 'Content cannot exceed 5000 characters',
    emailInvalid: 'Invalid email format'
  },
  
  aria: {
    closeButton: 'Close feedback',
    feedbackButton: 'Send feedback'
  }
} as const;