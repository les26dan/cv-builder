# Landing Page - Event Tracking Specification

## Overview
Event tracking for OkBuddy's marketing landing page to measure user engagement, conversion funnel performance, and optimize user acquisition.

## Page Load Events

### 1. Landing Page Viewed
**Trigger**: User visits the landing page (first page load or navigation)
**Event Name**: `Page Viewed`
**Event Properties**:
```json
{
  "page_name": "Landing Page",
  "page_url": "https://ok-buddy.com",
  "referrer_url": "string",
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

## Hero Section Events

### 2. Hero CTA Clicked
**Trigger**: User clicks the main CTA button in hero section ("Tạo CV ngay")
**Event Name**: `Hero CTA Clicked`
**Event Properties**:
```json
{
  "cta_text": "Tạo CV ngay",
  "cta_position": "hero_section",
  "scroll_depth": 0,
  "time_on_page": 15.5,
  "is_mobile": true|false,
  "click_coordinates": "x: 640, y: 350",
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "user_id": "string|null",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:15",
  "app_version": "1.0.0",
  "environment": "production|staging|development"
}
```

### 3. Hero Section Viewed
**Trigger**: Hero section comes into viewport (scroll tracking)
**Event Name**: `Section Viewed`
**Event Properties**:
```json
{
  "section_name": "Hero Section",
  "section_position": 1,
  "scroll_depth": 0,
  "time_to_view": 0.5,
  "viewport_percentage": 100,
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:01",
  "app_version": "1.0.0"
}
```

## Problem Section Events

### 4. Problem Section Viewed
**Trigger**: Each problem section enters viewport (ATS, Keywords, Mass CV, Cover Letters)
**Event Name**: `Section Viewed`
**Event Properties**:
```json
{
  "section_name": "Problem ATS|Problem Keywords|Problem Mass CV|Problem Cover Letters",
  "section_position": 2|3|4|5,
  "scroll_depth": 25|50|75|90,
  "time_to_view": 5.2,
  "time_spent_viewing": 8.7,
  "viewport_percentage": 80,
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:10",
  "app_version": "1.0.0"
}
```

### 5. Problem Section CTA Clicked
**Trigger**: User clicks CTA button in any problem section
**Event Name**: `Problem Section CTA Clicked`
**Event Properties**:
```json
{
  "section_name": "Problem ATS|Problem Keywords|Problem Mass CV|Problem Cover Letters",
  "cta_text": "Giải quyết ngay",
  "section_position": 2|3|4|5,
  "scroll_depth": 40,
  "time_on_page": 45.3,
  "time_in_section": 12.1,
  "is_mobile": true|false,
  "click_coordinates": "x: 640, y: 850",
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:45",
  "app_version": "1.0.0"
}
```

## Testimonials Section Events

### 6. Testimonials Section Viewed
**Trigger**: Testimonials section enters viewport
**Event Name**: `Section Viewed`
**Event Properties**:
```json
{
  "section_name": "Testimonials Section",
  "section_position": 6,
  "scroll_depth": 85,
  "time_to_view": 25.8,
  "viewport_percentage": 70,
  "testimonials_count": 3,
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:55",
  "app_version": "1.0.0"
}
```

### 7. Testimonial Interaction
**Trigger**: User interacts with testimonial (hover, click, or view for >3 seconds)
**Event Name**: `Testimonial Viewed`
**Event Properties**:
```json
{
  "testimonial_id": "testimonial_1|testimonial_2|testimonial_3",
  "testimonial_author": "Nguyễn Văn A|Trần Thị B|Lê Văn C",
  "interaction_type": "view|hover|click",
  "time_spent": 5.2,
  "scroll_depth": 85,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:00",
  "app_version": "1.0.0"
}
```

## Waitlist Section Events

### 8. Waitlist Section Viewed
**Trigger**: Email signup section enters viewport
**Event Name**: `Section Viewed`
**Event Properties**:
```json
{
  "section_name": "Waitlist Section",
  "section_position": 7,
  "scroll_depth": 95,
  "time_to_view": 35.2,
  "viewport_percentage": 80,
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:05",
  "app_version": "1.0.0"
}
```

### 9. Email Input Started
**Trigger**: User clicks or focuses on email input field
**Event Name**: `Email Input Started`
**Event Properties**:
```json
{
  "input_field": "email",
  "section_name": "Waitlist Section",
  "scroll_depth": 95,
  "time_on_page": 65.8,
  "time_to_interaction": 30.6,
  "device_type": "desktop|mobile|tablet",
  "input_method": "click|focus|tab",
  "is_mobile": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:35",
  "app_version": "1.0.0"
}
```

### 10. Waitlist Signup Attempted
**Trigger**: User submits email signup form
**Event Name**: `Waitlist Signup Attempted`
**Event Properties**:
```json
{
  "email_domain": "gmail.com|yahoo.com|outlook.com|company.com",
  "email_valid": true|false,
  "signup_method": "form_submit|enter_key",
  "time_on_page": 85.2,
  "time_filling_form": 15.4,
  "scroll_depth": 95,
  "form_errors": "none|invalid_email|required_field",
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:20",
  "app_version": "1.0.0"
}
```

### 11. Waitlist Signup Completed
**Trigger**: Email successfully submitted and validated
**Event Name**: `Waitlist Signup Completed`
**Event Properties**:
```json
{
  "email_domain": "gmail.com|yahoo.com|outlook.com|company.com",
  "is_business_email": true|false,
  "signup_success": true,
  "time_on_page": 87.5,
  "total_form_time": 17.7,
  "scroll_depth": 95,
  "device_type": "desktop|mobile|tablet",
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "country": "VN|US|SG|JP",
  "utm_source": "string",
  "utm_campaign": "string",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:32:22",
  "app_version": "1.0.0",
  "conversion_goal": "waitlist_signup"
}
```

## Footer Events

### 12. Footer Link Clicked
**Trigger**: User clicks any link in footer section
**Event Name**: `Footer Link Clicked`
**Event Properties**:
```json
{
  "link_text": "Về chúng tôi|Liên hệ|Điều khoản|Chính sách bảo mật",
  "link_url": "/about|/contact|/terms|/privacy",
  "link_category": "navigation|legal|social|contact",
  "scroll_depth": 100,
  "time_on_page": 120.5,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:33:00",
  "app_version": "1.0.0"
}
```

## Scroll & Engagement Events

### 13. Scroll Depth Milestone
**Trigger**: User reaches 25%, 50%, 75%, 100% scroll depth
**Event Name**: `Scroll Depth Reached`
**Event Properties**:
```json
{
  "scroll_depth": 25|50|75|100,
  "time_to_depth": 15.5,
  "page_height": 3500,
  "viewport_height": 800,
  "scroll_speed": "slow|medium|fast",
  "device_type": "desktop|mobile|tablet",
  "is_mobile": true|false,
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:30",
  "app_version": "1.0.0"
}
```

### 14. Page Exit Intent
**Trigger**: User shows intent to leave page (mouse moves to close button, back button, etc.)
**Event Name**: `Exit Intent Detected`
**Event Properties**:
```json
{
  "exit_type": "mouse_leave|back_button|close_tab|navigation",
  "time_on_page": 45.8,
  "scroll_depth": 65,
  "sections_viewed": 4,
  "cta_interactions": 2,
  "email_entered": true|false,
  "device_type": "desktop|mobile|tablet",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:31:15",
  "app_version": "1.0.0"
}
```

## Error Events

### 15. Page Load Error
**Trigger**: JavaScript error, failed resource load, or page load timeout
**Event Name**: `Page Load Error`
**Event Properties**:
```json
{
  "error_type": "javascript|resource_load|timeout|network",
  "error_message": "string",
  "error_stack": "string (truncated)",
  "failed_resource": "css|js|image|font",
  "page_load_time": 8.5,
  "browser": "Chrome|Firefox|Safari|Edge|Opera",
  "browser_version": "119.0.0.0",
  "device_type": "desktop|mobile|tablet",
  "connection_type": "4g|wifi|slow-2g|3g",
  "session_id": "string",
  "timestamp": "2025-01-XX 14:30:00",
  "app_version": "1.0.0"
}
```

## Implementation Notes

### Event Timing
- All events include precise timestamps
- Time measurements in seconds with decimal precision
- Scroll tracking with throttling (max 1 event per second)

### Privacy Compliance
- IP addresses logged for analytics but masked for privacy
- Email addresses never stored in full, only domains
- GDPR-compliant data collection with user consent

### Data Quality
- Client-side validation before event sending
- Fallback properties for unavailable data
- Consistent property naming across all pages

### Performance
- Batched event sending to reduce network requests
- Local storage backup for offline event queuing
- Maximum 50 events per batch, 5-second intervals 