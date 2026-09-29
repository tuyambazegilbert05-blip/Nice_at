import { NextResponse } from 'next/server'
import { getCurrentUser, getAllUsers } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { withTransaction } from '../../../lib/database/client'
import type { UserRole } from '../../../types/user'
import { recordActivity } from '../../../lib/activity/activity-service'

const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']
const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401, headers: PRIVATE_HEADERS })
    const users = await getAllUsers()
    const data = hasPermission(user.role, 'users:manage')
      ? users
      : users.map(({ id, name, role, isActive, avatarUrl }) => ({ id, name, role, isActive, avatarUrl }))
    return NextResponse.json({ success: true, data }, { headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error('Error loading staff directory:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500, headers: PRIVATE_HEADERS })
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await getCurrentUser()
    if (!actor) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401, headers: PRIVATE_HEADERS })
    if (!hasPermission(actor.role, 'users:manage')) {
      return NextResponse.json({ success: false, error: 'Only administrators can change staff roles.' }, { status: 403, headers: PRIVATE_HEADERS })
    }

    const body = await request.json() as { userId?: string; role?: UserRole }
    const userId = body.userId?.trim()
    if (!userId || !body.role || !ROLES.includes(body.role)) {
      return NextResponse.json({ success: false, error: 'Choose a staff account and a valid role.' }, { status: 400 })
    }

    const outcome = await withTransaction(async (client) => {
      // Serialize role changes so concurrent requests cannot demote the last active administrator.
      await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [94112822])
      const currentActor = await client.query<{ role: UserRole; is_active: boolean }>(
        'SELECT role,is_active FROM users WHERE id=$1 FOR SHARE', [actor.id],
      )
      if (currentActor.rows[0]?.role !== 'ADMIN' || !currentActor.rows[0]?.is_active) return { kind: 'forbidden' as const }
      if (userId === actor.id) return { kind: 'self' as const }

      const targetResult = await client.query<{ id: string; role: UserRole; is_active: boolean }>(
        'SELECT id,role,is_active FROM users WHERE id=$1 FOR UPDATE', [userId],
      )
      const target = targetResult.rows[0]
      if (!target) return { kind: 'missing' as const }
      if (target.role === body.role) return { kind: 'unchanged' as const }

      if (target.role === 'ADMIN' && body.role !== 'ADMIN' && target.is_active) {
        const admins = await client.query<{ count: number }>(
          "SELECT count(*)::int AS count FROM users WHERE role='ADMIN' AND is_active=true",
        )
        if ((admins.rows[0]?.count ?? 0) <= 1) return { kind: 'last-admin' as const }
      }

      const updated = await client.query<{ id: string; name: string; email: string; role: UserRole; isActive: boolean; avatarUrl: string | null; createdAt: Date; updatedAt: Date }>(
        `UPDATE users SET role=$1,updated_at=now() WHERE id=$2
         RETURNING id,name,email,role,is_active AS "isActive",avatar_url AS "avatarUrl",created_at AS "createdAt",updated_at AS "updatedAt"`,
        [body.role, userId],
      )
      return { kind: 'updated' as const, user: updated.rows[0], previousRole: target.role }
    })

    if (outcome.kind === 'forbidden') return NextResponse.json({ success: false, error: 'Only active administrators can change staff roles.' }, { status: 403, headers: PRIVATE_HEADERS })
    if (outcome.kind === 'self') return NextResponse.json({ success: false, error: 'You cannot change your own role. Ask another administrator.' }, { status: 409, headers: PRIVATE_HEADERS })
    if (outcome.kind === 'missing') return NextResponse.json({ success: false, error: 'Staff account not found.' }, { status: 404, headers: PRIVATE_HEADERS })
    if (outcome.kind === 'last-admin') return NextResponse.json({ success: false, error: 'The last active administrator cannot be demoted.' }, { status: 409, headers: PRIVATE_HEADERS })
    if (outcome.kind === 'unchanged') return NextResponse.json({ success: true, message: 'This account already has that role.' }, { headers: PRIVATE_HEADERS })
    await recordActivity({ actor, action: 'staff.role_changed', targetType: 'staff_account', targetId: outcome.user.id, targetLabel: outcome.user.name,
      summary: `Changed ${outcome.user.name}’s role from ${outcome.previousRole} to ${outcome.user.role}`,
      details: { from: outcome.previousRole, to: outcome.user.role } })
    return NextResponse.json({ success: true, data: outcome.user, message: 'Staff role updated.' }, { headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error('Could not update staff role:', error)
    return NextResponse.json({ success: false, error: 'Could not update the staff role.' }, { status: 500, headers: PRIVATE_HEADERS })
  }
}
