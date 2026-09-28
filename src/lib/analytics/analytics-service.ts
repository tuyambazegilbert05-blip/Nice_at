import { withConnection } from '../database/client'
import type {
  AnalyticsFilters,
  AnalyticsSessionOption,
  AnalyticsSessionSummary,
  DistributionItem,
  GlobalAnalytics,
  SessionAnalytics,
} from '../../types/analytics'

type OverviewRow = {
  total_sessions: number | string
  total_attendees: number | string
  unique_attendees: number | string
  returning_attendees: number | string
  this_month_attendees: number | string
  active_sessions_count: number | string
}
type MonthlyRow = { month: string; attendees: number | string; sessions: number | string }
type YearRow = { year: number | string; attendees: number | string }
type DistributionCategory = 'participantType' | 'faculty' | 'program' | 'year' | 'sessionType'
type DistributionRow = { category: DistributionCategory; label: string; count: number | string }
type SessionRow = AnalyticsSessionOption & { attendance: number | string }
type OptionRow = { category: 'program' | 'year'; label: string }

const FILTER_VALUES = ['dateFrom', 'dateTo', 'sessionId', 'program', 'yearOfStudy', 'sessionStatus'] as const
const SESSION_STATUSES = ['DRAFT', 'UPCOMING', 'OPEN', 'CLOSING_SOON', 'CLOSED']

function validDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined
}

export function parseAnalyticsFilters(input: Record<string, string | string[] | undefined>): AnalyticsFilters {
  const value = (key: (typeof FILTER_VALUES)[number]) => {
    const item = input[key]
    return (Array.isArray(item) ? item[0] : item)?.trim()
  }
  const dateFrom = validDate(value('dateFrom'))
  const dateTo = validDate(value('dateTo'))
  const from = dateFrom && dateTo && dateFrom > dateTo ? dateTo : dateFrom
  const to = dateFrom && dateTo && dateFrom > dateTo ? dateFrom : dateTo
  const sessionStatus = value('sessionStatus')
  return {
    dateFrom: from,
    dateTo: to,
    sessionId: value('sessionId')?.slice(0, 120) || undefined,
    program: value('program')?.slice(0, 160) || undefined,
    yearOfStudy: value('yearOfStudy')?.slice(0, 80) || undefined,
    sessionStatus: sessionStatus && SESSION_STATUSES.includes(sessionStatus) ? sessionStatus : undefined,
  }
}

function toDistribution(rows: DistributionRow[]): DistributionItem[] {
  const total = rows.reduce((sum, row) => sum + Number(row.count), 0)
  return rows.map((row) => {
    const count = Number(row.count)
    return { label: row.label, count, percentage: total ? Math.round((count / total) * 100) : 0 }
  })
}

function attendanceScope(filters: AnalyticsFilters, alias = 'a') {
  return `
    ($1::date IS NULL OR ${alias}.submitted_at >= ($1::date::timestamp AT TIME ZONE 'Africa/Kigali'))
    AND ($2::date IS NULL OR ${alias}.submitted_at < (($2::date + 1)::timestamp AT TIME ZONE 'Africa/Kigali'))
    AND ($3::text IS NULL OR ${alias}.session_id = $3)
    AND ($4::text IS NULL OR COALESCE(NULLIF(BTRIM(${alias}.program), ''), 'Not provided') = $4)
    AND ($5::text IS NULL OR COALESCE(NULLIF(BTRIM(${alias}.year_of_study), ''), 'Not provided') = $5)
    AND ($6::text IS NULL OR EXISTS (
      SELECT 1 FROM sessions filter_session
      WHERE filter_session.id = ${alias}.session_id AND filter_session.status = $6
    ))`
}

function sessionScope(filters: AnalyticsFilters, alias = 's') {
  return `
    ($1::date IS NULL OR ${alias}.session_date >= $1::date)
    AND ($2::date IS NULL OR ${alias}.session_date <= $2::date)
    AND ($3::text IS NULL OR ${alias}.id = $3)
    AND ($6::text IS NULL OR ${alias}.status = $6)`
}

function filterValues(filters: AnalyticsFilters) {
  return [filters.dateFrom || null, filters.dateTo || null, filters.sessionId || null,
    filters.program || null, filters.yearOfStudy || null, filters.sessionStatus || null]
}

function mapSession(row: SessionRow): AnalyticsSessionOption {
  return { id: row.id, title: row.title, date: row.date, status: row.status }
}

export async function getGlobalAnalytics(filters: AnalyticsFilters = {}): Promise<GlobalAnalytics> {
  const values = filterValues(filters)
  const attendanceWhere = attendanceScope(filters)
  const sessionWhere = sessionScope(filters)
  const { overviewResult, monthlyResult, yearlyResult, distributionResult, topResult, sessionsResult, optionResult } = await withConnection(async (client) => {
    const overviewResult = await client.query<OverviewRow>(`
      WITH scoped AS (
        SELECT a.email, a.session_id FROM attendance_records a JOIN sessions s ON s.id = a.session_id WHERE ${attendanceWhere}
      ), session_count AS (
        SELECT count(*)::int AS total FROM sessions s WHERE ${sessionWhere}
          AND (($4::text IS NULL AND $5::text IS NULL) OR EXISTS (
            SELECT 1 FROM attendance_records filtered_attendee
            WHERE filtered_attendee.session_id=s.id AND ${attendanceScope(filters, 'filtered_attendee')}
          ))
      )
      SELECT (SELECT total FROM session_count) AS total_sessions,
        (SELECT count(*)::int FROM scoped) AS total_attendees,
        (SELECT count(DISTINCT lower(BTRIM(email)))::int FROM scoped) AS unique_attendees,
        (SELECT count(*)::int FROM (SELECT lower(BTRIM(email)) FROM scoped GROUP BY lower(BTRIM(email)) HAVING count(DISTINCT session_id) > 1) returning_attendee_groups) AS returning_attendees,
        (SELECT count(*)::int FROM attendance_records a JOIN sessions s ON s.id=a.session_id
          WHERE ${attendanceWhere}
            AND a.submitted_at >= (date_trunc('month', now() AT TIME ZONE 'Africa/Kigali') AT TIME ZONE 'Africa/Kigali')
            AND a.submitted_at < ((date_trunc('month', now() AT TIME ZONE 'Africa/Kigali') + interval '1 month') AT TIME ZONE 'Africa/Kigali')
        ) AS this_month_attendees,
        (SELECT count(*)::int FROM sessions s WHERE ${sessionWhere}
          AND s.status IN ('OPEN','CLOSING_SOON') AND now() BETWEEN s.attendance_opens AND s.attendance_closes
        ) AS active_sessions_count
    `, values)
    const monthlyResult = await client.query<MonthlyRow>(`
      WITH current_month AS (
        SELECT date_trunc('month', now() AT TIME ZONE 'Africa/Kigali') AS month_start
      ), months AS (
        SELECT generate_series(month_start - interval '11 months', month_start, interval '1 month') AS month_start FROM current_month
      )
      SELECT to_char(months.month_start, 'YYYY-MM') AS month,
        (SELECT count(*)::int FROM attendance_records a JOIN sessions s ON s.id=a.session_id
          WHERE ${attendanceWhere}
            AND a.submitted_at >= (months.month_start AT TIME ZONE 'Africa/Kigali')
            AND a.submitted_at < ((months.month_start + interval '1 month') AT TIME ZONE 'Africa/Kigali')
        ) AS attendees,
        (SELECT count(*)::int FROM sessions s WHERE ${sessionWhere}
          AND s.session_date >= months.month_start::date
          AND s.session_date < (months.month_start + interval '1 month')::date
        ) AS sessions
      FROM months ORDER BY months.month_start
    `, values)
    const yearlyResult = await client.query<YearRow>(`
      SELECT EXTRACT(YEAR FROM a.submitted_at AT TIME ZONE 'Africa/Kigali')::int AS year, count(*)::int AS attendees
      FROM attendance_records a JOIN sessions s ON s.id=a.session_id
      WHERE ${attendanceWhere}
      GROUP BY 1 ORDER BY year DESC
    `, values)
    const distributionResult = await client.query<DistributionRow>(`
      SELECT category, label, count FROM (
        SELECT 'participantType'::text AS category, a.participant_type AS label, count(*)::int AS count
          FROM attendance_records a JOIN sessions s ON s.id=a.session_id WHERE ${attendanceWhere} GROUP BY a.participant_type
        UNION ALL
        SELECT 'faculty', COALESCE(NULLIF(BTRIM(a.faculty), ''), 'Not provided'), count(*)::int
          FROM attendance_records a JOIN sessions s ON s.id=a.session_id WHERE ${attendanceWhere} GROUP BY 2
        UNION ALL
        SELECT 'program', COALESCE(NULLIF(BTRIM(a.program), ''), 'Not provided'), count(*)::int
          FROM attendance_records a JOIN sessions s ON s.id=a.session_id WHERE ${attendanceWhere} GROUP BY 2
        UNION ALL
        SELECT 'year', COALESCE(NULLIF(BTRIM(a.year_of_study), ''), 'Not provided'), count(*)::int
          FROM attendance_records a JOIN sessions s ON s.id=a.session_id WHERE ${attendanceWhere} GROUP BY 2
        UNION ALL
        SELECT 'sessionType', s.type, count(*)::int
          FROM attendance_records a JOIN sessions s ON s.id=a.session_id WHERE ${attendanceWhere} GROUP BY s.type
      ) distributions ORDER BY category, count DESC, label
    `, values)
    const topResult = await client.query<SessionRow>(`
      SELECT s.id, s.title, s.session_date::text AS date, s.status,
        count(a.id) FILTER (WHERE ${attendanceWhere})::int AS attendance
      FROM sessions s LEFT JOIN attendance_records a ON a.session_id=s.id
      WHERE ${sessionWhere}
      GROUP BY s.id
      HAVING count(a.id) FILTER (WHERE ${attendanceWhere}) > 0
      ORDER BY attendance DESC, s.session_date DESC, s.title LIMIT 8
    `, values)
    const sessionsResult = await client.query<SessionRow>(`
      SELECT s.id, s.title, s.session_date::text AS date, s.status, count(a.id)::int AS attendance
      FROM sessions s LEFT JOIN attendance_records a ON a.session_id=s.id
      GROUP BY s.id ORDER BY s.session_date DESC, s.start_time DESC
    `)
    const optionResult = await client.query<OptionRow>(`
      SELECT category, label FROM (
        SELECT 'program'::text AS category, COALESCE(NULLIF(BTRIM(program), ''), 'Not provided') AS label
          FROM attendance_records GROUP BY 2
        UNION ALL
        SELECT 'year', COALESCE(NULLIF(BTRIM(year_of_study), ''), 'Not provided')
          FROM attendance_records GROUP BY 2
      ) options ORDER BY category, label
    `)
    return { overviewResult, monthlyResult, yearlyResult, distributionResult, topResult, sessionsResult, optionResult }
  })

  const overview = overviewResult.rows[0]
  const totalSessions = Number(overview?.total_sessions || 0)
  const totalAttendees = Number(overview?.total_attendees || 0)
  const records = distributionResult.rows
  const byCategory = (category: DistributionCategory) => toDistribution(records.filter((row) => row.category === category))
  const sessionOptions: AnalyticsSessionSummary[] = sessionsResult.rows.map((row) => ({ ...mapSession(row), attendance: Number(row.attendance) }))
  const todayParts = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const todayValues = Object.fromEntries(todayParts.map((part) => [part.type, part.value]))
  const todayKigali = `${todayValues.year}-${todayValues.month}-${todayValues.day}`
  const facultyDistribution = byCategory('faculty')

  return {
    overview: {
      totalSessions,
      totalAttendees,
      uniqueAttendees: Number(overview?.unique_attendees || 0),
      returningAttendees: Number(overview?.returning_attendees || 0),
      thisMonthAttendees: Number(overview?.this_month_attendees || 0),
      averageAttendance: totalSessions ? Math.round(totalAttendees / totalSessions) : 0,
      activeSessionsCount: Number(overview?.active_sessions_count || 0),
    },
    attendanceByMonth: monthlyResult.rows.map((row) => ({ month: row.month, attendees: Number(row.attendees), sessions: Number(row.sessions) })),
    attendanceByYear: yearlyResult.rows.map((row) => ({ year: Number(row.year), attendees: Number(row.attendees) })),
    attendanceBySessionType: byCategory('sessionType'),
    attendanceByParticipantType: byCategory('participantType'),
    academicDistribution: { faculties: facultyDistribution, programs: byCategory('program'), years: byCategory('year') },
    filterOptions: {
      programs: optionResult.rows.filter((row) => row.category === 'program').map((row) => row.label),
      years: optionResult.rows.filter((row) => row.category === 'year').map((row) => row.label),
    },
    topFaculties: facultyDistribution.slice(0, 5),
    mostAttendedSessions: topResult.rows.map((row) => ({ ...mapSession(row), attendance: Number(row.attendance) })),
    recentSessions: sessionsResult.rows
      .filter((row) => row.date < todayKigali)
      .slice(0, 5)
      .map(mapSession),
    upcomingSessions: sessionsResult.rows
      .filter((row) => row.date >= todayKigali && ['UPCOMING', 'OPEN', 'CLOSING_SOON'].includes(row.status))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
      .map(mapSession),
    sessionOptions: sessionsResult.rows.map(mapSession),
  }
}

export async function getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
  const { sessionResult, distributionResult, timelineResult, reflectionsResult } = await withConnection(async (client) => {
    const sessionResult = await client.query<{
      id: string; title: string; session_date: string; status: string; location: string
      start_time: string; end_time: string; attendance_opens: string; attendance_closes: string
      duration_minutes: number | string; total_attendance: number | string; unique_attendees: number | string
      returning_attendees: number | string; feedback_count: number | string; key_takeaway_count: number | string
    }>(`
      SELECT s.id, s.title, s.session_date::text AS session_date, s.status, s.location,
        s.start_time::text AS start_time, s.end_time::text AS end_time,
        s.attendance_opens::text AS attendance_opens, s.attendance_closes::text AS attendance_closes,
        GREATEST(0, EXTRACT(EPOCH FROM ((s.session_date + s.end_time) - (s.session_date + s.start_time))) / 60)::int AS duration_minutes,
        count(a.id)::int AS total_attendance, count(DISTINCT lower(BTRIM(a.email)))::int AS unique_attendees,
        count(DISTINCT lower(BTRIM(a.email))) FILTER (WHERE EXISTS (
          SELECT 1 FROM attendance_records earlier
          WHERE lower(BTRIM(earlier.email))=lower(BTRIM(a.email)) AND earlier.session_id<>s.id AND earlier.submitted_at<a.submitted_at
        ))::int AS returning_attendees,
        count(a.feedback) FILTER (WHERE NULLIF(BTRIM(a.feedback),'') IS NOT NULL)::int AS feedback_count,
        count(a.key_takeaway) FILTER (WHERE NULLIF(BTRIM(a.key_takeaway),'') IS NOT NULL)::int AS key_takeaway_count
      FROM sessions s LEFT JOIN attendance_records a ON a.session_id=s.id
      WHERE s.id=$1 GROUP BY s.id
    `, [sessionId])
    const distributionResult = await client.query<DistributionRow & { category: 'participantType' | 'faculty' | 'program' | 'year' }>(`
      SELECT category, label, count FROM (
        SELECT 'participantType'::text AS category, participant_type AS label, count(*)::int AS count FROM attendance_records WHERE session_id=$1 GROUP BY participant_type
        UNION ALL
        SELECT 'faculty', COALESCE(NULLIF(BTRIM(faculty), ''), 'Not provided'), count(*)::int FROM attendance_records WHERE session_id=$1 GROUP BY 2
        UNION ALL
        SELECT 'program', COALESCE(NULLIF(BTRIM(program), ''), 'Not provided'), count(*)::int FROM attendance_records WHERE session_id=$1 GROUP BY 2
        UNION ALL
        SELECT 'year', COALESCE(NULLIF(BTRIM(year_of_study), ''), 'Not provided'), count(*)::int FROM attendance_records WHERE session_id=$1 GROUP BY 2
      ) distributions ORDER BY category, count DESC, label
    `, [sessionId])
    const timelineResult = await client.query<{ timestamp: string; count: number | string }>(`
      SELECT to_char(date_trunc('hour', submitted_at AT TIME ZONE 'Africa/Kigali'), 'YYYY-MM-DD HH24:00') AS timestamp,
        count(*)::int AS count FROM attendance_records WHERE session_id=$1
      GROUP BY 1 ORDER BY 1
    `, [sessionId])
    const reflectionsResult = await client.query<{ key_takeaway: string | null; feedback: string | null; submitted_at: string }>(`
      SELECT key_takeaway, feedback, submitted_at::text AS submitted_at FROM attendance_records
      WHERE session_id=$1 AND (NULLIF(BTRIM(key_takeaway),'') IS NOT NULL OR NULLIF(BTRIM(feedback),'') IS NOT NULL)
      ORDER BY submitted_at DESC LIMIT 12
    `, [sessionId])
    return { sessionResult, distributionResult, timelineResult, reflectionsResult }
  })

  const session = sessionResult.rows[0]
  if (!session) return null
  const categories = (category: 'participantType' | 'faculty' | 'program' | 'year') => toDistribution(
    distributionResult.rows.filter((row) => row.category === category),
  )
  return {
    sessionId: session.id,
    sessionTitle: session.title,
    sessionDate: session.session_date,
    sessionStatus: session.status,
    location: session.location,
    startTime: session.start_time.slice(0, 5),
    endTime: session.end_time.slice(0, 5),
    attendanceOpens: session.attendance_opens,
    attendanceCloses: session.attendance_closes,
    durationMinutes: Number(session.duration_minutes),
    totalAttendance: Number(session.total_attendance),
    uniqueAttendees: Number(session.unique_attendees),
    returningAttendees: Number(session.returning_attendees),
    attendancePercentage: null,
    rejectedSubmissions: null,
    feedbackCount: Number(session.feedback_count),
    keyTakeawayCount: Number(session.key_takeaway_count),
    facultyDistribution: categories('faculty'),
    programDistribution: categories('program'),
    yearDistribution: categories('year'),
    participantTypeDistribution: categories('participantType'),
    attendanceTimeline: timelineResult.rows.map((row) => ({ timestamp: row.timestamp, count: Number(row.count) })),
    recentReflections: reflectionsResult.rows.map((row) => ({ keyTakeaway: row.key_takeaway, feedback: row.feedback, submittedAt: row.submitted_at })),
  }
}
