import { NextRequest, NextResponse } from 'next/server'
import { getAttendanceForSession, getAllAttendance } from '../../../lib/attendance/check-in-service'
import { getSessionById } from '../../../lib/sessions/session-service'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'

export async function GET(request: NextRequest) {
  try {
    // 1. Server-Side Authorization Check for Exports
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to export data' },
        { status: 401 }
      )
    }

    if (!hasPermission(user.role, 'attendance:export')) {
      return NextResponse.json(
        { success: false, error: `Role '${user.role}' lacks permission to export attendance data` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    const [records, session] = await Promise.all([
      sessionId ? getAttendanceForSession(sessionId) : getAllAttendance(),
      sessionId ? getSessionById(sessionId) : Promise.resolve(null),
    ])

    // Format as CSV
    const headers = [
      'Record ID',
      'Session Title',
      'Full Name',
      'Email',
      'Phone',
      'Participant Type',
      'Faculty',
      'Program',
      'Year of Study',
      'Key Takeaway',
      'Feedback',
      'Submitted At (UTC)',
    ]

    const csvRows = [headers.join(',')]

    for (const r of records) {
      const row = [
        `"${r.id}"`,
        `"${session ? session.title.replace(/"/g, '""') : r.sessionId}"`,
        `"${r.fullName.replace(/"/g, '""')}"`,
        `"${r.email.replace(/"/g, '""')}"`,
        `"${r.phone.replace(/"/g, '""')}"`,
        `"${r.participantType}"`,
        `"${(r.faculty || '').replace(/"/g, '""')}"`,
        `"${(r.program || '').replace(/"/g, '""')}"`,
        `"${(r.yearOfStudy || '').replace(/"/g, '""')}"`,
        `"${(r.keyTakeaway || '').replace(/"/g, '""')}"`,
        `"${(r.feedback || '').replace(/"/g, '""')}"`,
        `"${new Date(r.submittedAt).toISOString()}"`,
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')
    const filename = session
      ? `nice-attendance-${session.publicToken}.csv`
      : 'nice-attendance-master.csv'

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating export:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
