const KIGALI_OFFSET = '+02:00'
const KIGALI_INPUT_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Kigali',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export type ResponseWindowState = 'DRAFT' | 'CLOSED' | 'SCHEDULED' | 'ACCEPTING' | 'ENDED'

export function isResponseOverrideActive(input: { responseOverrideUntil?: string | null }, now = new Date()): boolean {
  return Boolean(input.responseOverrideUntil && now.getTime() < new Date(input.responseOverrideUntil).getTime())
}

export function toKigaliDateTimeInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  const parts = Object.fromEntries(KIGALI_INPUT_FORMAT.formatToParts(date).map(({ type, value: part }) => [type, part]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function fromKigaliDateTimeInput(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Enter a valid Kigali date and time.')
  const date = new Date(`${value}:00${KIGALI_OFFSET}`)
  if (!Number.isFinite(date.getTime()) || toKigaliDateTimeInput(date.toISOString()) !== value) {
    throw new Error('Enter a valid Kigali date and time.')
  }
  return date.toISOString()
}

export function getResponseWindowState(input: {
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  responseOpensAt: string | null
  responseClosesAt: string | null
  responseOverrideUntil?: string | null
  archivedAt?: string | null
}, now = new Date()): ResponseWindowState {
  if (input.archivedAt) return 'CLOSED'
  if (input.status === 'DRAFT') return 'DRAFT'
  if (isResponseOverrideActive(input, now)) return 'ACCEPTING'
  if (input.status === 'CLOSED') return 'CLOSED'
  if (input.responseOpensAt && now.getTime() < new Date(input.responseOpensAt).getTime()) return 'SCHEDULED'
  if (input.responseClosesAt && now.getTime() > new Date(input.responseClosesAt).getTime()) return 'ENDED'
  return 'ACCEPTING'
}
