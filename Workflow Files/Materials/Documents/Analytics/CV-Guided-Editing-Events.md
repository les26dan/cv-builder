# CV Guided Editing - Event Tracking Specification

## Overview
Event tracking for CV Builder's CV guided editing interface to measure user engagement with AI suggestions, content creation patterns, and optimize the CV improvement workflow.

## Page Load Events

### 1. CV Editor Page Viewed
**Trigger**: User opens the CV guided editing interface
**Event Name**: `Page Viewed`
**Event Properties**:
```json
{
  "page_name": "CV Guided Editor",
  "page_url": "https://okbuddy.vn/editor/{cv_id}",
  "referrer_url": "string",
  "referrer_page": "CV Workspace|CV Upload|Analysis Results|Direct",
  "cv_id": "cv_abc123",
  "cv_name": "Software Engineer CV",
  "cv_status": "new|in_progress|completed",
  "cv_score": 65,
  "completion_percentage": 45,
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
  "has_job_description": true|false,
  "last_edited_section": "Work Experience",
  "time_since_last_edit": 3600,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:00",
  "app_version": "1.0.0",
  "environment": "production|staging|development"
}
```

## Section Navigation Events

### 2. CV Section Selected
**Trigger**: User clicks on different CV sections (Personal Info, Education, etc.)
**Event Name**: `CV Section Selected`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "section_name": "Personal Info|Education|Work Experience|Skills|Summary|Projects",
  "section_order": 1|2|3|4|5|6,
  "previous_section": "Work Experience",
  "section_completion": 80,
  "time_in_previous_section": 45.2,
  "navigation_method": "click|keyboard|auto_advance",
  "section_has_suggestions": true|false,
  "pending_suggestions_count": 3,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:15",
  "app_version": "1.0.0"
}
```

### 3. Section Progress Updated
**Trigger**: Section completion percentage changes
**Event Name**: `Section Progress Updated`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "section_name": "Work Experience",
  "previous_completion": 60,
  "new_completion": 80,
  "progress_increase": 20,
  "fields_completed": 4,
  "total_fields": 5,
  "auto_save_triggered": true,
  "suggestions_applied": 2,
  "manual_edits": 3,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:45",
  "app_version": "1.0.0"
}
```

## AI Suggestion Events

### 4. AI Suggestions Generated
**Trigger**: AI generates content suggestions for current section
**Event Name**: `AI Suggestions Generated`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "suggestion_type": "content_improvement|missing_content|optimization|keyword_enhancement",
  "suggestions_count": 5,
  "generation_duration": 3.2,
  "ai_model_used": "gpt-3.5-turbo|gpt-4",
  "tokens_consumed": 1500,
  "user_context_used": "job_description|user_profile|previous_sections",
  "suggestion_quality_score": 85,
  "personalization_level": "high|medium|low",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:00",
  "app_version": "1.0.0"
}
```

### 5. Suggestion Viewed
**Trigger**: User views/reads an AI suggestion
**Event Name**: `Suggestion Viewed`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "suggestion_id": "sugg_xyz789",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "suggestion_type": "content_improvement",
  "suggestion_text": "Added quantified achievements and industry-specific keywords...",
  "suggestion_length": 120,
  "view_duration": 8.5,
  "suggestion_position": 2,
  "total_suggestions": 5,
  "user_scrolled_to_view": true|false,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:05",
  "app_version": "1.0.0"
}
```

### 6. Suggestion Applied
**Trigger**: User accepts and applies an AI suggestion
**Event Name**: `Suggestion Applied`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "suggestion_id": "sugg_xyz789",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "suggestion_type": "content_improvement",
  "suggestion_length": 120,
  "application_method": "click_apply|drag_drop|copy_paste",
  "time_before_application": 12.3,
  "field_previous_length": 80,
  "field_new_length": 150,
  "suggestion_position": 2,
  "auto_save_triggered": true,
  "cv_score_change": 3,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:17",
  "app_version": "1.0.0"
}
```

### 7. Suggestion Rejected
**Trigger**: User dismisses or rejects an AI suggestion
**Event Name**: `Suggestion Rejected`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "suggestion_id": "sugg_xyz789",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "suggestion_type": "content_improvement",
  "rejection_method": "click_dismiss|ignore|manual_override",
  "rejection_reason": "not_relevant|too_generic|prefer_manual|inaccurate",
  "time_before_rejection": 15.8,
  "suggestion_position": 3,
  "view_count": 2,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:25",
  "app_version": "1.0.0"
}
```

### 8. Suggestion Modified
**Trigger**: User edits/customizes an AI suggestion before applying
**Event Name**: `Suggestion Modified`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "suggestion_id": "sugg_xyz789",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "original_suggestion_length": 120,
  "modified_suggestion_length": 95,
  "modification_type": "shortened|expanded|rewritten|stylistic",
  "edit_time": 25.4,
  "word_changes": 8,
  "custom_content_added": true|false,
  "modification_quality_score": 88,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:40",
  "app_version": "1.0.0"
}
```

## Manual Content Creation Events

### 9. Manual Content Added
**Trigger**: User manually types/adds content without using suggestions
**Event Name**: `Manual Content Added`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "content_length": 85,
  "word_count": 12,
  "typing_duration": 45.2,
  "typing_speed_wpm": 16,
  "backspace_count": 8,
  "paste_used": false,
  "suggestions_available": true|false,
  "suggestions_ignored": 3,
  "field_previously_empty": true|false,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:00",
  "app_version": "1.0.0"
}
```

### 10. Content Edited
**Trigger**: User modifies existing content in a field
**Event Name**: `Content Edited`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "edit_type": "addition|deletion|replacement|formatting",
  "content_before_length": 120,
  "content_after_length": 135,
  "edit_duration": 18.7,
  "characters_changed": 25,
  "content_source": "manual|ai_suggestion|previous_version",
  "edit_trigger": "user_initiated|suggestion_prompt",
  "auto_save_triggered": true,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:20",
  "app_version": "1.0.0"
}
```

### 11. Content Deleted
**Trigger**: User removes content from a field
**Event Name**: `Content Deleted`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "deletion_type": "field_cleared|partial_deletion|bulk_select_delete",
  "content_length_before": 150,
  "content_length_after": 45,
  "content_deleted_length": 105,
  "deletion_method": "backspace|delete_key|select_delete|clear_button",
  "content_source": "manual|ai_suggestion",
  "undo_available": true,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:35",
  "app_version": "1.0.0"
}
```

## CV Scoring & Feedback Events

### 12. CV Score Updated
**Trigger**: CV score recalculates after content changes
**Event Name**: `CV Score Updated`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "previous_score": 72,
  "new_score": 78,
  "score_change": 6,
  "score_category": "content|keywords|formatting|completeness",
  "trigger_action": "suggestion_applied|manual_edit|section_completed",
  "section_affected": "Work Experience",
  "field_affected": "job_description",
  "overall_completion": 85,
  "benchmark_score": 80,
  "above_benchmark": true|false,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:45",
  "app_version": "1.0.0"
}
```

### 13. Feedback Tooltip Viewed
**Trigger**: User hovers/clicks on score explanation or feedback tooltip
**Event Name**: `Feedback Tooltip Viewed`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "tooltip_type": "score_explanation|improvement_tip|field_guidance|best_practice",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "tooltip_content": "Add quantified achievements to improve your score",
  "view_duration": 5.2,
  "interaction_method": "hover|click|touch",
  "tooltip_position": "right|left|top|bottom",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:33:00",
  "app_version": "1.0.0"
}
```

## Progress & Completion Events

### 14. Section Completed
**Trigger**: User completes all required fields in a section
**Event Name**: `Section Completed`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "section_name": "Work Experience",
  "time_to_complete": 480.5,
  "fields_completed": 5,
  "suggestions_used": 3,
  "manual_inputs": 2,
  "total_content_length": 450,
  "section_score": 88,
  "completion_order": 3,
  "auto_advance_to_next": true|false,
  "overall_cv_completion": 75,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:35:00",
  "app_version": "1.0.0"
}
```

### 15. CV Completion Milestone
**Trigger**: CV reaches completion milestones (25%, 50%, 75%, 100%)
**Event Name**: `CV Completion Milestone`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "completion_percentage": 75,
  "milestone_type": "quarter|half|three_quarter|complete",
  "time_to_milestone": 1200.8,
  "sections_completed": 3,
  "total_sections": 6,
  "current_score": 82,
  "suggestions_used_total": 12,
  "manual_content_ratio": 0.6,
  "content_quality_score": 85,
  "estimated_time_remaining": 15,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:38:00",
  "app_version": "1.0.0"
}
```

### 16. CV Preview Generated
**Trigger**: User generates or views CV preview
**Event Name**: `CV Preview Generated`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "preview_type": "pdf|html|print",
  "cv_completion": 85,
  "cv_score": 88,
  "template_used": "modern|classic|creative",
  "preview_generation_time": 2.3,
  "preview_file_size_mb": 0.6,
  "sections_included": 5,
  "page_count": 2,
  "preview_trigger": "manual_request|auto_preview|section_complete",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:40:00",
  "app_version": "1.0.0"
}
```

## Auto-save & Data Management Events

### 17. Auto-save Triggered
**Trigger**: Content automatically saves to prevent data loss
**Event Name**: `Auto-save Triggered`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "save_trigger": "content_change|time_interval|section_navigation|idle_timeout",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "content_changed": true|false,
  "save_duration": 0.8,
  "data_size_kb": 2.5,
  "save_success": true|false,
  "changes_count": 3,
  "time_since_last_save": 30.2,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:33:15",
  "app_version": "1.0.0"
}
```

### 18. Manual Save
**Trigger**: User manually saves CV progress
**Event Name**: `Manual Save Triggered`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "save_method": "ctrl_s|save_button|menu_save",
  "cv_completion": 70,
  "unsaved_changes": true|false,
  "changes_count": 5,
  "time_since_last_auto_save": 45.8,
  "save_duration": 1.2,
  "save_success": true|false,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:34:00",
  "app_version": "1.0.0"
}
```

## Error & Recovery Events

### 19. Content Load Error
**Trigger**: Error loading CV content or suggestions
**Event Name**: `Content Load Error`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "error_type": "cv_content|suggestions|auto_save|preview",
  "error_message": "Failed to load CV data|AI service unavailable|Save failed",
  "error_stage": "page_load|content_edit|suggestion_generation|save_operation",
  "section_affected": "Work Experience",
  "retry_attempt": 1|2|3,
  "fallback_used": "cached_content|offline_mode|simplified_editor",
  "recovery_successful": true|false,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "network_type": "wifi|4g|3g|slow-2g",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:05",
  "app_version": "1.0.0"
}
```

### 20. Content Recovery
**Trigger**: System recovers unsaved content after error or browser refresh
**Event Name**: `Content Recovered`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "recovery_source": "localStorage|sessionStorage|server_backup|auto_save",
  "content_recovered": true|false,
  "sections_recovered": 3,
  "data_age_minutes": 5,
  "recovery_trigger": "page_refresh|browser_crash|session_restore",
  "content_loss": "none|partial|significant",
  "user_notified": true|false,
  "recovery_duration": 1.5,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:02",
  "app_version": "1.0.0"
}
```

## User Experience Events

### 21. Editor Session Summary
**Trigger**: User leaves editor or session ends
**Event Name**: `Editor Session Summary`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "session_duration": 1800.5,
  "sections_visited": 4,
  "sections_completed": 2,
  "suggestions_generated": 15,
  "suggestions_applied": 8,
  "suggestions_rejected": 4,
  "manual_edits": 12,
  "content_added_length": 320,
  "cv_score_start": 65,
  "cv_score_end": 85,
  "completion_start": 40,
  "completion_end": 80,
  "auto_saves": 25,
  "manual_saves": 3,
  "preview_generated": true|false,
  "most_productive_section": "Work Experience",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:50:00",
  "app_version": "1.0.0"
}
```

### 22. Mobile Editor Experience
**Trigger**: Mobile-specific editor interactions
**Event Name**: `Mobile Editor Interaction`
**Event Properties**:
```json
{
  "interaction_type": "keyboard_shown|field_zoom|scroll_to_field|orientation_change|section_swipe",
  "section_name": "Work Experience",
  "field_name": "job_description",
  "viewport_height": 667,
  "keyboard_height": 300,
  "field_in_view": true|false,
  "scroll_distance": 150,
  "orientation": "portrait|landscape",
  "touch_target_adequate": true|false,
  "typing_difficulty": "easy|moderate|difficult",
  "device_model": "iPhone 14 Pro|Samsung Galaxy S23",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:35:30",
  "app_version": "1.0.0"
}
```

### 23. AI Assistance Effectiveness
**Trigger**: Analytics event measuring AI suggestion quality and adoption
**Event Name**: `AI Assistance Analytics`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "section_name": "Work Experience",
  "suggestions_generated": 8,
  "suggestions_applied": 5,
  "suggestions_modified": 2,
  "suggestions_rejected": 1,
  "adoption_rate": 0.75,
  "modification_rate": 0.25,
  "average_suggestion_quality": 82,
  "user_satisfaction_implied": "high|medium|low",
  "ai_model_performance": 88,
  "personalization_effectiveness": 85,
  "content_improvement_score": 15,
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:40:00",
  "app_version": "1.0.0"
}
```

## Implementation Notes

### Content Privacy
- Actual CV content never logged, only metadata and analytics
- User privacy maintained while gathering optimization insights
- Content length and structure tracked without exposing personal information

### AI Performance Monitoring
- Token consumption and cost tracking for LLM optimization
- Suggestion quality scoring for model improvement
- User interaction patterns with AI recommendations

### Real-time Collaboration Support
- Auto-save frequency and reliability monitoring
- Content synchronization performance tracking
- Conflict resolution and data integrity measurement

### Personalization Analytics
- User preference learning from suggestion interactions
- Content creation pattern analysis for improved recommendations
- Adaptation of AI suggestions based on user behavior

### Conversion Optimization
- CV completion funnel analysis from first edit to final version
- Feature adoption rates for guided vs manual editing
- Time-to-completion optimization insights 