import { NextRequest, NextResponse } from 'next/server'
import { getGlobalAnalytics, parseAnalyticsFilters } from '../../../lib/analytics/analytics-service'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    if (!hasPermission(user.role, 'attendance:view')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const filters = parseAnalyticsFilters(Object.fromEntries(request.nextUrl.searchParams.entries()))
    const data = await getGlobalAnalytics(filters)
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error computing analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
