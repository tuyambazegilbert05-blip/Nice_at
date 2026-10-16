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

/** Semantic activity writes are best-effort; critical events can opt into required persistence. */
export async function recordActivity(input: ActivityInput, options: { required?: boolean } = {}): Promise<void> {
  try {
    await query(
      `INSERT INTO activity_log(actor_id,actor_name,actor_role,action,target_type,target_id,target_label,summary,details)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      [input.actor.id, input.actor.name, input.actor.role, input.action, input.targetType ?? null,
        input.targetId ?? null, input.targetLabel ?? null, input.summary, JSON.stringify(input.details ?? {})],
    )
  } catch (error) {
    console.error('Could not record staff activity:', error)
    if (options.required) throw error
  }
}

export async function getRecentActivity(limit = 100, actorId?: string, before?: { createdAt: string; id: string }): Promise<ActivityRecord[]> {
  const pageSize = Math.min(Math.max(limit, 1), 200)
  const hiddenLegacyActions = `action NOT LIKE 'api.%' AND action <> ALL(ARRAY[
    'session.list_viewed','session.viewed','attendance.records_viewed','staff.directory_viewed',
    'custom_form.list_viewed','custom_form.responses_viewed','custom_form.builder_viewed',
    'communication.recipients_viewed','analytics.platform_viewed','analytics.session_viewed'
  ]::text[])`
  if (actorId) {
    const result = await query<ActivityRecord>(
      `SELECT id::text,actor_id AS "actorId",actor_name AS "actorName",actor_role AS "actorRole",
        action,target_type AS "targetType",target_id AS "targetId",target_label AS "targetLabel",
        summary,details,created_at::text AS "createdAt"
       FROM activity_log WHERE actor_id=$1 AND ${hiddenLegacyActions} AND ($2::timestamptz IS NULL OR (created_at,id)<($2::timestamptz,$3::bigint))
       ORDER BY created_at DESC,id DESC LIMIT $4`,
      [actorId, before?.createdAt ?? null, before?.id ?? null, pageSize],
    )
    return result.rows
  }
  const result = await query<ActivityRecord>(
    `SELECT id::text,actor_id AS "actorId",actor_name AS "actorName",actor_role AS "actorRole",
      action,target_type AS "targetType",target_id AS "targetId",target_label AS "targetLabel",
      summary,details,created_at::text AS "createdAt"
     FROM activity_log WHERE ${hiddenLegacyActions} AND ($1::timestamptz IS NULL OR (created_at,id)<($1::timestamptz,$2::bigint))
     ORDER BY created_at DESC,id DESC LIMIT $3`,
    [before?.createdAt ?? null, before?.id ?? null, pageSize],
  )
  return result.rows
}
