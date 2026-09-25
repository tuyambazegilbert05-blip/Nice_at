/**
 * Date and time utilities for NiCE Club Rwanda attendance platform.
 * Canonical timezone is Africa/Kigali (UTC+2).
 */

export const RWANDA_TIMEZONE = 'Africa/Kigali'

/**
 * Formats a date into a localized human-readable string in Kigali time.
 * e.g. "14 Aug 2026"
 */
export function formatDate(
  dateInput: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: RWANDA_TIMEZONE,
  }
): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return 'Invalid Date'
  return new Intl.DateTimeFormat('en-RW', options).format(date)
}

/**
 * Formats a time into 24-hour "HH:mm" in Kigali time.
 * e.g. "10:30"
 */
export function formatTime(
  dateInput: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: RWANDA_TIMEZONE,
  }
): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return '--:--'
  return new Intl.DateTimeFormat('en-RW', options).format(date)
}

/**
 * Formats a full date and time.
 * e.g. "14 Aug 2026, 10:30 CAT"
 */
export function formatDateTime(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return 'Invalid Date'
  return `${formatDate(date)}, ${formatTime(date)} CAT`
}

/**
 * Checks whether the current time is within the attendance window.
 */
export function isWithinAttendanceWindow(
  opensAt: Date | string,
  closesAt: Date | string,
  now: Date = new Date()
): { isOpen: boolean; isBefore: boolean; isAfter: boolean; isClosingSoon: boolean } {
  const openTime = new Date(opensAt).getTime()
  const closeTime = new Date(closesAt).getTime()
  const currentTime = now.getTime()

  const isBefore = currentTime < openTime
  const isAfter = currentTime > closeTime
  const isOpen = !isBefore && !isAfter
  // Closing soon if open and less than 15 minutes remaining
  const fifteenMinutesMs = 15 * 60 * 1000
  const isClosingSoon = isOpen && closeTime - currentTime <= fifteenMinutesMs

  return { isOpen, isBefore, isAfter, isClosingSoon }
}

/**
 * Returns human-friendly relative time (e.g. "5 minutes ago", "just now").
 */
export function formatRelativeTime(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 45) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(date)
}
