# CV Template Setup Guide

## Overview
This guide explains how to set up template CV persistence in the database for the OkBuddy application.

## Current State
- ✅ Template CVs work in localStorage (browser-only)
- ✅ Guest access enabled via middleware
- ✅ CVWorkflowProvider handles template loading
- ❌ Templates cannot be saved to database (UUID constraint)
- ❌ Templates not persistent across sessions

## Setup Steps

### Step 1: Run Database Migration
This changes the `cv_workflow.id` column from UUID to TEXT to support template IDs.

**In Supabase SQL Editor, run:**
```sql
-- See: scripts/migrate-cv-workflow-id-to-text.sql
BEGIN;

ALTER TABLE cv_workflow ADD COLUMN id_new TEXT;
UPDATE cv_workflow SET id_new = id::text;
ALTER TABLE cv_workflow DROP COLUMN id;
ALTER TABLE cv_workflow RENAME COLUMN id_new TO id;
ALTER TABLE cv_workflow ADD PRIMARY KEY (id);

DROP INDEX IF EXISTS idx_cv_workflow_user_id;
CREATE INDEX idx_cv_workflow_user_id ON cv_workflow(user_id);

COMMIT;
```

### Step 2: Create Template User
This creates a dedicated user for storing template CVs.

**In Supabase SQL Editor, run:**
```sql
-- See: scripts/create-template-user-and-cv.sql
INSERT INTO users (id, email, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'template@okbuddy.app',
  'Template User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Insert Template CV Data
This adds a professional template CV to the database.

**In Supabase SQL Editor, run:**
```bash
# Use the full script from:
scripts/create-template-user-and-cv.sql
```

Or manually insert via the provided INSERT statement in that file.

### Step 4: Update CVWorkflowProvider (Optional Enhancement)
Currently, templates load from localStorage. To enable database persistence:

**File:** `shared/contexts/CVWorkflowContext.tsx`

**Change lines 179-238** to try database first, localStorage as fallback:

```typescript
if (cvId.startsWith('template-')) {
  // Try database first
  const dbResult = await dataService.loadDraft(userId, cvId)

  if (dbResult.success && dbResult.data) {
    dispatch({ type: 'SET_CV_DATA', payload: dbResult.data })
    dispatch({ type: 'SET_LOADED', payload: true })
    return
  }

  // Fallback to localStorage
  const uploadData = localStorage.getItem('cv_upload_data')
  // ... existing localStorage logic
}
```

## Testing the Setup

### Test Template Creation:
1. Navigate to `/cv-upload`
2. Click "Start from Template"
3. Verify redirect to `/cv-guided-editing/template-{timestamp}`
4. Check localStorage: `cv_upload_data` should exist
5. Make edits and verify auto-save works

### Test Database Template:
1. Run all setup scripts above
2. Navigate to `/cv-guided-editing/template-1770903803894`
3. Verify the professional template loads
4. Make edits and check if they persist

### Test Guest Access:
1. Open incognito window (no auth)
2. Navigate to template URL directly
3. Should load without login prompt
4. Check middleware logs: "Guest Session: Allowing template CV access"

## Environment Variables Required

Add to `.env.local`:
```bash
# Supabase (required for database persistence)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Authentication (required for non-template CVs)
JWT_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_SECRET=generate-a-separate-secret

# OpenAI (optional, for CV parsing)
OPENAI_API_KEY=sk-proj-your-key
```

## Architecture: Template Flow

```
User clicks "Start from Template"
    ↓
Generate template-{timestamp} ID
    ↓
Create default CV structure
    ↓
Save to localStorage
    ↓
Redirect to /cv-guided-editing/template-{id}
    ↓
Middleware: Detect template- prefix → Allow guest
    ↓
CVWorkflowProvider: Load from localStorage
    ↓
CVEditor: Render + Auto-save (every 2s)
    ↓
Save to localStorage only (no database)
```

## Future Enhancements

### 1. Template Library
Create a gallery of pre-made templates:
- Professional Software Engineer
- Marketing Manager
- Product Designer
- etc.

### 2. Template Persistence
Allow users to save custom templates to their account.

### 3. Template Sharing
Generate shareable links for templates.

### 4. Template Versioning
Track changes to templates over time.

## Troubleshooting

### Error: "Database load error: {}"
- **Cause:** Empty error object from Supabase query
- **Fix:** Already handled in `cvWorkflowDataService.ts` (lines 169-178)
- **Action:** Restart dev server

### Error: "Template CV data not found"
- **Cause:** localStorage doesn't have `cv_upload_data` key
- **Fix:** Navigate to `/cv-upload` and click "Start from Template" first
- **Action:** Ensure localStorage is not disabled in browser

### Error: "Database not available or invalid CV ID"
- **Cause:** Template ID not supported in database (UUID constraint)
- **Fix:** Run Step 1 migration to change id column to TEXT
- **Action:** Execute `scripts/migrate-cv-workflow-id-to-text.sql`

## Contact
For issues or questions, check:
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Documentation: See `/docs` folder
