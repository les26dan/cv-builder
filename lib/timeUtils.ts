/**
 * Convert timestamps to Vietnamese short formats according to project requirements:
 * - < 1 hour: Display rounded minute (e.g "30 phút trước")
 * - 1 hour to 24 hour: Display rounded hour (e.g "2 giờ trước")
 * - 24 hour to 7 days: Display rounded day (e.g "4 ngày trước")
 * - > 7 days: Display rounded week (e.g "10 tuần trước")
 * - > 52 weeks: Display "Hơn 1 năm trước"
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  
  // Convert to different time units
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7))

  if (minutes < 60) {
    // Less than 1 hour: show minutes
    return `${Math.max(1, minutes)} phút trước`
  } else if (hours < 24) {
    // 1 hour to 24 hours: show hours
    return `${hours} giờ trước`
  } else if (days < 7) {
    // 24 hours to 7 days: show days
    return `${days} ngày trước`
  } else if (weeks < 52) {
    // > 7 days to less than 52 weeks: show weeks
    return `${weeks} tuần trước`
  } else {
    // >= 52 weeks: show years
    return 'Hơn 1 năm trước'
  }
} 