import { NextResponse } from 'next/server'
import { getSessionAnalytics } from '../../../../../lib/analytics/analytics-service'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    if (!hasPermission(user.role, 'attendance:view')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const { sessionId } = await params
    const data = await getSessionAnalytics(sessionId)
    if (!data) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error computing session analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
