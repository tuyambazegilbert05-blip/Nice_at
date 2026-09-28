import { query } from '../database/client'
import { getRecentSessions } from '../sessions/session-service'
import type { Session } from '../../types/session'

export interface DashboardOverview {
  totalSessions: number | null
  totalAttendees: number | null
  thisMonthAttendees: number | null
  averageAttendance: number | null
  recentSessions: Session[] | null
  hasDataError: boolean
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [metricsResult, recentSessionsResult] = await Promise.allSettled([
    query<{
      total_sessions: number
      total_attendees: number
      this_month_attendees: number
    }>(`
      SELECT
        (SELECT count(*)::int FROM sessions) AS total_sessions,
        (SELECT count(*)::int FROM attendance_records) AS total_attendees,
        (SELECT count(*)::int FROM attendance_records
          WHERE submitted_at >= (date_trunc('month', now() AT TIME ZONE 'Africa/Kigali')
            AT TIME ZONE 'Africa/Kigali')
            AND submitted_at < ((date_trunc('month', now() AT TIME ZONE 'Africa/Kigali') + interval '1 month')
              AT TIME ZONE 'Africa/Kigali')) AS this_month_attendees
    `),
    getRecentSessions(),
  ])

  const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value.rows[0] : undefined
  const recentSessions = recentSessionsResult.status === 'fulfilled' ? recentSessionsResult.value : null
  if (metricsResult.status === 'rejected') console.error('Dashboard metrics query failed', metricsResult.reason)
  if (recentSessionsResult.status === 'rejected') console.error('Dashboard recent sessions query failed', recentSessionsResult.reason)

  const totalSessions = metrics?.total_sessions ?? null
  const totalAttendees = metrics?.total_attendees ?? null

  return {
    totalSessions,
    totalAttendees,
    thisMonthAttendees: metrics?.this_month_attendees ?? null,
    averageAttendance: totalSessions === null || totalAttendees === null
      ? null
      : totalSessions ? Math.round(totalAttendees / totalSessions) : 0,
    recentSessions,
    hasDataError: !metrics || !recentSessions,
  }
}
