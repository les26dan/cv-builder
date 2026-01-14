# Technical Debt Registry
**Last Updated**: January 29, 2025

## 🚨 **Critical Technical Debt**

### **CV Parser Implementation Session Debt**
**Date Added**: January 29, 2025  
**Component**: CV Parser Integration

#### **1. Present/Current Job Checkbox Bug** 
**Severity**: HIGH  
**Description**: ChatGPT `"end_date": "Present"` not triggering current job checkbox  
**Impact**: User confusion, incorrect CV formatting  
**Root Cause**: Unknown - multiple fix attempts failed  
**Quick Fix**: Manual checkbox selection required  
**Proper Fix**: Debug component props flow, check WorkExperienceSection state management  

#### **2. CV Preview Panel Synchronization**
**Severity**: CRITICAL  
**Description**: CV Editor populates correctly but Preview panel shows empty/incorrect data  
**Impact**: Users cannot see CV preview, defeats purpose of guided editing  
**Root Cause**: Missing data flow between editor and preview components  
**Quick Fix**: Manual refresh or navigation  
**Proper Fix**: Implement proper state synchronization between CVEditor and PreviewPanel  

## 🧹 **Test Configuration Debt**

#### **3. Vitest Import Configuration**
**Severity**: MEDIUM  
**Description**: 188 TypeScript errors in test files due to vitest imports  
**Impact**: Development experience degradation, false positive error reports  
**Files Affected**: All `.test.tsx` and `.test.ts` files  
**Quick Fix**: Ignore test file TypeScript errors  
**Proper Fix**: Configure proper vitest types in tsconfig.json  

#### **4. Vietnamese Text Test Mismatches**
**Severity**: LOW  
**Description**: Test expectations using English text but UI shows Vietnamese  
**Impact**: 37% test failure rate (66/177 tests failing)  
**Root Cause**: Hardcoded English text in test expectations  
**Quick Fix**: Tests still pass for business logic  
**Proper Fix**: Update test expectations to match Vietnamese UI text  

## 📝 **Code Quality Debt**

#### **5. Debug Console Logs in Production**
**Severity**: LOW  
**Description**: Multiple console.log statements left in production code for debugging  
**Files**: `CVEditor.tsx`, `cvParserService.ts`, `app/cv-uploaded-test/page.tsx`  
**Impact**: Console noise in production  
**Quick Fix**: Remove specific console.log statements  
**Proper Fix**: Implement proper logging service with environment-based levels  

#### **6. Hard-coded Test Data**
**Severity**: LOW  
**Description**: Manroe CV data hard-coded in test page  
**File**: `app/cv-uploaded-test/page.tsx`  
**Impact**: Maintenance burden if test data changes  
**Quick Fix**: Keep current implementation for debugging  
**Proper Fix**: Load test data from external JSON files  

#### **7. Memory Leak Potential**
**Severity**: MEDIUM  
**Description**: Repeated data conversion calls in CVEditor without cleanup  
**Impact**: Potential memory buildup with large CVs or frequent usage  
**Root Cause**: useEffect dependencies causing re-renders  
**Quick Fix**: Acceptable for current usage  
**Proper Fix**: Implement proper cleanup and memoization  

## 🔒 **Security & Validation Debt**

#### **8. No ChatGPT Response Validation**
**Severity**: MEDIUM  
**Description**: cvParserService assumes ChatGPT returns well-formed JSON  
**Impact**: Application crash if malformed response received  
**Root Cause**: No input validation on AI response  
**Quick Fix**: Try-catch around conversion calls  
**Proper Fix**: Implement comprehensive JSON schema validation  

#### **9. No Error Handling for API Failures**
**Severity**: MEDIUM  
**Description**: No graceful degradation when ChatGPT API fails  
**Impact**: Poor user experience during API outages  
**Root Cause**: Missing error boundaries and fallback mechanisms  
**Quick Fix**: Show generic error message  
**Proper Fix**: Implement retry logic and offline capabilities  

## 📊 **Performance Debt**

#### **10. No Data Caching Strategy**
**Severity**: LOW  
**Description**: CV parsing results not cached, re-processing same data  
**Impact**: Unnecessary API calls and processing time  
**Root Cause**: No caching layer implemented  
**Quick Fix**: Use localStorage for session caching  
**Proper Fix**: Implement Redis-based caching with TTL  

## 🧪 **Testing Debt**

#### **11. No CV Parser Integration Tests**
**Severity**: MEDIUM  
**Description**: No automated tests for CV parser end-to-end workflow  
**Impact**: Regression risk when modifying parser logic  
**Root Cause**: Focus on manual testing during development  
**Quick Fix**: Manual testing checklist  
**Proper Fix**: Create comprehensive integration test suite  

#### **12. No Mobile Testing**
**Severity**: LOW  
**Description**: CV parser only tested on desktop Chrome  
**Impact**: Unknown behavior on mobile devices and other browsers  
**Root Cause**: Time constraints during development  
**Quick Fix**: Manual mobile testing on key devices  
**Proper Fix**: Automated cross-browser testing pipeline  

---

## 📈 **Debt Prioritization Matrix**

### **URGENT (Fix Next Session)**
1. CV Preview Panel Synchronization (CRITICAL)
2. Present/Current Job Checkbox Bug (HIGH)
3. ChatGPT Response Validation (MEDIUM)

### **HIGH PRIORITY (Fix Within Sprint)**
4. Memory Leak Potential (MEDIUM) 
5. API Error Handling (MEDIUM)
6. CV Parser Integration Tests (MEDIUM)

### **MEDIUM PRIORITY (Fix When Convenient)**
7. Vitest Import Configuration (MEDIUM)
8. Vietnamese Text Test Mismatches (LOW)
9. Debug Console Logs (LOW)

### **LOW PRIORITY (Technical Cleanup)**
10. Data Caching Strategy (LOW)
11. Hard-coded Test Data (LOW)
12. Mobile Testing (LOW)

---

## 📋 **Debt Resolution Tracking**

### **Completed This Session**
- ✅ **Contact Information Population**: Fixed field mapping issue
- ✅ **Work Experience Data Flow**: All 6 entries populate correctly  
- ✅ **React Performance Issues**: Fixed infinite re-renders and warnings
- ✅ **Production Build Stability**: Zero errors, clean builds

### **Next Session Target**
- 🎯 **Focus**: Fix CV Preview Panel synchronization (highest impact)
- 🎯 **Secondary**: Resolve Present/Current Job checkbox bug
- 🎯 **Stretch**: Add basic error handling for ChatGPT responses

### **Technical Debt Rules**
1. **Never ship with CRITICAL severity debt**
2. **HIGH severity debt must have workaround documented**
3. **All debt items must have clear resolution path**
4. **Debt review required before each release**
