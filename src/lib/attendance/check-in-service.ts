import { randomUUID } from 'node:crypto'
import { Attendance, AttendanceSubmission } from '../../types/attendance'
import { getSessionByPublicToken } from '../sessions/session-service'
import { query, withTransaction } from '../database/client'

type AttendanceRow = {
  id: string; session_id: string; full_name: string; email: string; phone: string
  faculty: string | null; program: string | null; year_of_study: string | null
  participant_type: Attendance['participantType']; key_takeaway: string | null; feedback: string | null
  custom_responses: Attendance['customResponses']; metadata: Attendance['metadata']; submitted_at: Date; email_updates_opt_in: boolean
}

const COLUMNS = `id, session_id, full_name, email, phone, faculty, program, year_of_study,
  participant_type, key_takeaway, feedback, custom_responses, metadata, submitted_at, email_updates_opt_in`

function mapAttendance(row: AttendanceRow): Attendance {
  return {
    id: row.id, sessionId: row.session_id, fullName: row.full_name, email: row.email, phone: row.phone,
    faculty: row.faculty, program: row.program, yearOfStudy: row.year_of_study,
    participantType: row.participant_type, keyTakeaway: row.key_takeaway, feedback: row.feedback,
    customResponses: row.custom_responses, metadata: row.metadata, submittedAt: row.submitted_at.toISOString(), emailUpdatesOptIn: row.email_updates_opt_in,
  }
}

export interface SubmitResult {
  success: boolean; attendance?: Attendance; error?: string
  code?: 'SESSION_NOT_FOUND' | 'WINDOW_CLOSED' | 'DUPLICATE_ENTRY' | 'VALIDATION_FAILED' | 'BOT_DETECTED'
}

export async function recordAttendance(submission: AttendanceSubmission): Promise<SubmitResult> {
  if (submission.honeypot?.trim()) return { success: false, error: 'Invalid submission request', code: 'BOT_DETECTED' }
  const session = await getSessionByPublicToken(submission.token)
  if (!session) return { success: false, error: 'Session not found or invalid token', code: 'SESSION_NOT_FOUND' }
  const email = submission.email.trim().toLowerCase()
  const phone = submission.phone.trim().replace(/\s+/g, '')
  try {
    const record = await withTransaction(async (client) => {
      const locked = await client.query<{ duplicate_policy: typeof session.duplicatePolicy; status: string; within_window: boolean; override_active: boolean }>(
        `SELECT duplicate_policy,status,
          (now() >= attendance_opens AND now() <= attendance_closes) AS within_window,
          (attendance_override_until IS NOT NULL AND attendance_override_until > now()) AS override_active
         FROM sessions WHERE id=$1 FOR UPDATE`, [session.id],
      )
      if (!locked.rowCount) throw new Error('SESSION_NOT_FOUND')
      const current = locked.rows[0]
      const scheduledOpen = ['OPEN', 'CLOSING_SOON'].includes(current.status) && current.within_window
      if (!scheduledOpen && !current.override_active) throw new Error('WINDOW_CLOSED')
      const policy = current.duplicate_policy
      if (policy !== 'ALLOW_DUPLICATES') {
        const existing = await client.query(
          `SELECT 1 FROM attendance_records WHERE session_id=$1 AND
            (email=$2 OR ($3::boolean AND regexp_replace(phone, '\\s', '', 'g')=$4)) LIMIT 1`,
          [session.id, email, policy === 'PREVENT_BY_EMAIL_AND_PHONE', phone],
        )
        if (existing.rowCount) throw new Error('DUPLICATE_ENTRY')
      }
      const inserted = await client.query<AttendanceRow>(
        `INSERT INTO attendance_records (${COLUMNS}) VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,now(),$14) RETURNING ${COLUMNS}`,
        [`att_${randomUUID()}`, session.id, submission.fullName.trim(), email, submission.phone.trim(),
          submission.faculty?.trim() || null, submission.program?.trim() || null,
          submission.yearOfStudy?.trim() || null, submission.participantType,
          submission.keyTakeaway?.trim() || null, submission.feedback?.trim() || null,
          submission.customResponses ? JSON.stringify(submission.customResponses) : null,
          JSON.stringify({ source: 'public_qr' }), submission.emailUpdatesOptIn === true],
      )
      return mapAttendance(inserted.rows[0])
    })
    return { success: true, attendance: record }
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    if (code === 'DUPLICATE_ENTRY') return { success: false, error: 'An attendance record with this email or phone already exists for this session', code }
    if (code === 'SESSION_NOT_FOUND') return { success: false, error: 'Session not found or invalid token', code }
    if (code === 'WINDOW_CLOSED') return { success: false, error: 'Attendance window is not currently open', code }
    if ((error as { code?: string })?.code === '23505') return { success: false, error: 'Duplicate attendance record', code: 'DUPLICATE_ENTRY' }
    throw error
  }
}

export async function getAttendanceForSession(sessionId: string): Promise<Attendance[]> {
  const result = await query<AttendanceRow>(`SELECT ${COLUMNS} FROM attendance_records WHERE session_id=$1 ORDER BY submitted_at DESC`, [sessionId])
  return result.rows.map(mapAttendance)
}

export async function getAllAttendance(): Promise<Attendance[]> {
  const result = await query<AttendanceRow>(`SELECT ${COLUMNS} FROM attendance_records ORDER BY submitted_at DESC`)
  return result.rows.map(mapAttendance)
}

export async function getAttendanceById(id: string): Promise<Attendance | undefined> {
  const result = await query<AttendanceRow>(`SELECT ${COLUMNS} FROM attendance_records WHERE id=$1`, [id])
  return result.rows[0] ? mapAttendance(result.rows[0]) : undefined
}
