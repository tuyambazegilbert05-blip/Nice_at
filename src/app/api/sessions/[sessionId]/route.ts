import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions/rbac'
import { deleteSessionAndAttendance, getSessionById, updateSessionContent, updateSessionStatus } from '../../../../lib/sessions/session-service'
import { SessionStatus } from '../../../../types/session'
import { z } from 'zod'
import { recordActivity } from '../../../../lib/activity/activity-service'
import { verifyCurrentPassword } from '../../../../lib/auth/session'

const sessionContentSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().max(6000),
  type: z.enum(['LECTURE', 'WORKSHOP', 'SEMINAR', 'SCHOOL_OUTREACH', 'UNIVERSITY_SESSION', 'CONFERENCE', 'WEBINAR', 'TRAINING', 'YOUTH_EVENT', 'OTHER']),
  location: z.string().trim().min(2).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
  }, 'Enter a valid calendar date.'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  attendanceOpens: z.string().datetime({ offset: true }),
  attendanceCloses: z.string().datetime({ offset: true }),
  duplicatePolicy: z.enum(['ALLOW_DUPLICATES', 'PREVENT_BY_EMAIL', 'PREVENT_BY_EMAIL_AND_PHONE']),
}).strict().refine((input) => input.endTime > input.startTime, {
  message: 'Session end time must be after its start time.',
  path: ['endTime'],
}).refine((input) => new Date(input.attendanceCloses) > new Date(input.attendanceOpens), {
  message: 'Check-in must close after it opens.',
  path: ['attendanceCloses'],
})

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:view')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const { sessionId } = await params
    const session = await getSessionById(sessionId)
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    console.error('Error retrieving session:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:edit')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json() as Record<string, unknown>
    const allowed: SessionStatus[] = ['OPEN', 'CLOSED']
    const { sessionId } = await params
    if (Object.keys(body).length === 1 && typeof body.status === 'string') {
      if (!allowed.includes(body.status as SessionStatus)) return NextResponse.json({ success: false, error: 'Invalid session status' }, { status: 400 })
      const previous = await getSessionById(sessionId)
      if (!previous) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
      const session = await updateSessionStatus(sessionId, body.status as SessionStatus)
      if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
      await recordActivity({ actor: user, action: 'session.status_changed', targetType: 'session', targetId: session.id, targetLabel: session.title,
        summary: `${body.status === 'OPEN' ? 'Opened attendance for' : 'Closed attendance for'} “${session.title}”`,
        details: { from: previous.status, to: session.status } })
      return NextResponse.json({ success: true, data: session })
    }

    const parsed = sessionContentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Session details are invalid.' }, { status: 400 })
    }
    const previous = await getSessionById(sessionId)
    if (!previous) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    const session = await updateSessionContent(sessionId, parsed.data)
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    await recordActivity({ actor: user, action: 'session.updated', targetType: 'session', targetId: session.id, targetLabel: session.title,
      summary: `Updated session “${session.title}”`,
      details: {
        title: { from: previous.title, to: session.title },
        description: { from: previous.description, to: session.description },
        type: { from: previous.type, to: session.type },
        location: { from: previous.location, to: session.location },
        date: { from: String(previous.date).slice(0, 10), to: String(session.date).slice(0, 10) },
        schedule: { from: `${previous.startTime}–${previous.endTime}`, to: `${session.startTime}–${session.endTime}` },
        attendanceWindow: { from: `${previous.attendanceOpens} to ${previous.attendanceCloses}`, to: `${session.attendanceOpens} to ${session.attendanceCloses}` },
        duplicatePolicy: { from: previous.duplicatePolicy, to: session.duplicatePolicy },
      } })
    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:delete')) {
    return NextResponse.json({ success: false, error: 'Only administrators can delete sessions and their attendance records.' }, { status: 403 })
  }
  try {
    const body = await request.json().catch(() => null)
    const confirmation = z.object({ password: z.string().min(1).max(256) }).safeParse(body)
    if (!confirmation.success) {
      return NextResponse.json({ success: false, error: 'Enter your password to confirm permanent deletion.' }, { status: 400 })
    }
    if (!await verifyCurrentPassword(user.id, confirmation.data.password)) {
      return NextResponse.json({ success: false, error: 'Your password is incorrect. Nothing was deleted.' }, { status: 403 })
    }
    const { sessionId } = await params
    const session = await getSessionById(sessionId)
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    const result = await deleteSessionAndAttendance(sessionId)
    if (!result) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    await recordActivity({ actor: user, action: 'session.deleted', targetType: 'session', targetId: session.id, targetLabel: session.title,
      summary: `Deleted session “${session.title}” and ${result.attendanceDeleted} attendance record(s)`,
      details: { title: session.title, attendanceRecordsDeleted: result.attendanceDeleted, type: session.type, date: String(session.date).slice(0, 10) } })
    return NextResponse.json({ success: true, data: result, message: `Session deleted with ${result.attendanceDeleted} attendance record(s).` })
  } catch (error) {
    console.error('Error deleting session and attendance:', error)
    return NextResponse.json({ success: false, error: 'Could not delete session and its attendance records.' }, { status: 500 })
  }
}
