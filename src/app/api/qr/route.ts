import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getSessionByPublicToken, getSessionById } from '../../../lib/sessions/session-service'
import { getCurrentUser } from '../../../lib/auth'
import { Session } from '../../../types/session'
import { isWithinAttendanceWindow } from '../../../utils/date'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const sessionId = searchParams.get('sessionId')
    const text = searchParams.get('text')

    let targetUrl = text
    let session: Session | null = null

    if (!targetUrl && token) {
      session = await getSessionByPublicToken(token) || null
      if (session) {
        const origin = request.nextUrl.origin
        targetUrl = `${origin}/attend/${session.publicToken}`
      }
    } else if (!targetUrl && sessionId) {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
      session = await getSessionById(sessionId) || null
      if (session) {
        const origin = request.nextUrl.origin
        targetUrl = `${origin}/attend/${session.publicToken}`
      }
    }

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Provide a valid token, sessionId, or text query parameter' },
        { status: 400 }
      )
    }

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })

    let publicSession: (Record<string, string | boolean> & { attendanceState: string }) | undefined
    if (session && token) {
      const windowState = isWithinAttendanceWindow(session.attendanceOpens, session.attendanceCloses)
      const statusAllowsCheckIn = ['OPEN', 'CLOSING_SOON'].includes(session.status)
      const attendanceState = session.status === 'CLOSED'
        ? 'closed'
        : windowState.isBefore
          ? 'scheduled'
          : windowState.isAfter
            ? 'expired'
            : statusAllowsCheckIn
              ? session.status === 'CLOSING_SOON' || windowState.isClosingSoon ? 'closing_soon' : 'open'
              : 'not_opened'
      publicSession = {
        title: session.title,
        description: session.description,
        type: session.type,
        location: session.location,
        date: String(session.date),
        startTime: session.startTime,
        endTime: session.endTime,
        attendanceOpens: new Date(session.attendanceOpens).toISOString(),
        attendanceCloses: new Date(session.attendanceCloses).toISOString(),
        status: session.status,
        isOpen: statusAllowsCheckIn && windowState.isOpen,
        attendanceState,
      }
    }

    return NextResponse.json({
      success: true,
      qrDataUrl,
      targetUrl,
      session: publicSession,
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
