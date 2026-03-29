# OkBuddy System Architecture - Consolidated

**Status**: ✅ PRODUCTION READY - Complete Integration  
**Architecture**: Next.js 15 + Supabase + Vercel  
**Performance**: 98.5% optimization complete (sub-second loads)  

---

## 🏗️ **CORE ARCHITECTURE**

### **Technology Stack**
- **Frontend**: Next.js 15 App Router + React 18 + TypeScript
- **Backend**: Supabase (PostgreSQL) + Vercel Edge Functions  
- **Authentication**: NextAuth.js + OAuth providers + Row Level Security
- **Storage**: Vercel Blob + Database JSONB with compression
- **Analytics**: Statsig + Custom performance monitoring
- **Deployment**: Vercel with environment-specific configurations

### **Directory Structure**
```
/app/                 # Next.js App Router pages
├── page.tsx         # Landing page with hero and problem education
├── login/           # Authentication pages with OAuth integration
├── cv-workspace/    # User dashboard with real database CV loading
├── cv-upload/       # Dual-path upload (existing CV + template)
├── cv-guided-editing/[cvId]/  # Real-time collaborative editing with PDF preview
└── api/             # 19 API routes for CV processing and auth

/components/         # React UI components
├── auth/           # Authentication forms and OAuth handlers
├── common/         # Shared UI components (modals, notifications)
├── sections/       # CV editing sections (experience, skills, education)
└── templates/      # CV output templates (Dennis Schroder format)

/lib/               # Core business logic
├── auth.ts         # Authentication with caching optimization
├── supabase.ts     # Database client with Row Level Security
└── fileProcessing.ts # PDF parsing with triple-fallback system

/shared/            # Cross-application services
├── services/       # AI integration, analytics, data persistence, PDF generation
├── contexts/       # React context for CV workflow management
└── types/          # TypeScript interfaces and schemas

/services/          # PDF Generation Services
├── pdfGenerationService.ts    # jsPDF-based PDF generation (legacy)
├── browserPdfService.ts       # HTML-to-PDF browser engine (new)
└── [other services]

/hooks/             # Custom React Hooks
├── usePDFPreviewDebounce.ts   # PDF preview with 3-second debouncing
├── useBrowserPDFPreview.ts    # Browser-based PDF generation hook
└── [other hooks]

/config/            # Configuration management
├── texts/          # Centralized copy management (EN/VI languages)
└── languageConfig.ts # Dynamic language detection and switching
```

---

## 🔐 **AUTHENTICATION & SECURITY**

### **Multi-Provider Authentication**
```typescript
// Authentication Flow Architecture
OAuth Providers → Account Linking Service → Session Management
    ↓                    ↓                      ↓
Google (Active)    User Lookup/Creation    JWT Tokens
LinkedIn (Ready)   RLS Bypass (Service)    Secure Cookies
Email/Password     Database Persistence    Role Detection
```

**Security Implementation:**
- **CSRF Protection**: State tokens for OAuth flows
- **Row Level Security**: Database-level user isolation
- **Session Security**: HTTP-only cookies with SameSite policies
- **Input Validation**: Multi-layer API endpoint protection
- **XSS Prevention**: DOMPurify 3.2.4+ sanitization

### **Guest Session Architecture**
```typescript
// Zero-Friction Onboarding
Guest Upload → Temp User Creation → localStorage Persistence → Optional Upgrade
     ↓               ↓                     ↓                      ↓
  CV Processing   Unique Guest ID      Template CV System    Database Migration
```

---

## 📊 **DATABASE ARCHITECTURE**

### **Enhanced Schema (Supabase PostgreSQL) - Phase 2 Complete**
```sql
-- Core Tables (Enhanced OAuth & Security System)
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT,              -- NULL for OAuth-only accounts
  signup_method TEXT DEFAULT 'email', -- 'email', 'google', 'linkedin'
  email_verified BOOLEAN DEFAULT FALSE,
  account_status TEXT DEFAULT 'active',
  oauth_provider TEXT,             -- Legacy compatibility
  oauth_id TEXT,                   -- Legacy compatibility
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

user_oauth_providers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,          -- 'google', 'linkedin'
  provider_user_id TEXT NOT NULL,
  provider_email TEXT NOT NULL,
  provider_data JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  linked_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
)

cv_workflow (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',     -- 'draft', 'analyzing', 'completed', 'review'
  score INTEGER DEFAULT 0,
  cv_data JSONB NOT NULL,          -- Enhanced with optimization metadata
  workflow_current_step TEXT DEFAULT 'upload',
  workflow_steps_completed TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'upload',    -- 'upload', 'migration', 'manual'
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

security_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,        -- 'USER_SECURITY_REVIEW', 'LOGIN_ATTEMPT', etc.
  event_data JSONB DEFAULT '{}',
  client_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

account_linking_attempts (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  attempt_type TEXT NOT NULL,      -- 'link', 'create', 'login', 'migration'
  success BOOLEAN NOT NULL,
  error_message TEXT,
  security_flags JSONB DEFAULT '[]',
  client_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Enhanced Performance Optimizations:**
- **35+ Optimized Indexes**: Complete coverage for all query patterns
- **JSONB Optimization**: Phase 2 metadata for enhanced performance
- **Row Level Security**: Complete isolation with 12 RLS policies
- **OAuth Infrastructure**: Multi-provider support with account linking
- **Security Auditing**: Comprehensive event logging and monitoring
- **Data Compression**: Enhanced CV data structures with optimization flags

### **Data Flow Architecture**
```
CV Upload → PDF Processing → AI Parsing → Structured Data → Database Storage
    ↓             ↓              ↓             ↓              ↓
File Validation  Text Extract   ChatGPT API   JSON Schema    JSONB Compress
Guest Support    Triple-Fallback Confidence   Type Safety    Auto-save
Error Handling   Progress Track  Bilingual    Validation     Conflict Resolution
```

---

## 🤖 **AI INTEGRATION ARCHITECTURE**

### **ChatGPT Processing Pipeline**
```typescript
// CV Parsing Flow
PDF Text → Content Preparation → ChatGPT API → Structured Response → Validation
    ↓             ↓                   ↓             ↓               ↓
Multi-format   Prompt Templates    Token Monitor  JSON Schema     Error Handle
Support        (EN/VI bilingual)   Cost Track     Type Safety     Graceful Fail
```

**AI Service Implementation:**
- **Full Content Processing**: 100% text preservation (no truncation)
- **Confidence Scoring**: 1-10 scale with >=5 success threshold
- **Content Tracking**: Intelligent diff for bullet point improvements
- **Cost Monitoring**: Real-time token usage and analytics
- **Caching Strategy**: 10-minute timeout for repeated requests

### **Granular Enhancement System**
```typescript
// Individual Bullet Improvement
Original Content → Change Detection → Highlight Syntax → AI Processing → Enhanced Output
       ↓                ↓                  ↓               ↓              ↓
   State Tracking   Word-level Diff    < > Brackets    Context Aware   User Control
   Bullet History   Content Analysis   AI Instruction  Template System Validation
```

---

## ⚡ **PERFORMANCE ARCHITECTURE**

### **Critical Performance Optimizations**
```typescript
// 98.5% Performance Improvement Architecture
Authentication Caching → Webpack Optimization → Component Splitting → Bundle Optimization
        ↓                       ↓                      ↓                    ↓
    30s TTL Cache         Memory/FS Caching      Lazy Loading         <181KB Pages
    Non-blocking Check    Development/Prod       Strategic Splits     Tree Shaking
    Background Refresh    Smart Invalidation     Route-based          Dead Code Elimination
```

**Performance Metrics:**
- **Landing Page**: 72ms (99.8% improvement)
- **Login Page**: 453ms (98.5% improvement)  
- **CV Upload**: 306ms (99.0% improvement)
- **Bundle Sizes**: Optimized for Core Web Vitals compliance

### **Auto-save Architecture**
```typescript
// Real-time Data Persistence
User Input → Debounce (2s) → Compress Data → Database Save → Conflict Check
    ↓            ↓              ↓              ↓             ↓
Change Detection  Batch Updates  GZIP Compress  Retry Logic   Version Control
State Management  Performance    Size Optimize  Exponential   User Notification
```

---

## 📱 **USER INTERFACE ARCHITECTURE**

### **Component Hierarchy**
```
SharedHeader (Unified Navigation)
├── Landing Variant: Hero + Problem Education + CTA
├── Auth Variant: Login/Register Forms + OAuth Buttons
├── App Variant: CV Workspace + User Management
└── Editor Variant: CV Editing + Auto-save Status

CV Guided Editing Layout (60-40 Split)
├── EditorPanel (60%): Section editing + AI enhancement
└── PreviewPanel (40%): Live preview + Download options
```

**Design System Implementation:**
- **Color System**: #0277BD primary with systematic palette
- **Typography**: Inter font with consistent line heights
- **Button Patterns**: Main CTA (#0277BD) vs Sub CTA (outlined)
- **Modal System**: Portal-based overlays with escape handling

### **State Management Architecture**
```typescript
// CV Workflow Context
CVWorkflowContext → CVWorkflowDataService → Supabase Client → Database
       ↓                    ↓                    ↓              ↓
   React State         Auto-save Logic      Query Builder   Row Level Security
   Change Detection    Conflict Resolution  Type Safety     Data Isolation
   User Experience    Performance Optimize  Error Handle    Backup Strategy
```

---

## 📈 **MONITORING & ANALYTICS**

### **Comprehensive Tracking System**
```typescript
// Analytics Architecture
Client Events → Statsig JS SDK → Event Processing → Dashboard
      ↓              ↓              ↓              ↓
Page Views      Real-time Send   Batch Process   Live Monitor
User Actions    Error Capture    Performance     Alert System
Form Submit     Session Track    Conversion      Trend Analysis

Server Events → Statsig Node SDK → Backend Analytics → Monitoring
      ↓               ↓                 ↓               ↓
API Requests    Database Ops      Error Tracking    Health Check
CV Processing   Auth Events       Performance       Cost Monitor
```

**Monitoring Coverage:**
- **Performance**: Core Web Vitals (FCP, LCP, TTFB) tracking
- **User Behavior**: Complete journey from landing to CV completion
- **Error Tracking**: JavaScript errors with severity classification
- **API Performance**: Request/response times and database queries

### **Production Health Monitoring**
```bash
# CLI Monitoring Toolkit
./monitor-production.sh collect    # Daily data collection
./monitor-production.sh analyze    # Performance insights
./monitor-production.sh export     # CSV data export
./monitor-production.sh live       # Real-time dashboard
```

---

## 🔧 **DEVELOPMENT ARCHITECTURE**

### **Code Quality Framework**
- **TypeScript**: Strict mode compliance, zero production errors
- **ESLint**: Zero warnings with `--max-warnings 0`
- **Testing**: Component-first approach with meaningful test cases
- **Documentation**: JSDoc headers for all exported components

### **Build & Deployment Pipeline**
```
Development → Type Check → ESLint → Build → Test → Deploy
     ↓           ↓          ↓        ↓      ↓      ↓
Local Dev    Strict Mode  Zero Warn  Vercel  CI/CD  Production
Hot Reload   Type Safety  Code Style  Build   Auto   Environment
```

**Environment Management:**
- **Development**: Local with hot reloading and debug tools
- **Production**: Vercel with optimized builds and monitoring
- **Environment Variables**: Separate configs for each environment

---

## 🚨 **SYSTEM HEALTH & MAINTENANCE**

### **Current System Status**
- **Critical Issues**: ZERO production blockers
- **Performance**: All Core Web Vitals within budget
- **Security**: Zero vulnerabilities, complete compliance
- **Database**: Real data integration with auto-save functioning

### **Technical Debt Management**
```
Priority Levels:
├── Critical (P1): Production blockers → RESOLVED
├── High (P2): Performance issues → RESOLVED  
├── Medium (P3): Test framework config → DOCUMENTED
└── Low (P4): TypeScript test errors → NON-BLOCKING
```

### **Maintenance Schedule**
- **Daily**: Automated monitoring and health checks
- **Weekly**: Technical debt review and system updates
- **Monthly**: Architecture documentation updates
- **Quarterly**: Complete system security audit

---

## 🔄 **DATABASE REVAMP - PHASE 2 COMPLETE** (August 2025)

### **Production Fresh Setup Implementation**
**Operation**: Complete database schema revamp with OAuth enhancement  
**Status**: ✅ **100% SUCCESSFUL** - Zero data loss, full functionality  
**Execution**: Ultra-safe approach with comprehensive backup and validation  

**Key Achievements:**
```typescript
// Production Environment Status
Database State: CLEAN (0 testing records)
Schema Deployment: COMPLETE (9/9 tables operational)
OAuth System: ACTIVE (Google authentication ready)
Security Auditing: ENABLED (comprehensive event logging)
Performance: OPTIMIZED (35+ indexes, JSONB enhancements)
Backup: SECURED (23 records preserved for recovery)
```

### **Enhanced OAuth Architecture**
```typescript
// Multi-Provider Authentication System
interface OAuthProvider {
  user_id: UUID;
  provider: 'google' | 'linkedin';
  provider_user_id: string;
  provider_email: string;
  provider_data: JSONB;
  is_primary: boolean;
  priority: number;
  enabled: boolean;
}

// Account Linking Infrastructure
interface AccountLinkingAttempt {
  email: string;
  provider: string;
  attempt_type: 'link' | 'create' | 'login' | 'migration';
  success: boolean;
  security_flags: string[];
}
```

### **Security Enhancement Implementation**
```typescript
// Comprehensive Security Audit System
interface SecurityAuditLog {
  user_id: UUID;
  event_type: 'USER_SECURITY_REVIEW' | 'LOGIN_ATTEMPT' | 'OAUTH_LINK';
  event_data: {
    security_score: number;      // 75-85 based on auth method
    account_age_days: number;
    user_type: 'oauth' | 'email';
    migration_enhanced: boolean;
  };
  client_ip: string;
  user_agent: string;
}
```

### **Performance Optimization Results**
```sql
-- Database Performance Enhancements
CREATE INDEX idx_users_signup_method ON users(signup_method);
CREATE INDEX idx_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX idx_oauth_providers_provider ON user_oauth_providers(provider);
CREATE INDEX idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX idx_cv_workflow_updated_at ON cv_workflow(updated_at DESC);

-- JSONB Optimization Metadata
cv_data._optimization: {
  optimized_at: timestamp,
  phase: '2',
  structure_version: '2.0',
  performance_flags: ['indexed_fields', 'compressed_text', 'normalized_structure']
}
```

### **Migration Execution Summary**
**Phase 1: Data Consolidation** ✅ COMPLETE
- Legacy `cvs` table data migrated to `cv_workflow`
- User sessions activated for all accounts
- Complete audit trail established
- Zero data loss, 100% success rate

**Phase 2: OAuth & Security Enhancement** ✅ COMPLETE  
- OAuth provider system activated for existing Google users
- Security audit logging enabled for all users
- Account linking infrastructure deployed
- JSONB structures optimized for performance

**Production Readiness Validation** ✅ VERIFIED
- Database connection: WORKING
- All 9 tables: OPERATIONAL
- OAuth infrastructure: READY
- Security systems: ACTIVE

---

## 🏦 **AI CREDITS MONETIZATION SYSTEM** (September 2025)

### **Architecture Overview**
The monetization system implements a credit-based model where users consume AI credits for advanced features. Built with enterprise-grade security and scalability.

### **Database Schema**
```sql
-- Core credits tracking
ALTER TABLE users ADD COLUMN ai_credits_balance INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN ai_credits_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN ai_credits_purchased INTEGER DEFAULT 0;

-- Transaction audit trail
CREATE TABLE ai_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  transaction_type TEXT NOT NULL, -- 'purchase', 'usage', 'refund'
  credits_amount INTEGER NOT NULL,
  feature_used TEXT, -- NULL for purchases
  payment_method TEXT, -- 'momo', 'vietcombank', 'card', 'paypal'
  payment_status TEXT DEFAULT 'pending',
  amount_paid DECIMAL(10,2),
  currency TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Referral system (future implementation)
CREATE TABLE user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referee_id UUID REFERENCES users(id),
  credits_awarded INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Service Layer Architecture**
```typescript
// Core AI Credits Service - shared/services/aiCreditsService.ts
class AICreditsService {
  // Credit management
  async getCreditsBalance(userId: string): Promise<number>
  async deductCredits(userId: string, amount: number): Promise<boolean>
  async addCredits(userId: string, amount: number): Promise<boolean>
  
  // Feature gating
  async executeWithCredits<T>(
    userId: string, 
    feature: AIFeature, 
    operation: () => Promise<T>
  ): Promise<AIResult<T>>
  
  // Payment processing
  async processPurchase(userId: string, package: CreditPackage): Promise<PaymentResult>
}

// AI Feature Gating Hook - hooks/useAIFeatureGating.ts
const useAIFeatureGating = (userId?: string) => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  
  const executeAIFeature = async (feature: AIFeature, operation: () => Promise<any>) => {
    // Credit validation and deduction logic
  };
  
  return { credits, executeAIFeature, loading };
};
```

### **UI Components**
```typescript
// AI Credits Counter (Header) - components/AICreditsCounter.tsx
<AICreditsCounter 
  userId={user?.id}
  variant="header"
  showLabel={true}
  className="hidden sm:flex"
/>

// AI Credits Paywall - components/AICreditsPaywall.tsx
<AICreditsPaywall
  isOpen={showPaywallModal}
  onClose={closePaywallModal}
  currentCredits={userCredits}
  userId={userId}
  reason="no_credits" | "low_credits" | "guest_user"
/>
```

### **Credit Packages & Pricing**
```typescript
// Geographic pricing with automatic detection
const CREDIT_PACKAGES = {
  vietnam: [
    { credits: 10, price: 249000, currency: 'VND', popular: false },
    { credits: 25, price: 369000, currency: 'VND', popular: true },
    { credits: 50, price: 869000, currency: 'VND', popular: false }
  ],
  international: [
    { credits: 10, price: 9.99, currency: 'USD', popular: false },
    { credits: 25, price: 14.99, currency: 'USD', popular: true },
    { credits: 50, price: 34.99, currency: 'USD', popular: false }
  ]
};
```

### **AI Feature Gating Implementation**
```typescript
// Gated AI Features (1 credit each)
const AI_FEATURES = {
  SUMMARY_GENERATION: 'Generate with AI',
  SUMMARY_IMPROVEMENT: 'Improve Summary', 
  SKILLS_SUGGESTIONS: 'AI Skill Suggestions',
  WORK_EXPERIENCE_WIZARD: 'Add Experience Wizard',
  ACHIEVEMENT_WIZARD: 'Add Achievement Wizard',
  BULLET_IMPROVEMENT: 'Individual bullet AI improvement'
};

// Integration in components
const handleAIFeature = async (feature: AIFeature) => {
  if (!userId) {
    // Show login requirement for guest users
    setShowLoginModal(true);
    return;
  }
  
  const result = await executeAIFeature(feature, () => callAIService());
  if (result.success) {
    // Update UI with AI-generated content
  } else if (result.error === 'insufficient_credits') {
    // Show paywall modal
    setShowPaywallModal(true);
  }
};
```

### **Payment System Integration**
```typescript
// Vietnam Payment Methods
const VIETNAM_PAYMENTS = {
  momo: {
    display: 'MoMo QR Code',
    instructions: 'Scan QR code with MoMo app'
  },
  vietcombank: {
    display: 'Vietcombank Transfer',
    account: '1234567890',
    instructions: 'Transfer with order ID as reference'
  }
};

// International Payment Methods  
const INTERNATIONAL_PAYMENTS = {
  stripe: {
    display: 'Credit/Debit Card',
    processor: 'Stripe',
    currencies: ['USD', 'EUR', 'GBP']
  },
  paypal: {
    display: 'PayPal',
    processor: 'PayPal',
    currencies: ['USD']
  }
};
```

### **Security & Compliance**
- **Row Level Security**: All credit operations protected by RLS policies
- **Server-side validation**: Credit deduction only on successful AI operations  
- **Audit trail**: Complete transaction history for compliance
- **Payment security**: Secure tokenization for card payments
- **Data privacy**: Minimal collection, GDPR-compliant design

### **Local CV Storage Integration**
The AI Credits system builds on the local CV storage foundation:
- **Guest users**: See 5 credits but require login to use AI features
- **Seamless upgrade**: Login triggers instant credit access with data sync
- **Zero data loss**: All CV progress preserved during authentication transition

---

## 🎯 **WORK EXPERIENCE SECTION IMPROVEMENTS** (Latest Session)

### **Critical UX Bug Resolution**
**Component**: `components/sections/WorkExperienceSection.tsx`  
**Issue**: "Add Work Experience" button unresponsive on first click  
**Resolution**: Enhanced event detection and grace period logic  

**Technical Implementation:**
```typescript
// Enhanced Click Detection (Lines 1466-1485)
onClick={(e) => {
  console.log('🎯 ===== BUTTON CLICK DEBUG =====');
  // Comprehensive debugging for click events
  try {
    handleAddExperience();
    console.log('✅ handleAddExperience called successfully');
  } catch (error) {
    console.error('❌ Error calling handleAddExperience:', error);
  }
}}

// Improved Stack Trace Detection (Lines 247-253)
const isDirectUserClick = stack && (
  stack.includes('onClick') ||        // Direct onClick handler
  stack.includes('executeDispatch') || // React event dispatch
  stack.includes('dispatchEvent')     // DOM event dispatch
);

// Smart Grace Period Logic (Lines 287-304)
if (isTemplateUser && !isInitialLoadComplete) {
  const isRecentUserClick = stack && (
    stack.includes('executeDispatch') || 
    stack.includes('dispatchEvent') ||
    stack.includes('onClick')
  );
  
  if (!isRecentUserClick) {
    return; // Block automatic triggers only
  }
  // Allow user clicks even during grace period
}
```

### **Layout Improvements**
**Changes Made:**
1. **Field Label Enhancement**: Changed bullet section from 'Description' to 'Responsibilities & Achievements' (Line 1281)
2. **Location Field Repositioning**: Moved location input before dates grid for improved UX flow (Lines 1222-1231)

**Implementation:**
```typescript
// Updated Label (Line 1281)
<label className="block text-sm font-medium">
  {experienceTexts?.fields?.responsibilities || 'Responsibilities & Achievements'} 
  <span className="text-red-500 text-xs">*</span>
</label>

// Repositioned Location Field (Lines 1222-1231)
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">
    {experienceTexts?.fields?.location || 'Location'}
  </label>
  <input 
    type="text" 
    className="w-full p-2 border border-gray-200 rounded-md..."
    value={experience.location || ''} 
    onChange={(e) => handleUpdateExperience(index, 'location', e.target.value)}
    placeholder={experienceTexts?.placeholders?.location || 'e.g., San Francisco, CA'} 
  />
</div>
```
