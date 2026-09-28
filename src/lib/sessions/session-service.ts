import { randomUUID } from 'node:crypto'
import { query, withTransaction } from '../database/client'
import { Session, CreateSessionInput, SessionStatus } from '../../types/session'

type SessionRow = {
  id: string; title: string; description: string; type: Session['type']; status: SessionStatus
  location: string; session_date: string; start_time: string; end_time: string
  attendance_opens: Date; attendance_closes: Date; public_token: string
  attendance_override_until: Date | null
  duplicate_policy: Session['duplicatePolicy']; created_by_id: string | null
  created_at: Date; updated_at: Date; attendance_count: string; questions?: Session['questions']
}

const SELECT_SESSION = `
  SELECT s.*, count(DISTINCT a.id)::text AS attendance_count,
    COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id',q.id,'sessionId',q.session_id,'label',q.label,
      'description',q.description,'type',q.question_type,'required',q.required,'options',q.options,
      'order',q.display_order,'createdAt',q.created_at))
      FILTER (WHERE q.id IS NOT NULL), '[]'::jsonb) AS questions
  FROM sessions s LEFT JOIN attendance_records a ON a.session_id = s.id
  LEFT JOIN session_questions q ON q.session_id = s.id
`

function mapSession(row: SessionRow): Session {
  return {
    id: row.id, title: row.title, description: row.description, type: row.type,
    status: row.status, location: row.location, date: row.session_date,
    startTime: row.start_time.slice(0, 5), endTime: row.end_time.slice(0, 5),
    attendanceOpens: row.attendance_opens.toISOString(),
    attendanceCloses: row.attendance_closes.toISOString(), publicToken: row.public_token,
    attendanceOverrideUntil: row.attendance_override_until?.toISOString() ?? null,
    duplicatePolicy: row.duplicate_policy, createdById: row.created_by_id,
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
    _count: { attendance: Number(row.attendance_count) },
    questions: row.questions,
  }
}

async function getSession(sql: string, values: unknown[]): Promise<Session | undefined> {
  const result = await query<SessionRow>(`${SELECT_SESSION} WHERE ${sql} GROUP BY s.id`, values)
  return result.rows[0] ? mapSession(result.rows[0]) : undefined
}

export async function getAllSessions(): Promise<Session[]> {
  const result = await query<SessionRow>(`${SELECT_SESSION} GROUP BY s.id ORDER BY s.session_date DESC, s.start_time DESC`)
  return result.rows.map(mapSession)
}

export async function getRecentSessions(limit = 5): Promise<Session[]> {
  const result = await query<SessionRow>(`
    SELECT s.*,
      (SELECT count(*)::text FROM attendance_records a WHERE a.session_id = s.id) AS attendance_count
    FROM sessions s
    ORDER BY s.session_date DESC, s.start_time DESC
    LIMIT $1
  `, [limit])
  return result.rows.map(mapSession)
}

export const getSessionById = (id: string) => getSession('s.id = $1', [id])
export const getSessionByPublicToken = (token: string) => getSession('s.public_token = $1', [token])

export async function createSession(input: CreateSessionInput, createdById?: string): Promise<Session> {
  const id = `sess_${randomUUID()}`
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '')
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO sessions (id,title,description,type,status,location,session_date,start_time,end_time,
        attendance_opens,attendance_closes,public_token,duplicate_policy,created_by_id)
       VALUES ($1,$2,$3,$4,'UPCOMING',$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id, input.title.trim(), input.description?.trim() || '', input.type, input.location.trim(), input.date,
        input.startTime, input.endTime, input.attendanceOpens, input.attendanceCloses, token,
        input.duplicatePolicy || 'PREVENT_BY_EMAIL', createdById || null],
    )
    for (const [index, question] of (input.questions || []).entries()) {
      await client.query(
        `INSERT INTO session_questions (id,session_id,label,description,question_type,required,options,display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [`q_${randomUUID()}`, id, question.label, question.description || null, question.type,
          question.required, question.options ? JSON.stringify(question.options) : null, question.order ?? index],
      )
    }
  })
  const session = await getSessionById(id)
  if (!session) throw new Error('Session was created but could not be loaded')
  return session
}

export async function updateSessionStatus(id: string, status: SessionStatus): Promise<Session | null> {
  const result = await query('UPDATE sessions SET status=$2, updated_at=now() WHERE id=$1', [id, status])
  return result.rowCount ? (await getSessionById(id)) || null : null
}

export async function setSessionAttendanceOverride(id: string, minutes: number | null): Promise<Session | null> {
  const result = await query(
    `UPDATE sessions SET attendance_override_until=CASE
       WHEN $2::int IS NULL THEN NULL ELSE now() + ($2::int * interval '1 minute') END,
       updated_at=now()
     WHERE id=$1`,
    [id, minutes],
  )
  return result.rowCount ? (await getSessionById(id)) || null : null
}

export async function updateSessionContent(id: string, input: CreateSessionInput): Promise<Session | null> {
  const result = await query(
    `UPDATE sessions SET title=$2,description=$3,type=$4,location=$5,session_date=$6,start_time=$7,end_time=$8,
      attendance_opens=$9,attendance_closes=$10,duplicate_policy=$11,updated_at=now()
     WHERE id=$1`,
    [id, input.title.trim(), input.description.trim(), input.type, input.location.trim(), input.date,
      input.startTime, input.endTime, input.attendanceOpens, input.attendanceCloses, input.duplicatePolicy],
  )
  return result.rowCount ? (await getSessionById(id)) || null : null
}

export async function deleteSessionAndAttendance(id: string): Promise<{ attendanceDeleted: number } | null> {
  return withTransaction(async (client) => {
    const session = await client.query('SELECT id FROM sessions WHERE id=$1 FOR UPDATE', [id])
    if (!session.rowCount) return null

    const attendance = await client.query('DELETE FROM attendance_records WHERE session_id=$1', [id])
    await client.query('DELETE FROM sessions WHERE id=$1', [id])
    return { attendanceDeleted: attendance.rowCount ?? 0 }
  })
}
