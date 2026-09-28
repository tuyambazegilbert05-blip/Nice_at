import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../lib/auth'
import { getRecentActivity } from '../../../lib/activity/activity-service'
import { hasPermission } from '../../../lib/permissions/rbac'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'activity:view')) return NextResponse.json({ success: false, error: 'Only administrators can view staff activity.' }, { status: 403 })

  try {
    const data = await getRecentActivity()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Could not load staff activity:', error)
    return NextResponse.json({ success: false, error: 'Could not load staff activity. Confirm the latest database migration has been applied.' }, { status: 500 })
  }
}
