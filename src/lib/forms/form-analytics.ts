import type { AttendanceFieldType, AttendanceFormField } from './attendance-form'

export type FormEmailStatus = 'ACCEPTED' | 'FAILED' | 'PENDING'

export interface FormAnalyticsSubmission {
  submittedAt: string
  emailStatus: FormEmailStatus
  responses: Record<string, unknown>
}

export interface FormDistributionItem {
  label: string
  count: number
  percentage: number
}

export interface FormFieldDistribution {
  id: string
  label: string
  answeredCount: number
  items: FormDistributionItem[]
}

export interface CustomFormAnalytics {
  attendeeCount: number
  acceptedEmailCount: number
  failedEmailCount: number
  pendingEmailCount: number
  latestSubmissionAt: string | null
  timeline: Array<{ label: string; value: number }>
  hourlyHistogram: Array<{ label: string; hour: number; value: number }>
  distributions: FormFieldDistribution[]
}

const choiceTypes: AttendanceFieldType[] = ['SELECT', 'RADIO', 'CHECKBOX', 'CONSENT']
const kigaliDateParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit',
})
const kigaliHour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Kigali', hour: '2-digit', hourCycle: 'h23' })

function dateKey(value: Date): string {
  const parts = Object.fromEntries(kigaliDateParts.formatToParts(value).map(({ type, value: part }) => [type, part]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

function utcDateFromKey(key: string): Date {
  return new Date(`${key}T12:00:00.000Z`)
}

function distributionValue(value: unknown): string[] {
  if (typeof value === 'boolean') return [value ? 'Yes' : 'No']
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  if (Array.isArray(value)) return [...new Set(value.filter((item): item is string => typeof item === 'string' && !!item.trim()).map((item) => item.trim()))]
  return []
}

export function buildCustomFormAnalytics(
  submissions: FormAnalyticsSubmission[],
  fields: AttendanceFormField[],
): CustomFormAnalytics {
  const submittedDates = submissions
    .map((submission) => new Date(submission.submittedAt))
    .filter((date) => Number.isFinite(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime())
  const days = new Map<string, number>()
  const hours = Array.from({ length: 24 }, () => 0)
  for (const date of submittedDates) {
    const key = dateKey(date)
    days.set(key, (days.get(key) ?? 0) + 1)
    const hour = Number(kigaliHour.format(date))
    if (hour >= 0 && hour < 24) hours[hour] += 1
  }

  const timeline: CustomFormAnalytics['timeline'] = []
  if (days.size) {
    const keys = [...days.keys()].sort()
    const end = utcDateFromKey(keys.at(-1)!)
    const start = utcDateFromKey(keys[0]!)
    const windowStart = new Date(end)
    windowStart.setUTCDate(windowStart.getUTCDate() - 13)
    const cursor = windowStart.getTime() > start.getTime() ? windowStart : start
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10)
      timeline.push({
        label: new Intl.DateTimeFormat('en-RW', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(cursor),
        value: days.get(key) ?? 0,
      })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  const distributions = fields
    .filter((field) => field.visible && choiceTypes.includes(field.type))
    .map((field) => {
      const counts = new Map<string, number>()
      let answeredCount = 0
      for (const submission of submissions) {
        const values = distributionValue(submission.responses[field.id])
        if (!values.length) continue
        answeredCount += 1
        for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
      }
      return {
        id: field.id,
        label: field.label,
        answeredCount,
        items: [...counts.entries()]
          .map(([label, count]) => ({ label, count, percentage: answeredCount ? Math.round((count / answeredCount) * 100) : 0 }))
          .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
      }
    })

  return {
    attendeeCount: submissions.length,
    acceptedEmailCount: submissions.filter((submission) => submission.emailStatus === 'ACCEPTED').length,
    failedEmailCount: submissions.filter((submission) => submission.emailStatus === 'FAILED').length,
    pendingEmailCount: submissions.filter((submission) => submission.emailStatus === 'PENDING').length,
    latestSubmissionAt: submittedDates.at(-1)?.toISOString() ?? null,
    timeline,
    hourlyHistogram: hours.map((value, hour) => ({ label: `${String(hour).padStart(2, '0')}:00`, hour, value })),
    distributions,
  }
}
