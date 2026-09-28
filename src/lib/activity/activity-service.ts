import { query } from '../database/client'
import type { AuthUser, UserRole } from '../../types/user'

export type ActivityInput = {
  actor: Pick<AuthUser, 'id' | 'name' | 'role'>
  action: string
  summary: string
  targetType?: string
  targetId?: string | null
  targetLabel?: string | null
  details?: Record<string, unknown>
}

export type ActivityRecord = {
  id: string
  actorId: string | null
  actorName: string
  actorRole: UserRole
  action: string
  targetType: string | null
  targetId: string | null
  targetLabel: string | null
  summary: string
  details: Record<string, unknown>
  createdAt: string
}

/** Activity writes are best-effort so an audit storage problem cannot undo a completed user action. */
export async function recordActivity(input: ActivityInput): Promise<void> {
  try {
    await query(
      `INSERT INTO activity_log(actor_id,actor_name,actor_role,action,target_type,target_id,target_label,summary,details)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      [input.actor.id, input.actor.name, input.actor.role, input.action, input.targetType ?? null,
        input.targetId ?? null, input.targetLabel ?? null, input.summary, JSON.stringify(input.details ?? {})],
    )
  } catch (error) {
    console.error('Could not record staff activity:', error)
  }
}

export async function getRecentActivity(limit = 100): Promise<ActivityRecord[]> {
  const result = await query<ActivityRecord>(
    `SELECT id::text,actor_id AS "actorId",actor_name AS "actorName",actor_role AS "actorRole",
      action,target_type AS "targetType",target_id AS "targetId",target_label AS "targetLabel",
      summary,details,created_at::text AS "createdAt"
     FROM activity_log ORDER BY created_at DESC,id DESC LIMIT $1`,
    [Math.min(Math.max(limit, 1), 200)],
  )
  return result.rows
}
