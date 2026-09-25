import { NextResponse } from 'next/server'
import { getAllSessions } from '../../../lib/sessions/session-service'
import { getAllAttendance } from '../../../lib/attendance/check-in-service'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    if (!hasPermission(user.role, 'attendance:view')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const [sessions, attendance] = await Promise.all([getAllSessions(), getAllAttendance()])

    const totalSessions = sessions.length
    const totalAttendees = attendance.length
    const avgAttendance = totalSessions > 0 ? Math.round(totalAttendees / totalSessions) : 0

    // Count participant distribution
    const distributionByType: Record<string, number> = {}
    for (const record of attendance) {
      distributionByType[record.participantType] = (distributionByType[record.participantType] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSessions,
        totalAttendees,
        avgAttendance,
        distributionByType,
      },
    })
  } catch (error) {
    console.error('Error computing analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
