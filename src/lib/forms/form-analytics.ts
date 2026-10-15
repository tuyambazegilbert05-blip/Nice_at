import type { AttendanceFieldType, AttendanceFormConfig, AttendanceFormField } from './attendance-form'

export type FormEmailStatus = 'ACCEPTED' | 'FAILED' | 'PENDING'

export interface FormAnalyticsSubmission {
  submittedAt: string
  emailStatus: FormEmailStatus
  responses: Record<string, unknown>
  /**
   * A response keeps its published form snapshot. This lets analytics retain
   * questions that were later changed or removed in the form builder.
   */
  formVersion?: number
  formSnapshot?: AttendanceFormConfig
}

export interface FormDistributionItem {
  label: string
  count: number
  percentage: number
}

export interface FormFieldDistribution {
  id: string
  key: string
  label: string
  eligibleCount: number
  answeredCount: number
  completionPercentage: number
  items: FormDistributionItem[]
}

export interface FormFieldCompletion {
  id: string
  key: string
  label: string
  type: AttendanceFieldType
  eligibleCount: number
  answeredCount: number
  completionPercentage: number
  versions: number[]
}

export interface CustomFormAnalytics {
  attendeeCount: number
  acceptedEmailCount: number
  failedEmailCount: number
  pendingEmailCount: number
  latestSubmissionAt: string | null
  timeline: Array<{ label: string; value: number }>
  hourlyHistogram: Array<{ label: string; hour: number; value: number }>
  fieldCompletion: FormFieldCompletion[]
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

function hasResponse(value: unknown): boolean {
  if (typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return Boolean(value.trim())
  if (Array.isArray(value)) return value.some((item) => typeof item === 'string' && Boolean(item.trim()))
  return false
}

/** This mirrors public-form visibility without pulling validation code into the client analytics bundle. */
function isFieldVisibleForSubmission(field: AttendanceFormField, config: AttendanceFormConfig, responses: Record<string, unknown>): boolean {
  if (!field.visible) return false
  if (!field.condition) return true
  const parent = config.fields.find((candidate) => candidate.id === field.condition?.fieldId)
  if (!parent?.visible) return false
  const answer = responses[parent.id]
  return field.condition.operator === 'includes'
    ? Array.isArray(answer) && answer.includes(field.condition.value)
    : answer === field.condition.value
}

function fieldKey(field: AttendanceFormField): string {
  return `${field.id}\u0000${field.type}\u0000${field.label.trim().toLowerCase()}`
}

type AnalyticsField = {
  key: string
  field: AttendanceFormField
  versions: Set<number>
}

function submissionConfig(submission: FormAnalyticsSubmission, fallbackFields: AttendanceFormField[]): AttendanceFormConfig {
  if (submission.formSnapshot?.fields?.length) return submission.formSnapshot
  return { version: submission.formVersion ?? 0, fields: fallbackFields }
}

function collectAnalyticsFields(submissions: FormAnalyticsSubmission[], fields: AttendanceFormField[]): AnalyticsField[] {
  const byKey = new Map<string, AnalyticsField>()
  const register = (field: AttendanceFormField, version: number) => {
    if (!field.visible || field.id === 'full_name' || field.id === 'email') return
    const key = fieldKey(field)
    const existing = byKey.get(key)
    if (existing) {
      existing.versions.add(version)
      return
    }
    byKey.set(key, { key, field, versions: new Set([version]) })
  }

  for (const field of fields) register(field, 0)
  for (const submission of submissions) {
    const config = submissionConfig(submission, fields)
    const version = submission.formVersion ?? config.version
    for (const field of config.fields) register(field, version)
  }

  return [...byKey.values()].sort((left, right) => left.field.order - right.field.order || left.field.label.localeCompare(right.field.label, 'en-RW'))
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

  const analyticsFields = collectAnalyticsFields(submissions, fields)
  const completion = new Map<string, { eligibleCount: number; answeredCount: number }>()
  const distributionCounts = new Map<string, Map<string, number>>()

  for (const analyticsField of analyticsFields) {
    completion.set(analyticsField.key, { eligibleCount: 0, answeredCount: 0 })
    if (choiceTypes.includes(analyticsField.field.type)) distributionCounts.set(analyticsField.key, new Map())
  }

  for (const submission of submissions) {
    const config = submissionConfig(submission, fields)
    for (const analyticsField of analyticsFields) {
      const field = config.fields.find((candidate) => fieldKey(candidate) === analyticsField.key)
      if (!field || !isFieldVisibleForSubmission(field, config, submission.responses)) continue
      const fieldCompletion = completion.get(analyticsField.key)!
      fieldCompletion.eligibleCount += 1
      const value = submission.responses[field.id]
      if (!hasResponse(value)) continue
      fieldCompletion.answeredCount += 1
      const counts = distributionCounts.get(analyticsField.key)
      if (!counts) continue
      for (const answer of distributionValue(value)) counts.set(answer, (counts.get(answer) ?? 0) + 1)
    }
  }

  const fieldCompletion = analyticsFields.map((analyticsField) => {
    const counts = completion.get(analyticsField.key)!
    return {
      id: analyticsField.field.id,
      key: analyticsField.key,
      label: analyticsField.field.label,
      type: analyticsField.field.type,
      eligibleCount: counts.eligibleCount,
      answeredCount: counts.answeredCount,
      completionPercentage: counts.eligibleCount ? Math.round((counts.answeredCount / counts.eligibleCount) * 100) : 0,
      versions: [...analyticsField.versions].filter((version) => version > 0).sort((left, right) => left - right),
    }
  })

  const distributions = analyticsFields
    .filter((analyticsField) => choiceTypes.includes(analyticsField.field.type))
    .map((analyticsField) => {
      const counts = distributionCounts.get(analyticsField.key)!
      const fieldCompletion = completion.get(analyticsField.key)!
      return {
        id: analyticsField.field.id,
        key: analyticsField.key,
        label: analyticsField.field.label,
        eligibleCount: fieldCompletion.eligibleCount,
        answeredCount: fieldCompletion.answeredCount,
        completionPercentage: fieldCompletion.eligibleCount ? Math.round((fieldCompletion.answeredCount / fieldCompletion.eligibleCount) * 100) : 0,
        items: [...counts.entries()]
          .map(([label, count]) => ({ label, count, percentage: fieldCompletion.answeredCount ? Math.round((count / fieldCompletion.answeredCount) * 100) : 0 }))
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
    fieldCompletion,
    distributions,
  }
}
