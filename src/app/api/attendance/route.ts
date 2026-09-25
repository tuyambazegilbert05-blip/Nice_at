import { NextRequest, NextResponse } from 'next/server'
import {
  recordAttendance,
  getAttendanceForSession,
  getAllAttendance,
} from '../../../lib/attendance/check-in-service'
import { AttendanceSubmission } from '../../../types/attendance'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { getSessionByPublicToken } from '../../../lib/sessions/session-service'
import { deliverBrandedEmail } from '../../../lib/email/brevo'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    if (!hasPermission(user.role, 'attendance:view')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const data = sessionId ? await getAttendanceForSession(sessionId) : await getAllAttendance()

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error retrieving attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AttendanceSubmission

    if (!body.token || !body.fullName || !body.email || !body.phone || !body.participantType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields (token, fullName, email, phone, participantType)',
        },
        { status: 400 }
      )
    }

    const result = await recordAttendance(body)

    if (!result.success) {
      const statusCode =
        result.code === 'SESSION_NOT_FOUND'
          ? 404
          : result.code === 'DUPLICATE_ENTRY'
            ? 409
            : 400

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: result.code,
        },
        { status: statusCode }
      )
    }

    const attendance = result.attendance!
    let thankYou = { sent: false }
    try {
      const session = await getSessionByPublicToken(body.token)
      if (session) {
        const sessionDate = new Date(`${String(session.date).slice(0, 10)}T12:00:00+02:00`).toLocaleDateString('en-RW', { dateStyle: 'long', timeZone: 'Africa/Kigali' })
        thankYou = await deliverBrandedEmail({
          to: attendance.email,
          name: attendance.fullName,
          subject: `Thank you for joining ${session.title}`,
          heading: `Thank you for being with us, ${attendance.fullName.split(/\s+/)[0]}`,
          paragraphs: [
            `We were happy to welcome you to ${session.title}, a NiCE Club Rwanda ${session.type.toLowerCase().replaceAll('_', ' ')}.`,
            `Session summary: ${sessionDate} · ${session.startTime}–${session.endTime} CAT · ${session.location}.`,
            'Thank you for bringing your curiosity and perspective to our conversation on nuclear science and clean energy. We hope to see you at another learning event soon.',
          ],
          category: 'ATTENDANCE_THANK_YOU',
          attendanceId: attendance.id,
        })
      }
    } catch (error) {
      console.error('Attendance was saved, but its thank-you email could not be prepared:', error)
    }

    return NextResponse.json(
      {
        success: true,
        data: attendance,
        thankYouEmail: thankYou.sent ? 'sent' : 'not_sent',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error processing attendance check-in:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
