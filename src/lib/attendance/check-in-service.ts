import { Attendance, AttendanceSubmission } from '../../types/attendance'
import { getSessionByPublicToken } from '../sessions/session-service'
import { isWithinAttendanceWindow } from '../../utils/date'

// In-memory operational store for attendance submissions
const memoryAttendance: Attendance[] = []

export interface SubmitResult {
  success: boolean
  attendance?: Attendance
  error?: string
  code?: 'SESSION_NOT_FOUND' | 'WINDOW_CLOSED' | 'DUPLICATE_ENTRY' | 'VALIDATION_FAILED' | 'BOT_DETECTED'
}

/**
 * Validates and records attendee check-in.
 */
export function recordAttendance(submission: AttendanceSubmission): SubmitResult {
  // 1. Bot prevention via honeypot
  if (submission.honeypot && submission.honeypot.trim() !== '') {
    return {
      success: false,
      error: 'Invalid submission request',
      code: 'BOT_DETECTED',
    }
  }

  // 2. Validate session exists
  const session = getSessionByPublicToken(submission.token)
  if (!session) {
    return {
      success: false,
      error: 'Session not found or invalid token',
      code: 'SESSION_NOT_FOUND',
    }
  }

  // 3. Verify check-in window (session status and time)
  if (session.status === 'CLOSED') {
    return {
      success: false,
      error: 'Attendance for this session is closed',
      code: 'WINDOW_CLOSED',
    }
  }

  if (session.attendanceOpens && session.attendanceCloses) {
    const isOpen = isWithinAttendanceWindow(session.attendanceOpens, session.attendanceCloses)
    if (!isOpen && session.status !== 'OPEN') {
      return {
        success: false,
        error: 'Attendance window is not currently open',
        code: 'WINDOW_CLOSED',
      }
    }
  }

  // 4. Duplicate prevention policy check
  const normalizedEmail = submission.email.trim().toLowerCase()
  const normalizedPhone = submission.phone.trim().replace(/\s+/g, '')

  const existingForSession = memoryAttendance.filter((a) => a.sessionId === session.id)

  if (
    session.duplicatePolicy === 'PREVENT_BY_EMAIL' ||
    session.duplicatePolicy === 'PREVENT_BY_EMAIL_AND_PHONE'
  ) {
    const emailExists = existingForSession.some((a) => a.email.toLowerCase() === normalizedEmail)
    if (emailExists) {
      return {
        success: false,
        error: 'An attendance record with this email already exists for this session',
        code: 'DUPLICATE_ENTRY',
      }
    }
  }

  if (session.duplicatePolicy === 'PREVENT_BY_EMAIL_AND_PHONE') {
    const phoneExists = existingForSession.some((a) => a.phone.replace(/\s+/g, '') === normalizedPhone)
    if (phoneExists) {
      return {
        success: false,
        error: 'An attendance record with this phone number already exists for this session',
        code: 'DUPLICATE_ENTRY',
      }
    }
  }

  // 5. Create new Attendance record
  const newAttendance: Attendance = {
    id: `att_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
    sessionId: session.id,
    fullName: submission.fullName.trim(),
    email: normalizedEmail,
    phone: submission.phone.trim(),
    faculty: submission.faculty?.trim() || null,
    program: submission.program?.trim() || null,
    yearOfStudy: submission.yearOfStudy?.trim() || null,
    participantType: submission.participantType,
    keyTakeaway: submission.keyTakeaway?.trim() || null,
    feedback: submission.feedback?.trim() || null,
    customResponses: submission.customResponses || null,
    metadata: {
      source: 'public_qr',
    },
    submittedAt: new Date().toISOString(),
  }

  memoryAttendance.push(newAttendance)

  // Increment session counter
  if (session._count) {
    session._count.attendance = (session._count.attendance || 0) + 1
  }

  return {
    success: true,
    attendance: newAttendance,
  }
}

/**
 * Retrieves all attendance records for a specific session.
 */
export function getAttendanceForSession(sessionId: string): Attendance[] {
  return memoryAttendance.filter((a) => a.sessionId === sessionId)
}

/**
 * Retrieves all attendance records across all sessions.
 */
export function getAllAttendance(): Attendance[] {
  return [...memoryAttendance]
}

/**
 * Retrieves an attendance record by ID.
 */
export function getAttendanceById(id: string): Attendance | undefined {
  return memoryAttendance.find((a) => a.id === id)
}
