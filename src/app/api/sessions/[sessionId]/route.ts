import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions/rbac'
import { getSessionById, updateSessionStatus } from '../../../../lib/sessions/session-service'
import { SessionStatus } from '../../../../types/session'

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
    const body = await request.json()
    const allowed: SessionStatus[] = ['OPEN', 'CLOSED']
    if (!allowed.includes(body.status)) return NextResponse.json({ success: false, error: 'Invalid session status' }, { status: 400 })
    const { sessionId } = await params
    const session = await updateSessionStatus(sessionId, body.status)
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
