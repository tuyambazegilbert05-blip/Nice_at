import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../lib/auth'
import { getRecentActivity } from '../../../lib/activity/activity-service'
import { hasPermission } from '../../../lib/permissions/rbac'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  const mine = new URL(request.url).searchParams.get('scope') === 'mine'
  const searchParams = new URL(request.url).searchParams
  const beforeCreatedAt = searchParams.get('beforeCreatedAt')
  const beforeId = searchParams.get('beforeId')
  const before = beforeCreatedAt && beforeId && /^\d+$/.test(beforeId) && !Number.isNaN(Date.parse(beforeCreatedAt))
    ? { createdAt: beforeCreatedAt, id: beforeId }
    : undefined
  if (!mine && !hasPermission(user.role, 'activity:view')) return NextResponse.json({ success: false, error: 'Only administrators can view staff activity.' }, { status: 403 })

  try {
    // Fetch one extra row so hasMore is accurate when exactly 25 remain.
    const rows = await getRecentActivity(26, mine ? user.id : undefined, before)
    return NextResponse.json({ success: true, data: rows.slice(0, 25), hasMore: rows.length > 25 })
  } catch (error) {
    console.error('Could not load staff activity:', error)
    return NextResponse.json({ success: false, error: 'Could not load staff activity. Confirm the latest database migration has been applied.' }, { status: 500 })
  }
}
