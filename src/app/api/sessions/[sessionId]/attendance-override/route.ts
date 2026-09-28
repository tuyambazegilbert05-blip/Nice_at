import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { recordActivity } from '../../../../../lib/activity/activity-service'
import { getSessionById, setSessionAttendanceOverride } from '../../../../../lib/sessions/session-service'

const overrideSchema = z.discriminatedUnion('open', [
  z.object({ open: z.literal(true), minutes: z.number().int().min(1).max(60) }).strict(),
  z.object({ open: z.literal(false) }).strict(),
])

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:override')) {
    return NextResponse.json({ success: false, error: 'Only administrators can temporarily open check-in outside its scheduled window.' }, { status: 403 })
  }

  const parsed = overrideSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Choose to open check-in for 1–60 minutes or close the temporary extension.' }, { status: 400 })

  try {
    const { sessionId } = await params
    const previous = await getSessionById(sessionId)
    if (!previous) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })

    const session = await setSessionAttendanceOverride(sessionId, parsed.data.open ? parsed.data.minutes : null)
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })

    if (parsed.data.open) {
      await recordActivity({ actor: user, action: 'attendance.override_opened', targetType: 'session', targetId: session.id, targetLabel: session.title,
        summary: `Opened extra check-in for “${session.title}” for ${parsed.data.minutes} minutes`,
        details: { extensionMinutes: parsed.data.minutes, closesAt: session.attendanceOverrideUntil } })
    } else {
      await recordActivity({ actor: user, action: 'attendance.override_closed', targetType: 'session', targetId: session.id, targetLabel: session.title,
        summary: `Closed extra check-in for “${session.title}”`, details: { previousClosesAt: previous.attendanceOverrideUntil } })
    }

    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    console.error('Could not change temporary attendance access:', error)
    return NextResponse.json({ success: false, error: 'Could not change temporary attendance access.' }, { status: 500 })
  }
}
