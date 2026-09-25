import { NextRequest, NextResponse } from 'next/server'
import {
  recordAttendance,
  getAttendanceForSession,
  getAllAttendance,
} from '../../../lib/attendance/check-in-service'
import { AttendanceSubmission } from '../../../types/attendance'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    const data = sessionId ? getAttendanceForSession(sessionId) : getAllAttendance()

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

    const result = recordAttendance(body)

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

    return NextResponse.json(
      {
        success: true,
        data: result.attendance,
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
