import { NextResponse } from 'next/server'
import { getAllSessions, createSession } from '../../../lib/sessions/session-service'
import { CreateSessionInput } from '../../../types/session'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'

export async function GET() {
  try {
    const sessions = getAllSessions()
    return NextResponse.json({
      success: true,
      data: sessions,
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // 1. Server-Side Authentication & Authorization Check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!hasPermission(user.role, 'session:create')) {
      return NextResponse.json(
        { success: false, error: `Role '${user.role}' lacks permission to create sessions` },
        { status: 403 }
      )
    }

    // 2. Validate Request Body
    const body = (await request.json()) as CreateSessionInput

    if (!body.title || !body.date || !body.startTime || !body.endTime || !body.location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required session parameters (title, date, startTime, endTime, location)',
        },
        { status: 400 }
      )
    }

    const session = createSession(body, user.id)

    return NextResponse.json(
      {
        success: true,
        data: session,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
