# Account Login - Event Tracking Specification

## Overview
Event tracking for OkBuddy's account login page to measure user authentication success, login funnel performance, and optimize returning user experience.

## Page Load Events

### 1. Login Page Viewed
**Trigger**: User visits the login page (/dang-nhap)
**Event Name**: `Page Viewed`
**Event Properties**:
```json
{
  "page_name": "Login Page",
  "page_url": "https://okbuddy.vn/dang-nhap",
  "referrer_url": "string",
  "referrer_page": "Landing Page|CV Workspace|Registration|Direct",
  "utm_source": "string",
  "utm_medium": "string",
  "utm_campaign": "string",
  "utm_content": "string",
  "utm_term": "string",
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
  "ip_address": "xxx.xxx.xxx.xxx",
  "user_agent": "string",
  "is_returning_visitor": true|false,
  "has_saved_credentials": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:00",
  "app_version": "1.0.0",
  "environment": "production|staging|development"
}
```

## Login Process Events

### 2. Login Started
**Trigger**: User focuses on first form field (Email)
**Event Name**: `Login Started`
**Event Properties**:
```json
{
  "login_method": "manual",
  "first_field_focused": "email",
  "time_on_page": 2.1,
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "input_method": "click|focus|tab",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "referrer_page": "Landing Page|CV Workspace|Registration|Direct",
  "has_saved_credentials": true|false,
  "autofill_detected": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:02",
  "app_version": "1.0.0"
}
```

### 3. Login Form Field Interaction
**Trigger**: User interacts with email or password fields
**Event Name**: `Form Field Interaction`
**Event Properties**:
```json
{
  "field_name": "email|password",
  "field_label": "Email|Mật khẩu",
  "interaction_type": "focus|blur|input|validation",
  "field_order": 1|2,
  "time_on_field": 5.2,
  "character_count": 20,
  "is_valid": true|false,
  "validation_error": "none|required|invalid_email|invalid_format",
  "input_method": "keyboard|paste|autofill",
  "autofill_used": true|false,
  "password_manager_detected": true|false,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:08",
  "app_version": "1.0.0"
}
```

### 4. Remember Me Toggle
**Trigger**: User checks/unchecks "Ghi nhớ đăng nhập" checkbox
**Event Name**: `Remember Me Toggled`
**Event Properties**:
```json
{
  "remember_me_enabled": true|false,
  "toggle_time": 25.3,
  "form_completion": 80,
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:25",
  "app_version": "1.0.0"
}
```

### 5. Login Attempted
**Trigger**: User clicks "Đăng nhập" button to submit form
**Event Name**: `Login Attempted`
**Event Properties**:
```json
{
  "login_method": "manual",
  "form_valid": true|false,
  "validation_errors": ["none"]|["email_required", "password_required"],
  "time_on_page": 35.8,
  "total_form_time": 33.6,
  "field_interactions": 8,
  "remember_me_checked": true|false,
  "email_domain": "gmail.com|yahoo.com|outlook.com|company.com",
  "is_business_email": true|false,
  "password_length": 8,
  "autofill_used": true|false,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:35",
  "app_version": "1.0.0"
}
```

### 6. Login Completed
**Trigger**: User successfully logs in and is redirected
**Event Name**: `Login Completed`
**Event Properties**:
```json
{
  "login_method": "manual",
  "user_id": "user_12345",
  "email_domain": "gmail.com|yahoo.com|outlook.com|company.com",
  "is_business_email": true|false,
  "login_success": true,
  "time_on_page": 38.2,
  "total_login_time": 36.1,
  "total_field_interactions": 9,
  "remember_me_used": true|false,
  "autofill_used": true|false,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "utm_source": "string",
  "utm_campaign": "string",
  "referrer_page": "Landing Page|CV Workspace|Registration|Direct",
  "redirect_destination": "CV Workspace|CV Upload|Previous Page",
  "user_type": "new|returning",
  "last_login": "2025-01-15 10:30:00",
  "days_since_last_login": 3,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:38",
  "app_version": "1.0.0",
  "conversion_goal": "user_login"
}
```

## Social Login Events

### 7. Social Login Button Clicked
**Trigger**: User clicks Google or LinkedIn login button
**Event Name**: `Social Login Started`
**Event Properties**:
```json
{
  "login_method": "google|linkedin",
  "button_position": "top|bottom",
  "time_on_page": 8.5,
  "manual_form_interaction": true|false,
  "form_fields_filled": 0|1|2,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:08",
  "app_version": "1.0.0"
}
```

### 8. Social OAuth Redirect
**Trigger**: User redirected to Google/LinkedIn OAuth page
**Event Name**: `OAuth Redirect Initiated`
**Event Properties**:
```json
{
  "oauth_provider": "google|linkedin",
  "redirect_success": true|false,
  "time_to_redirect": 0.8,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:09",
  "app_version": "1.0.0"
}
```

### 9. Social Login Completed
**Trigger**: User returns from OAuth and is logged in
**Event Name**: `Login Completed`
**Event Properties**:
```json
{
  "login_method": "google|linkedin",
  "oauth_provider": "google|linkedin",
  "user_id": "user_12345",
  "email_domain": "gmail.com|company.com",
  "is_business_email": true|false,
  "login_success": true,
  "total_oauth_time": 18.4,
  "oauth_cancelled": false,
  "profile_updated": true|false,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "redirect_destination": "CV Workspace|CV Upload|Previous Page",
  "user_type": "existing|new_via_oauth",
  "last_login": "2025-01-15 10:30:00",
  "days_since_last_login": 3,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:27",
  "app_version": "1.0.0",
  "conversion_goal": "user_login"
}
```

## Navigation Events

### 10. Registration Link Clicked
**Trigger**: User clicks "Chưa có tài khoản? Đăng ký ngay" link
**Event Name**: `Registration Link Clicked`
**Event Properties**:
```json
{
  "link_position": "bottom",
  "form_completion": 0|25|50|75|100,
  "time_on_page": 15.4,
  "fields_filled": 0|1|2,
  "login_abandoned": true,
  "autofill_available": true|false,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:15",
  "app_version": "1.0.0"
}
```

### 11. Forgot Password Clicked
**Trigger**: User clicks "Quên mật khẩu?" link
**Event Name**: `Forgot Password Clicked`
**Event Properties**:
```json
{
  "link_position": "below_password",
  "form_completion": 50|100,
  "time_on_page": 45.2,
  "email_filled": true|false,
  "password_attempts": 2,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:45",
  "app_version": "1.0.0"
}
```

## Error Events

### 12. Login Error
**Trigger**: Login fails due to invalid credentials, server error, or network issue
**Event Name**: `Login Error`
**Event Properties**:
```json
{
  "error_type": "invalid_credentials|account_locked|server_error|network_error|rate_limit",
  "error_message": "Invalid email or password|Account temporarily locked|Server unavailable",
  "login_method": "manual|google|linkedin",
  "form_completion": 100,
  "time_on_page": 42.5,
  "retry_attempt": 1|2|3,
  "email_domain": "gmail.com|yahoo.com|outlook.com",
  "password_length": 8,
  "autofill_used": true|false,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:42",
  "app_version": "1.0.0"
}
```

### 13. Form Validation Error
**Trigger**: Real-time validation error appears on form field
**Event Name**: `Form Validation Error`
**Event Properties**:
```json
{
  "field_name": "email|password",
  "error_type": "required|invalid_format|too_short",
  "error_message": "Email không hợp lệ|Mật khẩu là bắt buộc",
  "field_value_length": 3,
  "time_on_field": 5.8,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:25",
  "app_version": "1.0.0"
}
```

### 14. OAuth Error
**Trigger**: Social login fails (OAuth error, cancelled, etc.)
**Event Name**: `OAuth Error`
**Event Properties**:
```json
{
  "oauth_provider": "google|linkedin",
  "error_type": "cancelled|failed|network|permission_denied|account_not_found",
  "error_message": "User cancelled|OAuth failed|Network timeout|Account not found",
  "time_in_oauth": 12.3,
  "oauth_attempt": 1|2|3,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:35",
  "app_version": "1.0.0"
}
```

### 15. Account Lockout
**Trigger**: User account gets temporarily locked due to failed login attempts
**Event Name**: `Account Lockout Triggered`
**Event Properties**:
```json
{
  "failed_attempts": 5,
  "lockout_duration": 900,
  "email_domain": "gmail.com|yahoo.com|outlook.com",
  "time_between_attempts": [3.2, 5.1, 2.8, 4.5, 1.9],
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "ip_address": "xxx.xxx.xxx.xxx",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:15",
  "app_version": "1.0.0"
}
```

## Security Events

### 16. Suspicious Login Attempt
**Trigger**: Login attempt from unusual location, device, or pattern
**Event Name**: `Suspicious Login Detected`
**Event Properties**:
```json
{
  "suspicion_reasons": ["new_device", "unusual_location", "rapid_attempts"],
  "email_domain": "gmail.com|yahoo.com|outlook.com",
  "device_fingerprint": "hash_string",
  "location_differs": true|false,
  "time_since_last_login": 7200,
  "usual_login_country": "VN",
  "current_country": "US",
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "user_agent_differs": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:38",
  "app_version": "1.0.0"
}
```

### 17. Password Manager Interaction
**Trigger**: User interacts with password manager (browser or third-party)
**Event Name**: `Password Manager Used`
**Event Properties**:
```json
{
  "manager_type": "browser|third_party|unknown",
  "interaction_type": "autofill|save_prompt|update_prompt",
  "field_filled": "email|password|both",
  "time_to_fill": 0.3,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:05",
  "app_version": "1.0.0"
}
```

## Engagement Events

### 18. Login Abandonment
**Trigger**: User leaves page with partially filled form (>20 seconds, ≥1 field filled)
**Event Name**: `Login Abandoned`
**Event Properties**:
```json
{
  "abandonment_stage": "email_entry|password_entry|form_complete",
  "form_completion": 50,
  "fields_completed": 1,
  "time_on_page": 25.8,
  "last_field_touched": "email",
  "validation_errors_encountered": 0,
  "exit_method": "back_button|close_tab|navigation|timeout",
  "autofill_used": true|false,
  "social_login_considered": true|false,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:25",
  "app_version": "1.0.0"
}
```

### 19. Multiple Login Attempts
**Trigger**: User makes multiple login attempts within session
**Event Name**: `Multiple Login Attempts`
**Event Properties**:
```json
{
  "attempt_number": 2|3|4|5,
  "time_between_attempts": 15.3,
  "different_credentials": true|false,
  "email_changed": true|false,
  "password_changed": true|false,
  "error_types": ["invalid_credentials", "invalid_credentials"],
  "total_time_trying": 85.4,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:20",
  "app_version": "1.0.0"
}
```

### 20. Mobile Login Experience
**Trigger**: Login events specifically for mobile users
**Event Name**: `Mobile Login Interaction`
**Event Properties**:
```json
{
  "interaction_type": "keyboard_shown|field_zoom|scroll_to_field|orientation_change",
  "field_name": "email|password",
  "viewport_height": 667,
  "keyboard_height": 300,
  "scroll_distance": 100,
  "orientation": "portrait|landscape",
  "device_model": "iPhone 14 Pro|Samsung Galaxy S23",
  "touch_target_size": "adequate|small",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:15",
  "app_version": "1.0.0"
}
```

## Post-Login Events

### 21. Login Success Redirect
**Trigger**: User is redirected after successful login
**Event Name**: `Post Login Redirect`
**Event Properties**:
```json
{
  "redirect_destination": "CV Workspace|CV Upload|Previous Page|Dashboard",
  "redirect_reason": "new_user|returning_user|deep_link|default",
  "redirect_time": 1.2,
  "user_type": "new|returning",
  "cv_count": 0|1|2|5,
  "last_activity": "2025-01-15 10:30:00",
  "session_id": "string",
  "user_id": "user_12345",
  "timestamp": "2025-01-XX 14:30:39",
  "app_version": "1.0.0"
}
```

## Implementation Notes

### User Identification
- User ID tracked after successful login
- Session continuity from login to application
- Anonymous session tracking before authentication

### Security Monitoring
- Failed login attempt tracking
- Suspicious activity detection
- Account lockout prevention
- Password manager interaction analysis

### Privacy Compliance
- Passwords never logged or tracked
- Email addresses stored as domains only
- IP addresses masked for privacy
- GDPR-compliant user tracking

### Performance Monitoring
- Login form interaction latency
- OAuth provider performance
- Autofill effectiveness measurement
- Mobile experience optimization

### A/B Testing Ready
- Login method comparison (manual vs social)
- Form field optimization testing
- Social login button placement testing
- Remember me feature impact analysis 