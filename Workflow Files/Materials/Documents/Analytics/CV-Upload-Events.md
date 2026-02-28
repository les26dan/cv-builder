# CV Upload - Event Tracking Specification

## Overview
Event tracking for OkBuddy's CV & JD upload page to measure file upload success, user interaction patterns, and optimize the CV analysis workflow.

## Page Load Events

### 1. CV Upload Page Viewed
**Trigger**: User visits the CV & JD upload page
**Event Name**: `Page Viewed`
**Event Properties**:
```json
{
  "page_name": "CV Upload Page",
  "page_url": "https://okbuddy.vn/upload",
  "referrer_url": "string",
  "referrer_page": "CV Workspace|Landing Page|Registration|Direct",
  "user_id": "user_12345",
  "device_type": "desktop|mobile|tablet",
  "device_model": "iPhone 14 Pro|MacBook Pro M1|Samsung Galaxy S23",
  "operating_system": "iOS|Android|Windows|macOS|Linux",
  "os_version": "16.5|13|11|Ventura|Ubuntu 22.04",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "browser_version": "119.0.0.0",
  "screen_resolution": "1920x1080|375x667|1366x768",
  "viewport_size": "1200x800",
  "language": "vi|en",
  "country": "VN|US|SG|JP",
  "city": "Ho Chi Minh City|Hanoi|Da Nang",
  "upload_step": "cv_upload|jd_upload|both_empty",
  "has_existing_cvs": true|false,
  "existing_cv_count": 3,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:00",
  "app_version": "1.0.0",
  "environment": "production|staging|development"
}
```

## CV Upload Events

### 2. CV Upload Area Interaction
**Trigger**: User interacts with CV upload drop zone
**Event Name**: `CV Upload Area Interaction`
**Event Properties**:
```json
{
  "interaction_type": "click|drag_enter|drag_over|drag_leave|drop",
  "upload_method": "click|drag_drop",
  "time_on_page": 5.2,
  "previous_uploads": 0,
  "upload_area_state": "empty|populated|error",
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:05",
  "app_version": "1.0.0"
}
```

### 3. CV File Selected
**Trigger**: User selects CV file via file picker or drag & drop
**Event Name**: `CV File Selected`
**Event Properties**:
```json
{
  "file_name": "NguyenVanA_CV.pdf",
  "file_size_mb": 1.2,
  "file_type": "pdf|doc|docx",
  "file_extension": ".pdf",
  "upload_method": "file_picker|drag_drop|paste",
  "selection_time": 8.5,
  "file_valid": true|false,
  "validation_errors": ["none"]|["file_too_large", "invalid_format"],
  "max_file_size_mb": 10,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:08",
  "app_version": "1.0.0"
}
```

### 4. CV Upload Started
**Trigger**: CV file upload begins processing
**Event Name**: `CV Upload Started`
**Event Properties**:
```json
{
  "file_name": "NguyenVanA_CV.pdf",
  "file_size_mb": 1.2,
  "file_type": "pdf",
  "upload_method": "file_picker|drag_drop",
  "estimated_duration": 3.5,
  "network_type": "wifi|4g|3g|slow-2g",
  "connection_speed": "fast|medium|slow",
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:10",
  "app_version": "1.0.0"
}
```

### 5. CV Upload Progress
**Trigger**: Upload progress updates (25%, 50%, 75%, 100%)
**Event Name**: `CV Upload Progress`
**Event Properties**:
```json
{
  "file_name": "NguyenVanA_CV.pdf",
  "progress_percentage": 50,
  "upload_duration": 1.8,
  "upload_speed_mbps": 0.67,
  "bytes_uploaded": 629145,
  "total_bytes": 1258291,
  "network_type": "wifi|4g|3g|slow-2g",
  "connection_stable": true|false,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:12",
  "app_version": "1.0.0"
}
```

### 6. CV Upload Completed
**Trigger**: CV file successfully uploaded and processed
**Event Name**: `CV Upload Completed`
**Event Properties**:
```json
{
  "file_name": "NguyenVanA_CV.pdf",
  "file_size_mb": 1.2,
  "file_type": "pdf",
  "upload_method": "file_picker|drag_drop",
  "upload_duration": 3.2,
  "processing_duration": 1.5,
  "total_duration": 4.7,
  "upload_success": true,
  "text_extraction_success": true|false,
  "pages_extracted": 2,
  "sections_detected": ["personal_info", "education", "experience"],
  "content_quality_score": 85,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:15",
  "app_version": "1.0.0",
  "conversion_goal": "cv_upload_success"
}
```

### 7. CV Upload Error
**Trigger**: CV upload fails due to various reasons
**Event Name**: `CV Upload Error`
**Event Properties**:
```json
{
  "file_name": "NguyenVanA_CV.pdf",
  "file_size_mb": 1.2,
  "file_type": "pdf",
  "error_type": "file_too_large|invalid_format|network_error|server_error|processing_error",
  "error_message": "File size exceeds 10MB limit|Unsupported file format|Upload timeout",
  "error_stage": "validation|upload|processing",
  "upload_progress": 75,
  "retry_available": true|false,
  "fallback_suggested": "manual_input|different_format",
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "network_type": "wifi|4g|3g|slow-2g",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:18",
  "app_version": "1.0.0"
}
```

### 8. CV Upload Retry
**Trigger**: User retries failed CV upload
**Event Name**: `CV Upload Retry`
**Event Properties**:
```json
{
  "file_name": "NguyenVanA_CV.pdf",
  "retry_attempt": 2,
  "previous_error": "network_error",
  "time_between_retries": 15.3,
  "file_changed": false,
  "retry_method": "same_file|new_file|different_format",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:33",
  "app_version": "1.0.0"
}
```

## Job Description Upload Events

### 9. JD Upload Area Interaction
**Trigger**: User interacts with JD upload/paste area
**Event Name**: `JD Upload Area Interaction`
**Event Properties**:
```json
{
  "interaction_type": "click|focus|paste|type",
  "input_method": "file_upload|text_paste|manual_typing|url_input",
  "cv_upload_status": "empty|uploaded|processing|completed",
  "time_since_cv_upload": 45.2,
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:00",
  "app_version": "1.0.0"
}
```

### 10. JD Content Input Started
**Trigger**: User begins entering job description content
**Event Name**: `JD Input Started`
**Event Properties**:
```json
{
  "input_method": "text_paste|manual_typing|file_upload|url_input",
  "content_source": "job_board|company_website|manual_creation|other",
  "cv_upload_status": "completed|empty",
  "time_since_cv_upload": 60.5,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:15",
  "app_version": "1.0.0"
}
```

### 11. JD Content Pasted
**Trigger**: User pastes job description text
**Event Name**: `JD Content Pasted`
**Event Properties**:
```json
{
  "content_length": 1250,
  "word_count": 180,
  "paste_source": "clipboard",
  "content_structure_detected": true|false,
  "sections_detected": ["requirements", "responsibilities", "benefits"],
  "company_name_detected": true|false,
  "job_title_detected": "Software Engineer",
  "required_skills_count": 8,
  "content_quality_score": 78,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:18",
  "app_version": "1.0.0"
}
```

### 12. JD File Upload
**Trigger**: User uploads JD file instead of pasting text
**Event Name**: `JD File Uploaded`
**Event Properties**:
```json
{
  "file_name": "Software_Engineer_JD.pdf",
  "file_size_mb": 0.5,
  "file_type": "pdf|doc|docx|txt",
  "upload_duration": 2.1,
  "text_extraction_success": true|false,
  "extracted_content_length": 1450,
  "content_quality_score": 82,
  "company_name_detected": "Tech Corp Vietnam",
  "job_title_detected": "Senior Software Engineer",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:25",
  "app_version": "1.0.0"
}
```

### 13. JD URL Input
**Trigger**: User inputs job posting URL for automatic extraction
**Event Name**: `JD URL Input`
**Event Properties**:
```json
{
  "url_domain": "vietnamworks.com|topdev.vn|itviec.com|linkedin.com",
  "url_valid": true|false,
  "extraction_attempt": true,
  "extraction_success": true|false,
  "extracted_content_length": 1320,
  "extraction_duration": 5.8,
  "content_quality_score": 88,
  "job_board_detected": "VietnamWorks|TopDev|ITviec|LinkedIn",
  "company_name_extracted": "FPT Software",
  "job_title_extracted": "Frontend Developer",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:35",
  "app_version": "1.0.0"
}
```

## Analysis & Processing Events

### 14. CV-JD Analysis Started
**Trigger**: User clicks "Phân tích CV & JD" with both files uploaded
**Event Name**: `CV JD Analysis Started`
**Event Properties**:
```json
{
  "cv_file_name": "NguyenVanA_CV.pdf",
  "cv_file_size_mb": 1.2,
  "jd_input_method": "text_paste|file_upload|url_extraction",
  "jd_content_length": 1250,
  "analysis_type": "full_analysis",
  "both_files_ready": true,
  "estimated_analysis_time": 15,
  "user_premium": false,
  "analysis_credits_remaining": 3,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:00",
  "app_version": "1.0.0"
}
```

### 15. Analysis Progress Update
**Trigger**: AI analysis progress updates during processing
**Event Name**: `Analysis Progress Update`
**Event Properties**:
```json
{
  "analysis_stage": "cv_parsing|jd_parsing|matching|scoring|recommendations",
  "progress_percentage": 60,
  "elapsed_time": 8.5,
  "estimated_remaining": 6.5,
  "current_operation": "Extracting CV sections|Analyzing job requirements|Calculating match score",
  "ai_model_used": "gpt-3.5-turbo|gpt-4",
  "tokens_processed": 2500,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:08",
  "app_version": "1.0.0"
}
```

### 16. Analysis Completed
**Trigger**: CV-JD analysis successfully completes
**Event Name**: `Analysis Completed`
**Event Properties**:
```json
{
  "cv_file_name": "NguyenVanA_CV.pdf",
  "jd_input_method": "text_paste",
  "analysis_duration": 12.3,
  "match_score": 78,
  "missing_skills_count": 5,
  "matching_skills_count": 12,
  "improvement_suggestions": 8,
  "ats_compatibility_score": 82,
  "keyword_optimization_score": 75,
  "experience_match_score": 85,
  "ai_model_used": "gpt-3.5-turbo",
  "tokens_consumed": 3200,
  "analysis_success": true,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:12",
  "app_version": "1.0.0",
  "conversion_goal": "analysis_completion"
}
```

### 17. Analysis Error
**Trigger**: Analysis fails due to various reasons
**Event Name**: `Analysis Error`
**Event Properties**:
```json
{
  "error_type": "ai_service_error|timeout|invalid_content|quota_exceeded|network_error",
  "error_message": "AI service unavailable|Analysis timeout|Insufficient content quality",
  "error_stage": "cv_parsing|jd_parsing|matching|scoring",
  "analysis_progress": 45,
  "retry_available": true|false,
  "fallback_available": "manual_input|simplified_analysis",
  "ai_model_attempted": "gpt-3.5-turbo|gpt-4",
  "tokens_consumed": 1500,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:10",
  "app_version": "1.0.0"
}
```

## Navigation & Flow Events

### 18. Skip JD Upload
**Trigger**: User chooses to proceed without job description
**Event Name**: `JD Upload Skipped`
**Event Properties**:
```json
{
  "skip_reason": "no_specific_job|generic_cv|later",
  "cv_upload_status": "completed",
  "time_on_jd_section": 25.3,
  "skip_button_clicked": true,
  "navigation_destination": "CV Editor|Analysis Results",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:40",
  "app_version": "1.0.0"
}
```

### 19. Back to CV Upload
**Trigger**: User goes back to modify CV upload after JD input
**Event Name**: `Back to CV Upload`
**Event Properties**:
```json
{
  "current_step": "jd_upload|analysis",
  "cv_upload_status": "completed",
  "jd_input_status": "completed|in_progress|empty",
  "reason": "change_cv|upload_error|user_choice",
  "time_on_current_step": 85.2,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:30",
  "app_version": "1.0.0"
}
```

### 20. Proceed to Results
**Trigger**: User navigates to analysis results or CV editor
**Event Name**: `Proceed to Results`
**Event Properties**:
```json
{
  "destination": "Analysis Results|CV Editor|CV Workspace",
  "cv_uploaded": true,
  "jd_provided": true|false,
  "analysis_completed": true|false,
  "match_score": 78,
  "total_time_on_upload": 180.5,
  "files_processed": 2,
  "navigation_trigger": "analysis_complete|skip_analysis|manual_proceed",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:45",
  "app_version": "1.0.0"
}
```

## File Management Events

### 21. File Replace
**Trigger**: User replaces uploaded CV or JD file with new one
**Event Name**: `File Replaced`
**Event Properties**:
```json
{
  "file_type": "cv|jd",
  "old_file_name": "old_cv.pdf",
  "new_file_name": "updated_cv.pdf",
  "old_file_size_mb": 1.2,
  "new_file_size_mb": 1.5,
  "replacement_reason": "better_version|format_change|content_update",
  "time_since_original_upload": 120.5,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:15",
  "app_version": "1.0.0"
}
```

### 22. File Remove
**Trigger**: User removes uploaded file to start over
**Event Name**: `File Removed`
**Event Properties**:
```json
{
  "file_type": "cv|jd",
  "file_name": "NguyenVanA_CV.pdf",
  "file_size_mb": 1.2,
  "time_since_upload": 300.2,
  "removal_reason": "wrong_file|restart|privacy_concern",
  "processing_status": "completed|in_progress|failed",
  "analysis_completed": false,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:33:00",
  "app_version": "1.0.0"
}
```

## Mobile Experience Events

### 23. Mobile Upload Experience
**Trigger**: Mobile-specific upload interactions and challenges
**Event Name**: `Mobile Upload Interaction`
**Event Properties**:
```json
{
  "interaction_type": "file_picker_open|camera_access|document_scanner|orientation_change",
  "file_source": "gallery|camera|cloud_storage|file_manager",
  "upload_method": "native_picker|drag_drop_unsupported",
  "viewport_height": 667,
  "keyboard_shown": true|false,
  "orientation": "portrait|landscape",
  "upload_area_visible": true|false,
  "touch_target_adequate": true|false,
  "device_model": "iPhone 14 Pro|Samsung Galaxy S23",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:20",
  "app_version": "1.0.0"
}
```

## Implementation Notes

### File Processing Pipeline
- Complete tracking of file upload lifecycle
- Content extraction and analysis performance monitoring
- Error recovery and fallback mechanism tracking

### AI/LLM Integration Tracking
- Token consumption and cost monitoring
- Model performance and response time tracking
- Analysis quality and accuracy measurement

### User Experience Optimization
- Upload method preference analysis (drag-drop vs click)
- Mobile vs desktop usage patterns
- File format and size optimization insights

### Business Intelligence
- Conversion funnel from upload to CV completion
- Content quality correlation with user success
- Feature usage patterns for product improvements

### Privacy and Security
- File content never logged in analytics
- Processing metadata only for optimization
- User consent tracking for AI analysis

### Performance Monitoring
- Upload speed and reliability tracking
- Network condition impact analysis
- Server processing time optimization 