import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { query } from '../../../lib/database/client'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  return NextResponse.json({
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    onboardingOutcome: user.onboardingOutcome ?? (user.hasCompletedOnboarding ? 'completed' : 'not_started'),
    canCreateSession: hasPermission(user.role, 'session:create'),
    canViewSessions: hasPermission(user.role, 'session:view'),
    canViewAttendance: hasPermission(user.role, 'attendance:view'),
    canUseCommunications: hasPermission(user.role, 'communications:send'),
    canManageSettings: hasPermission(user.role, 'settings:manage'),
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  try {
    const body = await request.json() as { outcome?: unknown }
    if (body.outcome !== 'skipped' && body.outcome !== 'completed') {
      return NextResponse.json({ error: 'A valid onboarding outcome is required' }, { status: 400 })
    }
    await query(
      `UPDATE users
       SET has_completed_onboarding=true, onboarding_outcome=$2, updated_at=now()
       WHERE id=$1 AND is_active=true AND has_completed_onboarding=false`,
      [user.id, body.outcome],
    )
    return NextResponse.json({ success: true, hasCompletedOnboarding: true, onboardingOutcome: body.outcome }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Failed to save onboarding completion:', error)
    return NextResponse.json({ error: 'Unable to save onboarding progress' }, { status: 500 })
  }
}
