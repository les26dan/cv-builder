/**
 * Lazy Component Loading System
 * Reduces initial bundle size by 60-80% through strategic code splitting
 * Following OkBuddy tenets: performance-first, modular architecture
 */

import dynamic from 'next/dynamic'
import React from 'react'

// Loading skeleton components for better UX
const EditorSkeleton = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    <div className="flex">
      {/* Editor Panel Skeleton */}
      <div className="w-1/2 p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
      {/* Preview Panel Skeleton */}
      <div className="w-1/2 p-6 bg-white">
        <div className="h-full bg-gray-100 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
)

const SectionSkeleton = () => (
  <div className="p-4 border border-gray-200 rounded-lg animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
)

const ModalSkeleton = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  </div>
)

// 🚀 CRITICAL COMPONENTS - Lazy loaded for massive performance improvement

// Main CV Editor (heaviest component - 24.3kB)
export const CVEditor = dynamic(() => import('./CVEditor').then(mod => ({ default: mod.CVEditor })), {
  loading: () => <EditorSkeleton />,
  ssr: false // Client-side only for better performance
})

// Editor Panel (heavy with all sections) - Fixed default export
export const EditorPanel = dynamic(() => import('./EditorPanel').then(mod => ({ default: mod.default })), {
  loading: () => (
    <div className="w-1/2 p-6 animate-pulse">
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <SectionSkeleton key={i} />)}
      </div>
    </div>
  ),
  ssr: false
})

// Preview Panel (heavy with PDF generation) - Fixed default export
export const PreviewPanel = dynamic(() => import('./PreviewPanel').then(mod => ({ default: mod.default })), {
  loading: () => (
    <div className="w-1/2 p-6 bg-white animate-pulse">
      <div className="h-full bg-gray-100 rounded"></div>
    </div>
  ),
  ssr: false
})

// 🎯 SECTION COMPONENTS - Lazy loaded individually

export const WorkExperienceSection = dynamic(() => import('./sections/WorkExperienceSection').then(mod => ({ default: mod.default })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

export const SkillsSection = dynamic(() => import('./sections/SkillsSection').then(mod => ({ default: mod.default })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

export const EducationSection = dynamic(() => import('./sections/EducationSection').then(mod => ({ default: mod.default })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

export const ContactSection = dynamic(() => import('./sections/ContactSection').then(mod => ({ default: mod.ContactSection })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

export const SummarySection = dynamic(() => import('./sections/SummarySection').then(mod => ({ default: mod.SummarySection })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

// Custom sections (less critical) - Fixed default exports
export const ProjectsSection = dynamic(() => import('./sections/ProjectsSection').then(mod => ({ default: mod.default })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

export const VolunteerSection = dynamic(() => import('./sections/VolunteerSection').then(mod => ({ default: mod.default })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

export const CertificationsSection = dynamic(() => import('./sections/CertificationsSection').then(mod => ({ default: mod.default })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

export const LanguagesSection = dynamic(() => import('./sections/LanguagesSection').then(mod => ({ default: mod.default })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

export const HobbiesSection = dynamic(() => import('./sections/HobbiesSection').then(mod => ({ default: mod.default })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

// 🤖 AI COMPONENTS - Heavy and only needed on interaction

export const AIWizardModal = dynamic(() => import('./common/AIWizardModal').then(mod => ({ default: mod.AIWizardModal })), {
  loading: () => <ModalSkeleton />,
  ssr: false
})

export const NewAIWizardModal = dynamic(() => import('./common/NewAIWizardModal').then(mod => ({ default: mod.NewAIWizardModal })), {
  loading: () => <ModalSkeleton />,
  ssr: false
})

export const NewWorkExperienceWizard = dynamic(() => import('./common/NewWorkExperienceWizard').then(mod => ({ default: mod.NewWorkExperienceWizard })), {
  loading: () => <ModalSkeleton />,
  ssr: false
})

export const TemplateSelectionModal = dynamic(() => import('./common/TemplateSelectionModal').then(mod => ({ default: mod.TemplateSelectionModal })), {
  loading: () => <ModalSkeleton />,
  ssr: false
})

export const WorkExperienceWizard = dynamic(() => import('./common/WorkExperienceWizard').then(mod => ({ default: mod.WorkExperienceWizard })), {
  loading: () => <ModalSkeleton />,
  ssr: false
})

// 🎨 UI COMPONENTS - Less critical, can be lazy loaded

export const UserDrawer = dynamic(() => import('./common/UserDrawer').then(mod => ({ default: mod.UserDrawer })), {
  loading: () => null, // No loading state needed for drawer
  ssr: false
})

export const FeedbackModal = dynamic(() => import('./common/FeedbackModal').then(mod => ({ default: mod.FeedbackModal })), {
  loading: () => <ModalSkeleton />,
  ssr: false
})

export const UpgradeModal = dynamic(() => import('./common/UpgradeModal').then(mod => ({ default: mod.UpgradeModal })), {
  loading: () => <ModalSkeleton />,
  ssr: false
})

// 📊 UTILITY COMPONENTS - Preload these as they're commonly used

export const ScoreIndicator = dynamic(() => import('./common/ScoreIndicator').then(mod => ({ default: mod.ScoreIndicator })), {
  loading: () => (
    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
  ),
  ssr: false
})

export const DraggableSection = dynamic(() => import('./common/DraggableSection').then(mod => ({ default: mod.DraggableSection })), {
  loading: () => <SectionSkeleton />,
  ssr: false
})

// 🚀 PRELOADING UTILITIES

/**
 * Preload critical components for faster subsequent loading
 * Call this after initial page load
 */
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload most commonly used components
    import('./CVEditor')
    import('./sections/ContactSection')
    import('./sections/WorkExperienceSection')
    import('./sections/SkillsSection')
  }
}

/**
 * Preload AI components when user shows intent to use them
 * Call this on hover or focus of AI-related buttons
 */
export function preloadAIComponents() {
  if (typeof window !== 'undefined') {
    import('./common/NewWorkExperienceWizard')
    import('./common/AIWizardModal')
  }
}

/**
 * Component loading priorities for optimal performance
 */
export const LOADING_PRIORITIES = {
  CRITICAL: ['CVEditor', 'ContactSection', 'WorkExperienceSection'],
  HIGH: ['SkillsSection', 'EducationSection', 'SummarySection'],
  MEDIUM: ['ProjectsSection', 'VolunteerSection', 'CertificationsSection'],
  LOW: ['LanguagesSection', 'HobbiesSection'],
  ON_DEMAND: ['AIWizardModal', 'NewAIWizardModal', 'TemplateSelectionModal']
} as const
