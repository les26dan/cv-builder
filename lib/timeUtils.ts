/**
 * Convert timestamps to localized time formats based on user language preference
 * Supports English and Vietnamese with proper formatting
 */
export function formatTimeAgo(date: Date, language: 'en' | 'vi' = 'en'): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  
  // Convert to different time units
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7))

  // Language-specific formatting
  const formats = {
    en: {
      minutes: (n: number) => n === 1 ? '1 minute ago' : `${n} minutes ago`,
      hours: (n: number) => n === 1 ? '1 hour ago' : `${n} hours ago`,
      days: (n: number) => n === 1 ? '1 day ago' : `${n} days ago`,
      weeks: (n: number) => n === 1 ? '1 week ago' : `${n} weeks ago`,
      years: 'Over 1 year ago'
    },
    vi: {
      minutes: (n: number) => `${n} phút trước`,
      hours: (n: number) => `${n} giờ trước`,
      days: (n: number) => `${n} ngày trước`,
      weeks: (n: number) => `${n} tuần trước`,
      years: 'Hơn 1 năm trước'
    }
  }

  const langFormats = formats[language]

  if (minutes < 60) {
    // Less than 1 hour: show minutes
    return langFormats.minutes(Math.max(1, minutes))
  } else if (hours < 24) {
    // 1 hour to 24 hours: show hours
    return langFormats.hours(hours)
  } else if (days < 7) {
    // 24 hours to 7 days: show days
    return langFormats.days(days)
  } else if (weeks < 52) {
    // > 7 days to less than 52 weeks: show weeks
    return langFormats.weeks(weeks)
  } else {
    // >= 52 weeks: show years
    return langFormats.years
  }
} 