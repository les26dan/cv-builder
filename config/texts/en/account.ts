export const account = {
  // Common elements
  logo: "CV Builder",
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
    subtitle: "Create your CV Builder account",
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
      privacyLink: "privacy policy",
      linkSeparator: " and ",
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
    lastUpdated: "Last Updated: August 3, 2026",
    sections: [
      {
        title: "1. Acceptance of Terms",
        content: "By accessing or using CV Builder's website, application, or services (\"CV Builder\" or \"the Service\"), you signify that you have read and agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use CV Builder. Continued use of CV Builder after changes (see Section 8) means you accept the updated Terms. CV Builder is a CV preparation tool powered by Large Language Models (LLMs). We strive to comply with international laws, including Vietnam's data laws, Singapore/Thailand PDPA, and U.S. regulations like the CCPA, to make this service safe and accessible to everyone."
      },
      {
        title: "2. Accounts, Eligibility, and Third-Party Login",
        content: "To use CV Builder, you may need to create an account. You can sign up with an email and password or by using third-party login providers like Google or LinkedIn. If you choose a Google/LinkedIn login, you authorize CV Builder to access certain information from that account (for example, your name and email address). We use this information to set up and manage your CV Builder account in accordance with our Privacy Policy. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. Age Requirements: CV Builder is open to users of all ages, but if you are considered a minor in your country (for example, under 13 in the US, under 16 in Vietnam, or under 20 in Thailand), you must use CV Builder with the consent and supervision of a parent or legal guardian."
      },
      {
        title: "3. User Content and Intellectual Property",
        content: "Your Content: Using CV Builder often involves inputting your personal information, CV details, and other content (\"User Content\"). You retain ownership of your User Content – CV Builder does not claim ownership of the materials you submit. However, to provide our service, you grant CV Builder a license to use your content. This means you give us a non-exclusive, worldwide, royalty-free, perpetual right to use, copy, modify, create derivative works from, publish, and display your content solely for the purposes of operating, improving, and developing CV Builder. For example, we might use your CV inputs to format suggestions, to train or fine-tune our AI models, or to troubleshoot service issues. This license is only for providing and enhancing CV Builder – you continue to own your content and can delete it or request deletion as described in our Privacy Policy."
      },
      {
        title: "4. Permitted Uses and Conduct",
        content: "We aim to keep CV Builder a helpful and safe service for everyone. By using CV Builder, you agree to: • Use CV Builder only for its intended purpose of creating or improving CVs and related career materials. • Not misuse the Service. This means you will not attempt to hack, disrupt, or overload our systems; you will not use CV Builder to generate unlawful content or spam; and you will not reverse-engineer or otherwise attempt to extract source code or trade secrets from our software. • Respect others. Do not harass other users or our staff, and do not try to gain unauthorized access to others' accounts or data."
      },
      {
        title: "5. Third-Party Services and Links",
        content: "CV Builder may incorporate or link to third-party services. For example, as noted, you can log in via Google or LinkedIn, and CV Builder may integrate APIs from AI providers. Additionally, our site might contain links to external websites for job postings or resources as a convenience. Third-Party Account Data: If you link a third-party account, we will receive certain information from that account (such as your email and public profile info) and handle it according to our Privacy Policy. AI Providers: CV Builder uses LLMs (large language models) which may be provided by third parties. This means that when you ask CV Builder to review or draft text, your content might be securely transmitted to an AI service (for example, OpenAI or another AI platform) for processing."
      },
      {
        title: "6. Disclaimers and Limitations of Liability",
        content: "Service Provided \"AS-IS\": CV Builder is a new and evolving service. While we work hard to provide accurate, useful CV suggestions, we cannot guarantee any specific results (for example, we can't guarantee you'll get a job interview or that our AI outputs will be error-free). You agree that you use CV Builder at your own risk. The service is provided on an \"as is\" and \"as available\" basis, without warranties of any kind, either express or implied. No Advice: CV Builder's content (including AI-generated resume drafts or feedback) is for informational purposes and does not constitute professional career advice or guarantees. Always consider whether advice is appropriate for your situation."
      },
      {
        title: "7. Governing Law and Dispute Resolution",
        content: "CV Builder is used globally, so we strive to comply with laws in multiple jurisdictions. These Terms will be interpreted in accordance with general principles of fairness and the laws of the jurisdictions in which we operate, notably Vietnam, Singapore, Thailand, and applicable federal laws in the United States. If you are a consumer located in a country with mandatory consumer protection or data protection laws, those laws take precedence to the extent they conflict with these Terms."
      },
      {
        title: "8. Changes to These Terms",
        content: "We may update or modify these Terms of Service from time to time as our service evolves or laws change. If we make material changes, we will notify users by posting the updated Terms on our website and/or through a notice in the app or via email. The \"Effective Date\" at the top will indicate when changes become effective. Please check back periodically. Once new Terms are posted and effective, your continued use of CV Builder means you accept the revised Terms. If you do not agree to the changes, you should stop using CV Builder."
      }
    ]
  },

  // Privacy Policy page
  privacy: {
    title: "Privacy Policy",
    backButton: "← Back",
    lastUpdated: "Last Updated: August 3, 2026",
    sections: [
      {
        title: "1. Information We Collect",
        content: "We collect information to provide and improve CV Builder for you. This includes: • Information You Provide Directly: When you create an account or use CV Builder, you may give us personal information. For example: Account Details (your name, email address, and any profile information you choose to add), CV Content and Inputs (the content you input into CV Builder's CV builder, such as your work experience, education, skills, or any text you ask our AI to analyze), and Communications (if you contact us via support email). • Information from Linked Accounts: If you choose to link or log in through a third-party platform (e.g., Google or LinkedIn OAuth login), we collect information from that platform as needed to create or authenticate your account. • Usage Data and Analytics: We automatically collect data about how you interact with CV Builder, including usage information, device and technical data, and location information (we might infer your general location from your IP address)."
      },
      {
        title: "2. How We Use Your Information",
        content: "CV Builder uses your information to operate, improve, and personalize our services. Specifically, we use information for the following purposes: • To Provide the Service: We use your data to create and maintain your account, enable the CV-building features, generate AI-based suggestions, and provide customer support. • To Improve and Develop CV Builder: Your data helps us understand what's working and what's not. We may use your inputs and interactions to train and refine our AI models and algorithms. • Analytics: We analyze use of the Service to figure out overall trends and metrics. • Personalization: To enhance your experience, we may personalize certain content for you. • Communication: We use contact information to send necessary communications, product updates, and responses. • Security and Abuse Prevention: Information is used to keep CV Builder secure and prevent fraud, spam, or abuse."
      },
      {
        title: "3. How We Share Information",
        content: "We understand that your personal information is important. CV Builder is not in the business of selling personal data outright, and we share information only in the ways described below: • With Service Providers: We employ trusted third-party companies to help us operate CV Builder (cloud hosting, email services, analytics). • With AI Processing Partners: When you use an AI-driven feature, the relevant text may be sent to an AI service provider for processing. • With Affiliates and Business Partners: CV Builder might share data with its affiliates or in anonymized, aggregated form with partners for research purposes. • For Legal Reasons: We may disclose information if required by law or to protect rights and safety. • Business Transfers: If CV Builder is involved in a merger or acquisition, user information may be transferred. • With Your Consent: In cases where you have explicitly given us consent to share your information."
      },
      {
        title: "4. Data Storage and Security",
        content: "Storage Location: CV Builder primarily stores data on secure servers. Depending on where you are, your data might be stored in a different country. Security Measures: We use industry-standard technical and organizational measures to safeguard your personal information from loss, theft, misuse, and unauthorized access or disclosure. These measures include encryption of data in transit and at rest, firewalls and intrusion detection systems, and regular security audits. However, please note that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to protect your information, we cannot guarantee absolute security."
      },
      {
        title: "5. International Data Transfers",
        content: "CV Builder is accessible worldwide. Using our Service means your personal information may be transferred to and stored in servers located in countries other than your own. These countries may have different data protection laws than your home country. When we transfer personal data across borders, we take steps to safeguard it, including contractual protections, comparable safeguards, and your consent where required. By using CV Builder, you acknowledge that your data may be transferred to and processed in other countries as described, subject to these safeguards."
      },
      {
        title: "6. Your Rights and Choices",
        content: "We believe you should have control over your personal information. Depending on where you live, you may have some or all of the following data protection rights: • Access and Portability: You can request a copy of the personal data we hold about you. • Correction: If any personal data we have is incorrect or outdated, you have the right to request that we correct or update it. • Deletion: You can ask us to delete your personal data. • Withdrawal of Consent: If we are processing your personal data based on your consent, you have the right to withdraw that consent at any time. • Objection and Restriction: You may have the right to object to certain processing or request that we restrict processing of your data. • Automated Decision-Making: CV Builder does not make any legally significant decisions about you purely by algorithms without human involvement."
      },
      {
        title: "7. Children's Privacy",
        content: "CV Builder is not intended for young children without supervision. We do not knowingly collect personal information from anyone under the age required by law to provide consent. In general, users under 13 years old (or higher minimum age in certain regions) should only use CV Builder with a parent or guardian's permission. If you are a parent or guardian and you learn that your child under the relevant age has created an CV Builder account or provided personal information without your consent, please contact us. We will take prompt steps to delete the child's personal data from our systems."
      },
      {
        title: "8. Changes to This Privacy Policy",
        content: "We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, or legal requirements. If we make a significant change, we will notify you in an appropriate way – for example, by posting a prominent notice on our website or sending an email notification, and updating the \"Last updated\" date at the top. When we post changes to this Policy, if you continue to use CV Builder after the changes take effect, it means you accept the revised Policy."
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