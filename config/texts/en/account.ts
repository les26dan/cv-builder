export const account = {
  // Common elements
  logo: "OkBuddy",
  nav: {
    feedback: "Feedback",
    features: "Features",
    pricing: "Pricing", 
    about: "About",
    login: "Log In",
    signup: "Sign Up"
  },

  // Register page
  register: {
    title: "Create Account",
    subtitle: "Create your OkBuddy account",
    social: {
      google: {
        button: "Sign up with Google",
        icon: "google"
      },
      linkedin: {
        button: "Sign up with LinkedIn",
        icon: "linkedin"
      },
      divider: "or"
    },
    form: {
      fullName: {
        label: "Full Name",
        placeholder: "Enter your full name"
      },
      email: {
        label: "Email",
        placeholder: "Enter your email"
      },
      password: {
        label: "Password",
        placeholder: "Enter password"
      },
      confirmPassword: {
        label: "Confirm Password",
        placeholder: "Re-enter password"
      },
      tosCheckbox: "I agree to the",
      tosLink: "terms of service",
      submitButton: "Sign Up",
      loading: "Processing...",
      signupLink: {
        text: "Already have an account?",
        link: "Sign in now"
      }
    }
  },

  // Login page
  login: {
    title: "Log In",
    subtitle: "Welcome back",
    social: {
      google: {
        button: "Continue with Google",
        icon: "google"
      },
      linkedin: {
        button: "Continue with LinkedIn",
        icon: "linkedin"
      },
      divider: "or"
    },
    form: {
      email: {
        label: "Email",
        placeholder: "Enter your email"
      },
      password: {
        label: "Password",
        placeholder: "Enter password"
      },
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      submitButton: "Log In",
      loading: "Processing...",
      signupLink: {
        text: "Don't have an account?",
        link: "Sign up now"
      }
    }
  },

  // CAPTCHA component
  captcha: {
    title: "Security Verification",
    answerLabel: "Answer:",
    placeholder: "Enter answer",
    loading: "Loading CAPTCHA...",
    refreshTooltip: "Refresh question",
    retryButton: "Try again",
    successMessage: "Verification successful",
    errors: {
      loadFailed: "Unable to load CAPTCHA. Please try again.",
      networkError: "Connection error. Please check your network and try again."
    }
  },

  // Terms of Service page
  terms: {
    title: "Terms of Service",
    backButton: "← Back",
    sections: [
      {
        title: "1. Privacy and Personal Data Protection",
        content: "OkBuddy is committed to absolutely protecting your personal information. All personal data you provide when using our platform will be strictly protected and stored internally at OkBuddy only. We absolutely do not share, sell, or disclose any of your personal information to third parties in any form, except in cases where specifically required by law."
      },
      {
        title: "2. User Privacy Rights",
        content: "You have the right to access, edit, and delete your personal information at any time. If you want to request access or changes to personal data, please contact us directly via email or OkBuddy's customer support system. We are committed to respecting and protecting user privacy throughout the service usage process."
      },
      {
        title: "3. Purpose and Scope of Information Collection",
        content: "Personal information collected from you will be used to support you in optimizing your job application profile, providing suitable job recommendations, and improving OkBuddy's service quality. Your data is only collected and processed within necessary scope, transparently and with clear consent from you."
      },
      {
        title: "4. Data Security Commitment",
        content: "We use the most advanced technologies and security measures to protect your personal data against unauthorized access, modification, or disclosure risks. All personal data is encrypted and secured according to international standards, ensuring your information is always safe and absolutely private."
      }
    ]
  },

  // Error messages
  errors: {
    required: "This field is required",
    invalidEmail: "Invalid email address",
    passwordMismatch: "Passwords do not match",
    captchaIncorrect: "Incorrect CAPTCHA answer",
    registrationFailed: "Registration failed. Please try again.",
    loginFailed: "Email or password is incorrect",
    incorrectPassword: "Email or password is incorrect",
    emailPasswordRequired: "Email and password are required",
    invalidEmailFormat: "Invalid email format",
    userNotFound: "No account found with this email",
    loginError: "Login failed. Please check your information.",
    rateLimitExceeded: "Too many login attempts. Please try again later",
    oauthCancelled: "Login was cancelled. Please try again.",
    oauthFailed: "Login failed. Please try again.",
    oauthInvalidGrant: "Invalid verification code. Please try again.",
    oauthRateLimit: "Too many requests. Please try again later.",
    oauthNetworkError: "Connection error. Please check your network and try again.",
    oauthGenericError: "An error occurred. Please try again later."
  },

  // Success messages
  success: {
    registrationComplete: "Registration successful! Please check your email to confirm your account.",
    loginComplete: "Login successful!",
    oauthRegistrationComplete: "Registration successful! Your account has been created.",
    oauthLoginComplete: "Login successful!"
  },

  // OAuth specific messages
  oauth: {
    loading: {
      redirecting: "Redirecting...",
      authenticating: "Authenticating...",
      processing: "Processing...",
      completing: "Completing login..."
    },
    messages: {
      cancelled: "Login was cancelled",
      failed: "Login failed",
      success: "Login successful",
      accountLinked: "Account linked successfully",
      accountCreated: "New account created"
    }
  }
}; 