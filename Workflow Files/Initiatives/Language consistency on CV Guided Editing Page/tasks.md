# Language Consistency Tasks for CV Guided Editing Page

## Overview
This document lists all hardcoded Vietnamese text found in the CV Guided Editing page that needs to be replaced with dynamic language configuration to ensure consistency with the global language setting.

## Critical Hardcoded Vietnamese Text Identified

### 1. **CV Guided Editing Main Page**
**File:** `app/cv-guided-editing/[cvId]/page.tsx`
- **Line 135:** `<p className="text-gray-600">Đang xác thực người dùng...</p>`
- **Issue:** Loading message is hardcoded in Vietnamese
- **Priority:** HIGH - First thing users see

### 2. **Work Experience Wizard Modal**
**File:** `components/common/WorkExperienceWizard.tsx`
- **Line 318:** `aria-label="Thêm kinh nghiệm làm việc"`
- **Line 327:** `{isAIStep ? 'Tạo mô tả công việc AI' : 'Thêm kinh nghiệm làm việc'}`
- **Line 336:** `aria-label="Đóng"`
- **Line 346:** `Bước {currentStep} / {TOTAL_STEPS}`
- **Line 377:** `Chức danh công việc của bạn là gì?`
- **Line 387:** `placeholder="Ví dụ: Chuyên viên kinh doanh, Software Engineer..."`
- **Line 398:** `Nhập chính xác chức danh để AI có thể tạo mô tả phù hợp nhất.`
- **Line 407:** `Tên công ty hoặc tổ chức?`
- **Line 417:** `placeholder="Ví dụ: Công ty cổ phần ABC, Ngân hàng XYZ..."`
- **Line 428:** `AI sẽ sử dụng thông tin này để tạo mô tả công việc phù hợp với ngành nghề.`
- **Line 437:** `<h4 className="font-medium text-blue-900 mb-1">🎯 Tạo mô tả công việc với AI</h4>`
- **Line 439:** `AI sẽ giúp bạn tạo gạch đầu dòng chuyên nghiệp dựa trên thông tin bạn cung cấp.`
- **Line 444:** `Dự án hoặc trách nhiệm chính`
- **Line 453:** `placeholder="Ví dụ: Phát triển hệ thống CRM mới cho bộ phận kinh doanh"`
- **Line 464:** `Mô tả ngắn gọn một dự án, nhiệm vụ hoặc trách nhiệm quan trọng bạn đã đảm nhận.`
- **Line 473:** `Kết quả hoặc tác động`
- **Line 476:** `<p className="text-sm text-green-700 font-medium">💡 Mẹo: Sử dụng số liệu cụ thể</p>`
- **Line 478:** `Ví dụ: "Tăng doanh thu 30%", "Giảm thời gian xử lý 50%", "Quản lý ngân sách 2 tỷ đồng"`
- **Line 488:** `placeholder="Ví dụ: Tăng hiệu suất bán hàng 25%, giảm thời gian xử lý đơn hàng 40%"`
- **Line 499:** `Mô tả kết quả cụ thể, có thể là con số, cải thiện quy trình, hoặc lợi ích mang lại.`
- **Line 508:** `Vai trò và phạm vi trách nhiệm (tùy chọn)`
- **Line 517:** `placeholder="Ví dụ: Lãnh đạo nhóm 5 người, quản lý ngân sách 500 triệu, phụ trách khu vực miền Nam..."`
- **Line 523:** `Mô tả vai trò lãnh đạo, phạm vi trách nhiệm hoặc quy mô công việc để AI tạo mô tả toàn diện hơn.`
- **Line 537:** `Hủy`
- **Line 546:** `Quay lại`
- **Line 556:** `Tiếp theo`
- **Line 568:** `Đang tạo...`
- **Line 573:** `Tạo với AI`
- **Priority:** CRITICAL - Core workflow component

### 3. **AI Wizard Modal**
**File:** `components/common/AIWizardModal.tsx`
- **Line 171:** `aria-label="Tạo mô tả công việc nhanh"`
- **Line 183:** `Tạo mô tả công việc nhanh`
- **Line 190:** `aria-label="Đóng"`
- **Line 207:** `Bước {currentStep} / 3`
- **Line 237:** `<h4 className="font-medium text-blue-900 mb-1">🎯 Tạo mô tả công việc với AI</h4>`
- **Line 239:** `AI sẽ giúp bạn tạo gạch đầu dòng chuyên nghiệp dựa trên thông tin bạn cung cấp.`
- **Line 244:** `Dự án hoặc trách nhiệm chính`
- **Line 253:** `placeholder="Ví dụ: Phát triển hệ thống CRM mới cho bộ phận kinh doanh"`
- **Line 259:** `Mô tả ngắn gọn một dự án, nhiệm vụ hoặc trách nhiệm quan trọng bạn đã đảm nhận.`
- **Line 267:** `Kết quả hoặc tác động`
- **Line 270:** `<p className="text-sm text-green-700 font-medium">💡 Mẹo: Sử dụng số liệu cụ thể</p>`
- **Line 272:** `Ví dụ: "Tăng doanh thu 30%", "Giảm thời gian xử lý 50%", "Quản lý ngân sách 2 tỷ đồng"`
- **Line 282:** `placeholder="Ví dụ: Tăng hiệu suất bán hàng 25%, giảm thời gian xử lý đơn hàng 40%"`
- **Line 288:** `Mô tả kết quả cụ thể, có thể là con số, cải thiện quy trình, hoặc lợi ích mang lại.`
- **Line 296:** `Vai trò và phạm vi trách nhiệm (tùy chọn)`
- **Line 305:** `placeholder="Ví dụ: Lãnh đạo nhóm 5 người, quản lý ngân sách 500 triệu, phụ trách khu vực miền Nam..."`
- **Line 311:** `Mô tả vai trò lãnh đạo, phạm vi trách nhiệm hoặc quy mô công việc để AI tạo mô tả toàn diện hơn.`
- **Line 325:** `Hủy`
- **Line 334:** `Quay lại`
- **Line 344:** `Tiếp theo`
- **Line 356:** `Đang tạo...`
- **Line 359:** `'Tạo gạch đầu dòng'`
- **Priority:** CRITICAL - Core AI workflow component

### 4. **Editor Panel - Add Section Modal**
**File:** `components/EditorPanel.tsx`
- **Line 585:** `title: 'Phần mới',` (for custom section default)
- **Line 989:** `Chọn loại phần bạn muốn thêm vào CV`
- **Line 1010:** `Hủy`
- **Priority:** HIGH - Section management

### 5. **Summary Section**
**File:** `components/sections/SummarySection.tsx`
- **Line 148:** `<h4 className="font-medium text-primary-700 mb-1">Bắt đầu dễ dàng hơn!</h4>`
- **Line 150:** `Hãy bắt đầu với kinh nghiệm làm việc để AI có thể hỗ trợ viết tóm tắt tốt hơn`
- **Line 156:** `Đi đến Kinh nghiệm làm việc`
- **Line 163:** `<p className="text-sm">Hoặc bạn có thể viết tóm tắt trực tiếp</p>`
- **Line 170:** `placeholder="Viết tóm tắt về kinh nghiệm và mục tiêu nghề nghiệp của bạn..."`
- **Priority:** HIGH - Guidance content

### 6. **Work Experience Section Error Messages**
**File:** `components/sections/WorkExperienceSection.tsx`
- **Line 423:** `alert('Không thể tạo gạch đầu dòng. Vui lòng thử lại.');`
- **Priority:** MEDIUM - Error handling

### 7. **Editor Panel Error Messages**
**File:** `components/EditorPanel.tsx`
- **Line 521:** `setAnalysisError(...'Đã xảy ra lỗi khi áp dụng gợi ý. Vui lòng thử lại.');`
- **Priority:** MEDIUM - Error handling

### 8. **Template Section Headers**
**File:** `components/templates/DennisSchroderTemplate.tsx`
- **Line 33:** `experience: 'KINH NGHIỆM LÀM VIỆC',`
- **Line 34:** `skills: 'KỸ NĂNG',`
- **Line 35:** `education: 'HỌC VẤN',`
- **Line 36:** `projects: 'DỰ ÁN',`
- **Line 37:** `volunteer: 'HOẠT ĐỘNG TÌNH NGUYỆN',`
- **Line 38:** `certifications: 'CHỨNG CHỈ',`
- **Line 39:** `languages: 'NGÔN NGỮ',`
- **Line 40:** `hobbies: 'SỞ THÍCH'`
- **Line 55:** `if (sectionId.startsWith('custom-')) return 'PHẦN TÙY CHỈNH';`
- **Line 57:** `return defaultSectionTitles[sectionId] || 'PHẦN KHÁC';`
- **Priority:** HIGH - Template display

### 9. **Header Components with Vietnamese aria-labels**
**Files:** `components/SharedHeader.tsx`, `components/Header.tsx`, `components/auth/Header.tsx`
- **Various lines:** `aria-label="OkBuddy - Trang chủ"`
- **Priority:** MEDIUM - Accessibility

### 10. **Template Selection Modal**
**File:** `components/common/TemplateSelectionModal.tsx`
- **Line 89:** `aria-label="Đóng"`
- **Priority:** MEDIUM - Modal accessibility

## Solution Strategy

### Immediate Actions Required:
1. **Create Vietnamese text configuration files** for all identified components
2. **Replace hardcoded Vietnamese** with dynamic text loading from config
3. **Ensure fallback to English** when Vietnamese text is not available
4. **Test language switching** functionality

### Implementation Priority:
1. **CRITICAL:** Core wizard components (WorkExperienceWizard, AIWizardModal)
2. **HIGH:** Page loading messages, section headers, guidance text
3. **MEDIUM:** Error messages, accessibility labels

### Text Configuration Structure:
- Use existing `/config/texts/` structure
- Create specific files for wizard components
- Ensure consistency with existing language configuration system
- Follow the pattern established in existing text config files

## Status: PENDING IMPLEMENTATION
**Next Steps:** 
1. Implement text configuration for wizard components
2. Replace hardcoded Vietnamese text with dynamic loading
3. Test with both English and Vietnamese language settings
4. Verify complete language consistency across the CV Guided Editing page
