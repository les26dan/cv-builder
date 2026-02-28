# Statsig Analytics Integration for OkBuddy

## Overview

This document outlines the implementation of Statsig event tracking for the OkBuddy application, following the comprehensive event tracking specifications previously defined for Mixpanel but optimized for Statsig's architecture.

## 🚀 Key Features

### ✅ **Implemented**
- **Statsig SDK Integration**: Using `@statsig/js-client` for modern, lightweight tracking
- **Centralized Analytics Service**: Single service handling all event tracking
- **React Hooks**: Convenient hooks for component-level tracking
- **Device & Environment Detection**: Automatic collection of device, browser, OS info
- **Privacy-Compliant**: GDPR-friendly data collection practices
- **Event Queuing**: Offline support with event batching
- **Integration with Existing Monitoring**: Works alongside current monitoring.ts system

### 🎯 **Event Categories Implemented**

1. **Landing Page Events**
   - Page views with detailed context
   - Section visibility tracking (Intersection Observer)
   - CTA click tracking with coordinates
   - Scroll depth milestones (25%, 50%, 75%, 100%)
   - Exit intent detection

2. **Authentication Events**
   - Login/Register page views
   - Form interaction tracking
   - OAuth flow tracking
   - Success/failure events

3. **User Journey Events**
   - Cross-page navigation
   - Session tracking
   - Conversion funnels

## 🏗️ Architecture

### Core Components

```
├── config/statsig.ts              # Statsig configuration & event definitions
├── shared/services/analyticsService.ts # Main analytics service (singleton)
├── hooks/useAnalytics.ts          # React hooks for easy tracking
└── docs/STATSIG_ANALYTICS_INTEGRATION.md # This documentation
```

### Event Naming Convention

Following Statsig best practices, events use descriptive names:

- **Format**: `{category}_{action}_{context}`
- **Examples**:
  - `page_viewed_landing`
  - `cta_clicked_hero_section`
  - `section_viewed_problem_ats`
  - `conversion_completed_cv_creation`

## 🔧 Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# Statsig Configuration
NEXT_PUBLIC_STATSIG_CLIENT_KEY=client-xxxxxxxxxxxxx
NEXT_PUBLIC_STATSIG_ENABLED=true

# Optional: for staging/development
NODE_ENV=development
```

### Statsig Dashboard Setup

1. **Create Statsig Account**: Visit [statsig.com](https://statsig.com)
2. **Get Client Key**: From your Statsig dashboard
3. **Configure Events**: Events will automatically appear in your dashboard

## 📊 Event Properties

### Base Properties (Included with Every Event)

```typescript
interface BaseEventProperties {
  // Device & Environment
  device_type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  browser_version: string
  operating_system: string
  os_version: string
  screen_resolution: string
  viewport_size: string
  
  // Location & Language
  language: 'vi' | 'en'
  country: string
  city?: string
  
  // App Context
  app_version: string
  environment: 'production' | 'staging' | 'development'
  session_id: string
  timestamp: string
  
  // User Context
  user_id?: string
  is_authenticated: boolean
  user_type?: 'new' | 'returning'
  
  // Page Context
  page_url: string
  referrer_url?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}
```

## 🎯 Implementation Examples

### Page View Tracking

```typescript
import { usePageView } from '@/hooks/useAnalytics';

export default function MyPage() {
  usePageView('my_page', {
    page_section: 'dashboard',
    user_plan: 'free'
  });
  
  return <div>...</div>;
}
```

### CTA Click Tracking

```typescript
import { useCTATracking } from '@/hooks/useAnalytics';

export default function HeroSection() {
  const trackCTA = useCTATracking();
  
  const handleClick = (event: React.MouseEvent) => {
    trackCTA('Try Free Now', 'hero_section', {
      clickEvent: event,
      time_on_page: Date.now() - performance.timeOrigin
    });
  };
  
  return <button onClick={handleClick}>Try Free Now</button>;
}
```

### Section Visibility Tracking

```typescript
import { useSectionTracking } from '@/hooks/useAnalytics';

export default function ProblemSection() {
  const sectionRef = useSectionTracking('Problem ATS', 0.5, {
    section_position: 2,
    problem_type: 'ats_optimization'
  });
  
  return <section ref={sectionRef}>...</section>;
}
```

### Form Tracking

```typescript
import { useFormTracking } from '@/hooks/useAnalytics';

export default function LoginForm() {
  const { trackFormStart, trackFormComplete, trackFormError } = useFormTracking('login');
  
  const handleSubmit = async (data) => {
    try {
      await loginUser(data);
      trackFormComplete({ login_method: 'email' });
    } catch (error) {
      trackFormError('invalid_credentials', error.message);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 🔄 Migration from Existing System

### Backward Compatibility

The new system works alongside the existing `monitoring.ts` system:

```typescript
// Both systems track the same event
analytics.track('user_logged_in', properties); // New Statsig system
monitoring.analytics.track('user_logged_in', properties); // Existing system
```

### Gradual Migration

1. **Phase 1**: Landing page events ✅
2. **Phase 2**: Authentication events 🔄
3. **Phase 3**: CV Workspace events 📋
4. **Phase 4**: Upload & Editing events 📋
5. **Phase 5**: Complete migration 📋

## 📈 Benefits Over Previous System

### Statsig Advantages

1. **Modern SDK**: Faster, smaller bundle size
2. **Real-time Dashboard**: Immediate event visibility
3. **Feature Flags**: Built-in A/B testing capabilities
4. **Better Performance**: Optimized event batching
5. **Privacy Compliance**: GDPR-friendly by design

### Performance Optimizations

- **Event Batching**: Groups events for efficient network usage
- **Offline Support**: Queues events when offline
- **Lazy Loading**: Analytics service loads asynchronously
- **Memory Efficient**: Automatic cleanup of old event data

## 🔍 Debugging & Testing

### Development Mode

In development, events are logged to console:

```javascript
[ANALYTICS] page_viewed_landing: {
  device_type: "desktop",
  browser: "Chrome",
  language: "en",
  // ... other properties
}
```

### Debug Information

```typescript
import { analytics } from '@/shared/services/analyticsService';

// Get debug info
const debugInfo = analytics.getDebugInfo();
console.log(debugInfo);
```

## 🚨 Important Notes

### Privacy Compliance

- **No Personal Data**: User IDs are anonymized
- **IP Masking**: IP addresses are masked for privacy
- **Cookie Consent**: Respects user consent preferences
- **Data Retention**: Follows GDPR guidelines

### Performance Considerations

- **Bundle Size**: Adds ~15KB to total bundle
- **Network Usage**: Batched requests every 5 seconds
- **Memory Usage**: Automatic cleanup prevents memory leaks

## 📋 Next Steps

1. **Complete Authentication Events**: Finish login/register tracking
2. **CV Workspace Events**: Implement CV management tracking
3. **Upload & Analysis Events**: Track file upload and processing
4. **Guided Editing Events**: Track CV editing interactions
5. **A/B Testing Setup**: Configure feature flags for experiments

## 🔗 Resources

- [Statsig Documentation](https://docs.statsig.com/)
- [Statsig JavaScript SDK](https://docs.statsig.com/client/javascript-sdk)
- [Event Tracking Best Practices](https://docs.statsig.com/guides/logging-events)

---

*This integration follows OkBuddy's development tenets: maximizing learning through data collection, enabling rapid experimentation, and maintaining modular, replaceable architecture.*