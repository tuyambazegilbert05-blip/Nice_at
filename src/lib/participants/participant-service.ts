import { getAllAttendance } from '../attendance/check-in-service'
import { query } from '../database/client'
import type { AttendanceResponseValue } from '../forms/attendance-form'

export type ParticipantSource = 'SESSION' | 'FORM'

export interface ParticipantDirectoryEntry {
  email: string
  name: string
  primaryRole: string | null
  organization: string | null
  sessionCheckInCount: number
  formResponseCount: number
  sources: ParticipantSource[]
  lastActivityAt: string
}

type CustomFormSubmissionRow = {
  full_name: string
  email: string
  responses: Record<string, AttendanceResponseValue>
  form_snapshot: unknown
  submitted_at: Date
}

type FormSnapshot = {
  fields?: Array<{ id?: unknown; label?: unknown }>
}

type ProfileDetails = {
  role: string | null
  organization: string | null
}

type MutableParticipant = ParticipantDirectoryEntry & {
  sessionIds: Set<string>
  roleUpdatedAt: number
  organizationUpdatedAt: number
  nameUpdatedAt: number
}

const roleFieldIds = new Set([
  'participant_type',
  'participant_category',
  'professional_role',
  'workshop_role',
  'outreach_role',
])

const organizationFieldIds = new Set([
  'organization',
  'institution',
  'school_name',
  'faculty',
  'department',
  'program',
])

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function stringValue(value: AttendanceResponseValue | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function formFields(snapshot: unknown): Array<{ id: string; label: string }> {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return []
  const fields = (snapshot as FormSnapshot).fields
  if (!Array.isArray(fields)) return []
  return fields.flatMap((field) => {
    if (typeof field.id !== 'string' || typeof field.label !== 'string') return []
    return [{ id: field.id, label: field.label }]
  })
}

function findResponse(
  responses: Record<string, AttendanceResponseValue>,
  fields: Array<{ id: string; label: string }>,
  ids: Set<string>,
  labelPattern: RegExp,
): string | null {
  for (const id of ids) {
    const value = stringValue(responses[id])
    if (value) return value
  }

  for (const field of fields) {
    if (!labelPattern.test(field.label)) continue
    const value = stringValue(responses[field.id])
    if (value) return value
  }

  return null
}

function getFormProfileDetails(row: CustomFormSubmissionRow): ProfileDetails {
  const fields = formFields(row.form_snapshot)
  return {
    role: findResponse(
      row.responses,
      fields,
      roleFieldIds,
      /^(participant (type|category)|your role|professional or academic role|role)$/i,
    ),
    organization: findResponse(
      row.responses,
      fields,
      organizationFieldIds,
      /^(school, organization, or institution|institution or organization|school or community organization|organization|institution|faculty(?: or school)?|department|program(?:, major, or field of study)?|program \/ major)$/i,
    ),
  }
}

function timestamp(value: Date | string): number {
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function addSource(participant: MutableParticipant, source: ParticipantSource): void {
  if (!participant.sources.includes(source)) participant.sources.push(source)
}

function getOrCreateParticipant(directory: Map<string, MutableParticipant>, email: string): MutableParticipant | null {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return null

  const existing = directory.get(normalizedEmail)
  if (existing) return existing

  const participant: MutableParticipant = {
    email: normalizedEmail,
    name: normalizedEmail,
    primaryRole: null,
    organization: null,
    sessionCheckInCount: 0,
    formResponseCount: 0,
    sources: [],
    lastActivityAt: new Date(0).toISOString(),
    sessionIds: new Set<string>(),
    roleUpdatedAt: 0,
    organizationUpdatedAt: 0,
    nameUpdatedAt: 0,
  }
  directory.set(normalizedEmail, participant)
  return participant
}

function updateProfile(
  participant: MutableParticipant,
  input: { name: string; role: string | null; organization: string | null; occurredAt: Date | string },
): void {
  const occurredAt = timestamp(input.occurredAt)
  if (input.name.trim() && occurredAt >= participant.nameUpdatedAt) {
    participant.name = input.name.trim()
    participant.nameUpdatedAt = occurredAt
  }
  if (input.role && occurredAt >= participant.roleUpdatedAt) {
    participant.primaryRole = input.role
    participant.roleUpdatedAt = occurredAt
  }
  if (input.organization && occurredAt >= participant.organizationUpdatedAt) {
    participant.organization = input.organization
    participant.organizationUpdatedAt = occurredAt
  }
  if (occurredAt >= timestamp(participant.lastActivityAt)) {
    participant.lastActivityAt = new Date(occurredAt).toISOString()
  }
}

/**
 * Builds the shared staff-only people directory. Custom Form submissions are
 * represented alongside session check-ins, but they stay distinct in their
 * individual activity counts and never create attendance records.
 */
export async function getParticipantDirectory(): Promise<ParticipantDirectoryEntry[]> {
  const [attendance, customFormSubmissions] = await Promise.all([
    getAllAttendance(),
    query<CustomFormSubmissionRow>(
      `SELECT full_name,email,responses,form_snapshot,submitted_at
       FROM custom_form_submissions
       ORDER BY submitted_at DESC`,
    ),
  ])

  const directory = new Map<string, MutableParticipant>()

  for (const record of attendance) {
    const participant = getOrCreateParticipant(directory, record.email)
    if (!participant) continue
    participant.sessionIds.add(record.sessionId)
    participant.sessionCheckInCount = participant.sessionIds.size
    addSource(participant, 'SESSION')
    updateProfile(participant, {
      name: record.fullName,
      role: record.participantType,
      organization: record.faculty?.trim() || record.program?.trim() || null,
      occurredAt: record.submittedAt,
    })
  }

  for (const submission of customFormSubmissions.rows) {
    const participant = getOrCreateParticipant(directory, submission.email)
    if (!participant) continue
    participant.formResponseCount += 1
    addSource(participant, 'FORM')
    const profile = getFormProfileDetails(submission)
    updateProfile(participant, {
      name: submission.full_name,
      role: profile.role,
      organization: profile.organization,
      occurredAt: submission.submitted_at,
    })
  }

  return [...directory.values()]
    .map(({ sessionIds: _sessionIds, roleUpdatedAt: _roleUpdatedAt, organizationUpdatedAt: _organizationUpdatedAt, nameUpdatedAt: _nameUpdatedAt, ...participant }) => participant)
    .sort((left, right) => left.name.localeCompare(right.name, 'en-RW'))
}
