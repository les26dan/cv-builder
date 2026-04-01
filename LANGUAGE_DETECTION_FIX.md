# Language Detection Fix - Vietnamese Input → Vietnamese Output

## Issue
When users input Vietnamese text in cv-guided-editing, the AI was generating English content instead of Vietnamese.

## Root Causes

### 1. English Bias in Language Detection
**File:** `config/languageConfig.ts:232`

**Problem:**
```typescript
const detectedLanguage: SupportedLanguage = enConfidence >= viConfidence ? 'en' : 'vi';
```

When Vietnamese and English confidence scores were equal or close (common when CV contains technical terms in English), the `>=` operator favored English.

**Fix:**
```typescript
const detectedLanguage: SupportedLanguage = enConfidence > viConfidence ? 'en' : 'vi';
```

Now uses strict `>` so Vietnamese wins when scores are equal. Aligns with default language being Vietnamese.

### 2. localStorage Key Mismatch
**Files:** Various components vs `config/languageConfig.ts`

**Problem:**
- UI components saved language preference to: `okbuddy_language`
- Language detection system read from: `okbuddy-language-preference`
- User's manual language selection was ignored by AI generation

**Fix:**
- `loadUserPreference()`: Now checks `okbuddy_language` first, then fallback to system keys
- `saveUserPreference()`: Saves to both `okbuddy_language` and system keys for consistency
- `clearUserPreference()`: Clears all related localStorage keys

## How Language Detection Works

### Priority Order:
1. **Manual Override** (highest) - Explicit language parameter in API request
2. **User Preference** - From `localStorage.getItem('okbuddy_language')`
3. **Content Analysis** - Detects language from CV text content
4. **Browser Locale** - Falls back to browser language setting
5. **Default** (lowest) - Vietnamese (`vi`)

### Content Analysis:
Counts pattern matches for Vietnamese vs English:
- Vietnamese patterns: Vietnamese characters, common words (và, của, trong...), job titles (kỹ sư, quản lý...)
- English patterns: Common words (the, and, of...), job titles (manager, developer...)
- Calculates confidence: `matches / totalMatches`
- Selects language with higher confidence

## Testing the Fix

### Test 1: Vietnamese Input
```bash
# Open browser console
localStorage.setItem('okbuddy_language', 'vi')
```

1. Navigate to `/cv-guided-editing`
2. Input Vietnamese text: "Quản lý dự án phần mềm"
3. Click AI suggestion button
4. **Expected:** AI generates Vietnamese content

### Test 2: Manual Language Switch
1. Toggle language to English in UI
2. Input Vietnamese text
3. **Expected:** AI generates English content (manual override)

### Test 3: Check Detection Logs
Open browser console and look for:
```
🌐 Language Detection: {
  detected: 'vi',
  source: 'content',
  confidence: 0.85,
  context: { ... }
}
```

### Test 4: Clear Cache and Verify
```bash
# Clear all language preferences
localStorage.removeItem('okbuddy_language')
localStorage.removeItem('okbuddy-language-preference')
localStorage.removeItem('okbuddy-language-preference-meta')

# Refresh page
# Input Vietnamese text
# Should detect Vietnamese from content analysis
```

## Manual Language Override

### For Users:
Open browser console (F12) and set your preferred language:

```javascript
// Set Vietnamese
localStorage.setItem('okbuddy_language', 'vi')

// Set English
localStorage.setItem('okbuddy_language', 'en')

// Then refresh the page
location.reload()
```

### For Developers:
Pass explicit language in API requests:

```typescript
await aiService.generateSummary({
  workExperience: [...],
  language: 'vi', // Explicit override
  // ... other params
});
```

## Files Changed

1. **config/languageConfig.ts**
   - Line 232: Changed `>=` to `>` to favor Vietnamese when equal
   - Line 232: Updated comment to reflect Vietnamese bias
   - Line 332-357: Enhanced `loadUserPreference()` to check `okbuddy_language` first
   - Line 363-377: Enhanced `saveUserPreference()` to save to both keys
   - Line 149-155: Enhanced `clearUserPreference()` to clear all keys

## Verification Checklist

- [ ] Vietnamese input generates Vietnamese output
- [ ] English input generates English output
- [ ] Manual language toggle works correctly
- [ ] Language preference persists across page reloads
- [ ] localStorage keys are synchronized
- [ ] Console logs show correct language detection
- [ ] No regression in existing English workflows

## Related Files

Language detection flow:
```
User Input
    ↓
components/sections/*.tsx (get user input)
    ↓
utils/aiService.ts:detectRequestLanguage() (detect language)
    ↓
config/languageConfig.ts:detectLanguageFromContent() (analyze content)
    ↓
AI Prompt Selection (vi or en templates)
    ↓
OpenAI API Call
    ↓
Generated Content (in detected language)
```

## Future Improvements

1. **Language Indicator:** Show detected language in UI
2. **Confidence Threshold:** Only auto-detect if confidence > 70%
3. **Mixed Language Support:** Handle bilingual CVs
4. **User Feedback:** Let users report incorrect detection
5. **Analytics:** Track detection accuracy metrics

## Support

If language detection still seems incorrect:
1. Check browser console for detection logs
2. Verify `localStorage.getItem('okbuddy_language')`
3. Check CV content for language-specific patterns
4. Report issue with detection logs and input sample
