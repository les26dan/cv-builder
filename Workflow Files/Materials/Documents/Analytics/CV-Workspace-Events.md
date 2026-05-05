# CV Workspace - Event Tracking Specification

## Overview
Event tracking for CV Builder's CV workspace dashboard to measure user engagement, CV management behavior, and optimize the CV workflow experience.

## Page Load Events

### 1. CV Workspace Viewed
**Trigger**: User visits the CV workspace dashboard
**Event Name**: `Page Viewed`
**Event Properties**:
```json
{
  "page_name": "CV Workspace",
  "page_url": "https://okbuddy.vn/workspace",
  "referrer_url": "string",
  "referrer_page": "Login|Registration|CV Upload|CV Editor|Direct",
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
  "cv_count": 3,
  "cv_statuses": ["completed", "in_progress", "new"],
  "workspace_empty": false,
  "is_first_visit": true|false,
  "last_visit": "2025-01-15 10:30:00",
  "days_since_last_visit": 2,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:00",
  "app_version": "1.0.0",
  "environment": "production|staging|development"
}
```

## CV Management Events

### 2. CV Creation Started
**Trigger**: User clicks "Tạo CV mới" or "Bắt đầu ngay" button
**Event Name**: `CV Creation Started`
**Event Properties**:
```json
{
  "creation_trigger": "create_new_button|empty_state_button|header_button",
  "current_cv_count": 2,
  "max_cv_limit": 5,
  "time_on_page": 15.8,
  "workspace_state": "empty|populated",
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:15",
  "app_version": "1.0.0"
}
```

### 3. CV Creation Rate Limited
**Trigger**: User attempts to create CV but hits the 5 incomplete CV limit
**Event Name**: `CV Creation Rate Limited`
**Event Properties**:
```json
{
  "current_cv_count": 5,
  "incomplete_cv_count": 5,
  "rate_limit_hit": true,
  "error_message": "Bạn đã có quá nhiều CV đang thực hiện",
  "time_on_page": 25.3,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:25",
  "app_version": "1.0.0"
}
```

### 4. CV Card Interaction
**Trigger**: User interacts with CV card (hover, click, view details)
**Event Name**: `CV Card Interaction`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "cv_name": "Software Engineer CV",
  "cv_status": "completed|in_progress|new",
  "cv_score": 85,
  "interaction_type": "hover|click|view",
  "card_position": 1,
  "total_cvs_visible": 4,
  "time_hovering": 2.3,
  "last_updated": "2025-01-15 10:30:00",
  "days_since_update": 3,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:20",
  "app_version": "1.0.0"
}
```

### 5. CV Continue Action
**Trigger**: User clicks "Tiếp tục" button on in-progress CV
**Event Name**: `CV Continue Clicked`
**Event Properties**:
```json
{
  "cv_id": "cv_abc123",
  "cv_name": "Software Engineer CV",
  "cv_status": "in_progress",
  "cv_score": 65,
  "completion_percentage": 70,
  "last_section_edited": "Work Experience",
  "time_since_last_edit": 7200,
  "navigation_destination": "CV Editor",
  "card_position": 2,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:30",
  "app_version": "1.0.0"
}
```

### 6. CV Edit Action
**Trigger**: User clicks "Chỉnh sửa" button on completed CV
**Event Name**: `CV Edit Clicked`
**Event Properties**:
```json
{
  "cv_id": "cv_xyz789",
  "cv_name": "Marketing Manager CV",
  "cv_status": "completed",
  "cv_score": 92,
  "completion_percentage": 100,
  "download_count": 3,
  "last_download": "2025-01-10 14:20:00",
  "navigation_destination": "CV Editor",
  "card_position": 1,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:45",
  "app_version": "1.0.0"
}
```

### 7. CV Download Action
**Trigger**: User clicks "Tải xuống" button on CV
**Event Name**: `CV Downloaded`
**Event Properties**:
```json
{
  "cv_id": "cv_xyz789",
  "cv_name": "Marketing Manager CV",
  "cv_status": "completed",
  "cv_score": 92,
  "download_format": "pdf",
  "file_size_mb": 0.8,
  "download_count": 4,
  "time_since_completion": 86400,
  "card_position": 1,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:00",
  "app_version": "1.0.0",
  "conversion_goal": "cv_download"
}
```

### 8. CV Delete Initiated
**Trigger**: User clicks delete (trash) icon on CV card
**Event Name**: `CV Delete Initiated`
**Event Properties**:
```json
{
  "cv_id": "cv_def456",
  "cv_name": "Old CV",
  "cv_status": "new|in_progress|completed",
  "cv_score": 45,
  "completion_percentage": 30,
  "card_position": 3,
  "total_cvs": 4,
  "time_since_creation": 172800,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:15",
  "app_version": "1.0.0"
}
```

### 9. CV Delete Confirmed
**Trigger**: User confirms deletion in modal "Bạn có chắc chắn muốn xoá CV này?"
**Event Name**: `CV Delete Confirmed`
**Event Properties**:
```json
{
  "cv_id": "cv_def456",
  "cv_name": "Old CV",
  "cv_status": "new|in_progress|completed",
  "cv_score": 45,
  "completion_percentage": 30,
  "deletion_confirmed": true,
  "time_to_confirm": 3.5,
  "remaining_cvs": 3,
  "card_position": 3,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:18",
  "app_version": "1.0.0"
}
```

### 10. CV Delete Cancelled
**Trigger**: User cancels deletion in confirmation modal
**Event Name**: `CV Delete Cancelled`
**Event Properties**:
```json
{
  "cv_id": "cv_def456",
  "cv_name": "Old CV",
  "cv_status": "new|in_progress|completed",
  "cv_score": 45,
  "deletion_cancelled": true,
  "time_to_cancel": 2.1,
  "card_position": 3,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:17",
  "app_version": "1.0.0"
}
```

## Navigation Events

### 11. Header Logo Clicked
**Trigger**: User clicks CV Builder logo in header
**Event Name**: `Logo Clicked`
**Event Properties**:
```json
{
  "logo_position": "header",
  "current_page": "CV Workspace",
  "navigation_destination": "Landing Page",
  "time_on_page": 45.2,
  "cv_interactions": 2,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:30",
  "app_version": "1.0.0"
}
```

### 12. User Profile Menu Opened
**Trigger**: User clicks on profile avatar or name
**Event Name**: `User Profile Menu Opened`
**Event Properties**:
```json
{
  "menu_trigger": "avatar|name_click",
  "user_name": "Nguyễn Văn A",
  "profile_complete": true|false,
  "avatar_type": "initials|uploaded|default",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:45",
  "app_version": "1.0.0"
}
```

### 13. Logout Clicked
**Trigger**: User clicks logout option from profile menu
**Event Name**: `Logout Initiated`
**Event Properties**:
```json
{
  "logout_method": "profile_menu",
  "session_duration": 1800,
  "cv_interactions": 3,
  "cvs_created": 0,
  "cvs_downloaded": 1,
  "time_on_workspace": 120.5,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:00",
  "app_version": "1.0.0"
}
```

## Auto-save & Status Events

### 14. Auto-save Status Change
**Trigger**: Auto-save status changes (saving, saved, error)
**Event Name**: `Auto-save Status Changed`
**Event Properties**:
```json
{
  "status": "saving|saved|error",
  "previous_status": "idle|saving|saved",
  "operation_type": "cv_creation|cv_deletion|data_sync",
  "operation_duration": 1.2,
  "affected_cv_id": "cv_abc123",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:35",
  "app_version": "1.0.0"
}
```

### 15. Data Sync Success
**Trigger**: CV data successfully synced with server
**Event Name**: `Data Sync Completed`
**Event Properties**:
```json
{
  "sync_type": "auto|manual|on_action",
  "sync_duration": 0.8,
  "items_synced": 3,
  "sync_trigger": "cv_creation|cv_deletion|periodic",
  "network_type": "wifi|4g|3g|slow-2g",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:36",
  "app_version": "1.0.0"
}
```

## Workspace Performance Events

### 16. Page Load Performance
**Trigger**: Workspace page finishes loading
**Event Name**: `Page Load Performance`
**Event Properties**:
```json
{
  "page_load_time": 2.3,
  "cv_load_time": 1.1,
  "cv_count": 4,
  "largest_contentful_paint": 1.8,
  "first_input_delay": 0.1,
  "cumulative_layout_shift": 0.05,
  "time_to_interactive": 2.0,
  "network_type": "wifi|4g|3g|slow-2g",
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:02",
  "app_version": "1.0.0"
}
```

### 17. CV Grid Scroll
**Trigger**: User scrolls through CV grid (for users with many CVs)
**Event Name**: `CV Grid Scrolled`
**Event Properties**:
```json
{
  "scroll_depth": 50,
  "cvs_visible": 6,
  "total_cvs": 12,
  "scroll_direction": "down|up",
  "time_to_scroll": 8.5,
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:45",
  "app_version": "1.0.0"
}
```

## Error Events

### 18. CV Load Error
**Trigger**: Error loading CV data from server
**Event Name**: `CV Load Error`
**Event Properties**:
```json
{
  "error_type": "network|server|authentication|timeout",
  "error_message": "Failed to load CV data|Network timeout|Unauthorized",
  "affected_cv_id": "cv_abc123|all",
  "retry_attempt": 1|2|3,
  "fallback_used": "localStorage|mock_data|empty_state",
  "time_since_page_load": 5.2,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "network_type": "wifi|4g|3g|slow-2g",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:05",
  "app_version": "1.0.0"
}
```

### 19. Authentication Error
**Trigger**: User authentication fails on workspace access
**Event Name**: `Authentication Error`
**Event Properties**:
```json
{
  "error_type": "token_expired|invalid_token|no_token|server_error",
  "error_message": "Authentication token expired|Invalid user session",
  "redirect_to": "Login Page",
  "time_on_page": 3.1,
  "auth_method_used": "manual|google|linkedin",
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:03",
  "app_version": "1.0.0"
}
```

### 20. CV Operation Error
**Trigger**: Error during CV creation, deletion, or update
**Event Name**: `CV Operation Error`
**Event Properties**:
```json
{
  "operation_type": "create|delete|update|download",
  "error_type": "network|server|validation|rate_limit|storage",
  "error_message": "Creation failed|Delete operation failed|Download unavailable",
  "cv_id": "cv_abc123",
  "cv_name": "Software Engineer CV",
  "retry_available": true|false,
  "fallback_action": "retry|cache|offline_mode",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:20",
  "app_version": "1.0.0"
}
```

## Engagement Events

### 21. Empty State Interaction
**Trigger**: User interacts with empty workspace state
**Event Name**: `Empty State Interaction`
**Event Properties**:
```json
{
  "interaction_type": "view|cta_click|illustration_click",
  "time_viewing_empty_state": 15.3,
  "cta_text": "Bắt đầu ngay",
  "is_first_time_user": true|false,
  "registration_date": "2025-01-XX",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:15",
  "app_version": "1.0.0"
}
```

### 22. CV Status Distribution Viewed
**Trigger**: Analytics event for CV status analysis
**Event Name**: `CV Status Distribution`
**Event Properties**:
```json
{
  "total_cvs": 5,
  "completed_cvs": 2,
  "in_progress_cvs": 2,
  "new_cvs": 1,
  "average_cv_score": 78.5,
  "highest_score": 95,
  "lowest_score": 45,
  "cvs_with_high_score": 1,
  "last_cv_created": "2025-01-15 10:30:00",
  "days_since_last_creation": 2,
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:00",
  "app_version": "1.0.0"
}
```

### 23. Mobile Workspace Experience
**Trigger**: Mobile-specific workspace interactions
**Event Name**: `Mobile Workspace Interaction`
**Event Properties**:
```json
{
  "interaction_type": "swipe|touch|pinch|orientation_change",
  "cv_card_touched": "cv_abc123",
  "swipe_direction": "left|right|up|down",
  "orientation": "portrait|landscape",
  "viewport_height": 667,
  "grid_columns": 1|2,
  "touch_target_adequate": true|false,
  "device_model": "iPhone 14 Pro|Samsung Galaxy S23",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:30",
  "app_version": "1.0.0"
}
```

### 24. Workspace Session Summary
**Trigger**: User leaves workspace or session ends
**Event Name**: `Workspace Session Summary`
**Event Properties**:
```json
{
  "session_duration": 180.5,
  "cv_interactions": 8,
  "cvs_created": 1,
  "cvs_edited": 2,
  "cvs_downloaded": 1,
  "cvs_deleted": 0,
  "pages_visited": ["CV Workspace", "CV Editor"],
  "most_interacted_cv": "cv_abc123",
  "peak_engagement_time": 45.2,
  "bounce_rate": false,
  "return_likelihood": "high|medium|low",
  "device_type": "desktop|mobile|tablet",
  "user_id": "user_12345",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:33:00",
  "app_version": "1.0.0"
}
```

## Implementation Notes

### User Context
- All events include authenticated user ID
- CV ownership and permissions tracked
- User behavior patterns analyzed for optimization

### Performance Tracking
- Page load and CV operation performance monitoring
- Network condition impact on user experience
- Mobile vs desktop usage patterns

### Privacy Compliance
- CV content never logged, only metadata
- User data aggregated for analytics
- GDPR-compliant user tracking with consent

### Business Intelligence
- CV creation and completion funnel analysis
- User engagement and retention metrics
- Feature adoption and usage patterns
- A/B testing support for UI optimizations

### Error Recovery
- Comprehensive error tracking for reliability
- Fallback mechanism performance monitoring
- User experience impact of errors measured 