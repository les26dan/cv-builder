# Account Registration - Event Tracking Specification

## Overview
Event tracking for OkBuddy's account registration page to measure user conversion, registration funnel performance, and optimize user onboarding experience.

## Page Load Events

### 1. Registration Page Viewed
**Trigger**: User visits the registration page (/dang-ky)
**Event Name**: `Page Viewed`
**Event Properties**:
```json
{
  "page_name": "Registration Page",
  "page_url": "https://okbuddy.vn/dang-ky",
  "referrer_url": "string",
  "referrer_page": "Landing Page|CV Workspace|Direct",
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
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:00",
  "app_version": "1.0.0",
  "environment": "production|staging|development"
}
```

## Registration Process Events

### 2. Registration Started
**Trigger**: User focuses on first form field (Full Name)
**Event Name**: `Registration Started`
**Event Properties**:
```json
{
  "registration_method": "manual",
  "first_field_focused": "full_name",
  "time_on_page": 3.2,
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "input_method": "click|focus|tab",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "referrer_page": "Landing Page|CV Workspace|Direct",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:03",
  "app_version": "1.0.0"
}
```

### 3. Form Field Interaction
**Trigger**: User interacts with each form field (focus, blur, input)
**Event Name**: `Form Field Interaction`
**Event Properties**:
```json
{
  "field_name": "full_name|email|password|confirm_password",
  "field_label": "Họ và tên|Email|Mật khẩu|Xác nhận mật khẩu",
  "interaction_type": "focus|blur|input|validation",
  "field_order": 1|2|3|4,
  "time_on_field": 8.5,
  "character_count": 15,
  "is_valid": true|false,
  "validation_error": "none|required|invalid_email|password_mismatch|weak_password",
  "input_method": "keyboard|paste|autofill",
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:15",
  "app_version": "1.0.0"
}
```

### 4. Password Strength Check
**Trigger**: User types in password field and strength is evaluated
**Event Name**: `Password Strength Evaluated`
**Event Properties**:
```json
{
  "password_strength": "weak|medium|strong",
  "password_length": 8,
  "has_uppercase": true|false,
  "has_lowercase": true|false,
  "has_numbers": true|false,
  "has_special_chars": true|false,
  "strength_score": 3,
  "time_typing": 12.4,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:25",
  "app_version": "1.0.0"
}
```

### 5. CAPTCHA Started
**Trigger**: CAPTCHA challenge is displayed to user
**Event Name**: `CAPTCHA Started`
**Event Properties**:
```json
{
  "captcha_type": "math",
  "captcha_question": "7 + 3 = ?",
  "time_to_captcha": 45.2,
  "form_completion": 100,
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:10",
  "app_version": "1.0.0"
}
```

### 6. CAPTCHA Attempted
**Trigger**: User submits CAPTCHA answer
**Event Name**: `CAPTCHA Attempted`
**Event Properties**:
```json
{
  "captcha_success": true|false,
  "captcha_answer": "10",
  "correct_answer": "10",
  "time_to_solve": 5.8,
  "attempt_number": 1|2|3,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:16",
  "app_version": "1.0.0"
}
```

### 7. Terms Acceptance
**Trigger**: User checks the terms of service checkbox
**Event Name**: `Terms Accepted`
**Event Properties**:
```json
{
  "terms_accepted": true|false,
  "terms_link_clicked": true|false,
  "time_before_acceptance": 52.3,
  "form_completion": 100,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:20",
  "app_version": "1.0.0"
}
```

### 8. Registration Attempted
**Trigger**: User clicks "Đăng ký" button to submit form
**Event Name**: `Registration Attempted`
**Event Properties**:
```json
{
  "registration_method": "manual",
  "form_valid": true|false,
  "validation_errors": ["none"]|["email_invalid", "password_mismatch"],
  "time_on_page": 85.6,
  "total_form_time": 82.4,
  "field_interactions": 15,
  "captcha_attempts": 1,
  "terms_accepted": true|false,
  "email_domain": "gmail.com|yahoo.com|outlook.com|company.com",
  "is_business_email": true|false,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:25",
  "app_version": "1.0.0"
}
```

### 9. Registration Completed
**Trigger**: User account successfully created and confirmation shown
**Event Name**: `Registration Completed`
**Event Properties**:
```json
{
  "registration_method": "manual",
  "user_id": "user_12345",
  "email_domain": "gmail.com|yahoo.com|outlook.com|company.com",
  "is_business_email": true|false,
  "registration_success": true,
  "time_on_page": 88.3,
  "total_registration_time": 85.1,
  "total_field_interactions": 16,
  "captcha_attempts": 1,
  "validation_attempts": 2,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "utm_source": "string",
  "utm_campaign": "string",
  "referrer_page": "Landing Page|CV Workspace|Direct",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:28",
  "app_version": "1.0.0",
  "conversion_goal": "user_registration"
}
```

## Social Registration Events

### 10. Social Login Button Clicked
**Trigger**: User clicks Google or LinkedIn sign-up button
**Event Name**: `Social Registration Started`
**Event Properties**:
```json
{
  "registration_method": "google|linkedin",
  "button_position": "top|bottom",
  "time_on_page": 15.2,
  "manual_form_interaction": true|false,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:15",
  "app_version": "1.0.0"
}
```

### 11. Social OAuth Redirect
**Trigger**: User redirected to Google/LinkedIn OAuth page
**Event Name**: `OAuth Redirect Initiated`
**Event Properties**:
```json
{
  "oauth_provider": "google|linkedin",
  "redirect_success": true|false,
  "time_to_redirect": 1.2,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:16",
  "app_version": "1.0.0"
}
```

### 12. Social Registration Completed
**Trigger**: User returns from OAuth and account is created
**Event Name**: `Registration Completed`
**Event Properties**:
```json
{
  "registration_method": "google|linkedin",
  "oauth_provider": "google|linkedin",
  "user_id": "user_12345",
  "email_domain": "gmail.com|company.com",
  "is_business_email": true|false,
  "profile_complete": true|false,
  "avatar_provided": true|false,
  "registration_success": true,
  "total_oauth_time": 25.8,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:40",
  "app_version": "1.0.0",
  "conversion_goal": "user_registration"
}
```

## Navigation Events

### 13. Login Link Clicked
**Trigger**: User clicks "Đã có tài khoản? Đăng nhập" link
**Event Name**: `Login Link Clicked`
**Event Properties**:
```json
{
  "link_position": "bottom",
  "form_completion": 25|50|75|100,
  "time_on_page": 35.4,
  "fields_filled": 2,
  "registration_abandoned": true,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:35",
  "app_version": "1.0.0"
}
```

### 14. Terms Link Clicked
**Trigger**: User clicks "Điều khoản sử dụng" link
**Event Name**: `Terms Link Clicked`
**Event Properties**:
```json
{
  "link_type": "terms_of_service",
  "opens_in": "new_tab|same_tab",
  "form_completion": 95,
  "time_on_page": 75.2,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:15",
  "app_version": "1.0.0"
}
```

## Error Events

### 15. Registration Error
**Trigger**: Registration fails due to validation, server, or network error
**Event Name**: `Registration Error`
**Event Properties**:
```json
{
  "error_type": "validation|server|network|rate_limit|captcha",
  "error_message": "Email already exists|Invalid email format|Server timeout",
  "error_field": "email|password|captcha|general",
  "registration_method": "manual|google|linkedin",
  "form_completion": 100,
  "time_on_page": 90.5,
  "retry_attempt": 1|2|3,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:30",
  "app_version": "1.0.0"
}
```

### 16. Form Validation Error
**Trigger**: Real-time validation error appears on form field
**Event Name**: `Form Validation Error`
**Event Properties**:
```json
{
  "field_name": "email|password|confirm_password|full_name",
  "error_type": "required|invalid_format|password_mismatch|too_short|weak_password",
  "error_message": "Email không hợp lệ|Mật khẩu không khớp|Họ tên là bắt buộc",
  "field_value_length": 5,
  "time_on_field": 8.2,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:45",
  "app_version": "1.0.0"
}
```

### 17. OAuth Error
**Trigger**: Social registration fails (OAuth error, cancelled, etc.)
**Event Name**: `OAuth Error`
**Event Properties**:
```json
{
  "oauth_provider": "google|linkedin",
  "error_type": "cancelled|failed|network|permission_denied",
  "error_message": "User cancelled|OAuth failed|Network timeout",
  "time_in_oauth": 15.5,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:55",
  "app_version": "1.0.0"
}
```

## Engagement Events

### 18. Form Abandonment
**Trigger**: User leaves page with partially filled form (>30 seconds, >1 field filled)
**Event Name**: `Registration Abandoned`
**Event Properties**:
```json
{
  "abandonment_stage": "personal_info|password_setup|captcha|terms",
  "form_completion": 45,
  "fields_completed": 2,
  "time_on_page": 45.8,
  "last_field_touched": "email",
  "validation_errors_encountered": 1,
  "exit_method": "back_button|close_tab|navigation|timeout",
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:00",
  "app_version": "1.0.0"
}
```

### 19. Password Field Focus Time
**Trigger**: User spends significant time on password field (tracking password creation difficulty)
**Event Name**: `Password Creation Struggle`
**Event Properties**:
```json
{
  "time_on_password_field": 45.2,
  "password_attempts": 3,
  "strength_changes": 5,
  "final_strength": "medium",
  "backspace_count": 12,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:50",
  "app_version": "1.0.0"
}
```

### 20. Mobile Registration Experience
**Trigger**: Registration events specifically for mobile users
**Event Name**: `Mobile Registration Interaction`
**Event Properties**:
```json
{
  "interaction_type": "keyboard_shown|field_zoom|scroll_to_field|orientation_change",
  "field_name": "email|password|full_name",
  "viewport_height": 667,
  "keyboard_height": 300,
  "scroll_distance": 150,
  "orientation": "portrait|landscape",
  "device_model": "iPhone 14 Pro|Samsung Galaxy S23",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:25",
  "app_version": "1.0.0"
}
```

## Implementation Notes

### User Identification
- User ID assigned upon successful registration
- Session tracking throughout entire registration process
- Anonymous tracking before registration completion

### Privacy Compliance
- Passwords never logged or tracked
- Email addresses stored as domains only
- GDPR-compliant consent tracking

### A/B Testing Ready
- Events structured for easy A/B test analysis
- Registration method clearly tracked
- Form field order and design variations supported

### Conversion Funnel Analysis
- Complete registration funnel from page view to completion
- Drop-off point identification at each step
- Time-based analysis for optimization

### Performance Monitoring
- Form interaction latency tracking
- OAuth performance measurement
- CAPTCHA solving time analysis 