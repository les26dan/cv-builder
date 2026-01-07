# Cursor AI Development Guide - OkBuddy

**Last Updated**: January 2025  
**Status**: Production Guidelines with Critical Rendering Issue Prevention

---

## 🚨 **CRITICAL: PAGE RENDERING PREVENTION** (January 2025)

### **NEVER CREATE THESE PATTERNS**

When developing any OkBuddy page, these patterns are **STRICTLY FORBIDDEN** as they cause pages to show raw text instead of styled UI:

#### **❌ FORBIDDEN PATTERN 1: Loading State Gates**
```typescript
// ❌ NEVER WRITE THIS CODE:
'use client';
import { useState, useEffect } from 'react';

export default function Page() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  if (!isLoaded) {
    return <div>Loading...</div>; // THIS BREAKS THE PAGE
  }
  
  return <ActualContent />;
}
```

#### **❌ FORBIDDEN PATTERN 2: Client Mount Checks**
```typescript
// ❌ NEVER WRITE THIS CODE:
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
return mounted ? <PageContent /> : null;
```

#### **❌ FORBIDDEN PATTERN 3: Service Worker in Components**
```typescript
// ❌ NEVER WRITE THIS CODE:
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(/* cache clearing */);
  }
}, []);
```

### **✅ CORRECT PATTERNS TO ALWAYS USE**

#### **✅ CORRECT PATTERN 1: Direct Rendering**
```typescript
// ✅ ALWAYS WRITE CODE LIKE THIS:
import Header from '../components/Header';
import Content from '../components/Content';

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Content />
    </div>
  );
}
```

#### **✅ CORRECT PATTERN 2: Server Components by Default**
```typescript
// ✅ DEFAULT TO SERVER COMPONENTS:
// No 'use client' directive unless absolutely necessary
// No useState or useEffect for rendering logic

export default function Page() {
  return <PageContent />; // Renders immediately on server
}
```

#### **✅ CORRECT PATTERN 3: Client Components Only When Needed**
```typescript
// ✅ USE CLIENT COMPONENTS ONLY FOR INTERACTIVITY:
'use client';
import { useState } from 'react';

export default function InteractiveForm() {
  const [formData, setFormData] = useState({});
  
  return (
    <div className="form-container">
      {/* Interactive form logic */}
    </div>
  );
}
```

---

## 🛡️ **PREVENTION CHECKLIST**

### **Before Creating Any Page Component:**

1. **❓ Does this page need client-side state?**
   - **NO**: Use server component (no 'use client')
   - **YES**: Use client component but render content immediately

2. **❓ Am I adding any loading logic?**
   - **YES**: ⚠️ **STOP** - Remove loading logic
   - **NO**: ✅ Continue

3. **❓ Does the component return JSX immediately?**
   - **NO**: ⚠️ **STOP** - Remove conditional returns
   - **YES**: ✅ Continue

4. **❓ Are all Tailwind classes in the JSX?**
   - **NO**: ⚠️ **STOP** - Add proper styling
   - **YES**: ✅ Continue

### **After Creating Any Page Component:**

1. **Test Server-Side Rendering:**
   ```bash
   npm run build
   curl -s http://localhost:3000/your-page | grep "class="
   ```

2. **Verify No Loading States:**
   ```bash
   grep -r "useState.*[Ll]oad" app/your-page/
   grep -r "setIsLoaded\|setMounted\|setReady" app/your-page/
   ```

3. **Check Component Structure:**
   ```bash
   # Should find NO conditional returns
   grep -r "return.*null" app/your-page/
   grep -r "return.*Loading" app/your-page/
   ```

---

## 🔧 **EMERGENCY DEBUGGING**

### **If Page Shows Raw Text Instead of Styled UI:**

#### **Step 1: Immediate Fix**
```typescript
// Remove ALL loading logic from page component:
// DELETE these lines:
const [isLoaded, setIsLoaded] = useState(false);
useEffect(() => setIsLoaded(true), []);
if (!isLoaded) return <div>Loading...</div>;

// REPLACE with direct rendering:
export default function Page() {
  return <YourPageContent />;
}
```

#### **Step 2: Verify Build**
```bash
npm run build
# Must succeed with no errors
```

#### **Step 3: Test Rendering**
```bash
curl -s http://localhost:3000 | grep -E "(class=|bg-|text-)"
# Must show Tailwind classes in HTML
```

#### **Step 4: Clear Cache (Last Resort)**
```bash
pkill -f "next dev"
rm -rf .next node_modules/.cache
npm install && npm run dev
```

---

## 📚 **OKBUDDY-SPECIFIC GUIDELINES**

### **Page Architecture Rules:**

1. **Use Existing Headers:**
   - Landing page: `import Header from '../components/Header'`
   - Auth pages: `import Header from '../components/auth/Header'`
   - CV pages: `import HeaderMinimal from '../components/HeaderMinimal'`

2. **Import Text Content:**
   ```typescript
   import { landingPage } from '../config/texts/vi/landingPage';
   // Never hardcode Vietnamese text in components
   ```

3. **Follow Color System:**
   ```typescript
   // Use defined Tailwind colors:
   className="bg-[#E0F7FA] text-[#0288D1]"
   // From tailwind.config.js color definitions
   ```

4. **Maintain Responsive Design:**
   ```typescript
   className="px-4 md:px-[120px] py-[60px]"
   // Mobile-first responsive approach
   ```

### **Testing Requirements:**

- **Visual Test**: Page must look identical to design
- **Build Test**: `npm run build` must succeed
- **SSR Test**: `curl` must show styled content
- **Performance Test**: First contentful paint < 2s

---

## ⚡ **QUICK REFERENCE**

### **DO:**
- ✅ Render components immediately
- ✅ Use server components by default
- ✅ Import from config/texts/ for content
- ✅ Test with `npm run build`
- ✅ Verify with `curl localhost:3000`

### **DON'T:**
- ❌ Add loading state logic
- ❌ Use conditional rendering for pages
- ❌ Clear cache in components
- ❌ Hardcode text content
- ❌ Block rendering with useEffect

### **EMERGENCY COMMANDS:**
```bash
# Check for anti-patterns:
grep -r "useState.*Load\|setMounted\|if.*!.*loaded" app/

# Fix build issues:
rm -rf .next && npm run build

# Test SSR:
curl -s http://localhost:3000 | head -10
```

---

**Remember**: A working page with immediate rendering is infinitely better than a "perfect" page that shows raw text to users. 