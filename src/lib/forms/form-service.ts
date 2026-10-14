import { randomUUID } from 'node:crypto'
import { query, withTransaction } from '../database/client'
import { createDefaultAttendanceForm, parseAttendanceFormConfig, validateAttendanceResponses, type AttendanceFormConfig, type AttendanceResponseValue } from './attendance-form'
import { getResponseWindowState } from './response-window'

export interface CustomForm {
  id: string
  publicToken: string
  title: string
  eventDate: string
  startTime: string
  endTime: string
  location: string
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  draftConfig: AttendanceFormConfig
  publishedConfig: AttendanceFormConfig | null
  draftRevision: number
  publishedVersion: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  responseOpensAt: string | null
  responseClosesAt: string | null
  responseOverrideUntil: string | null
  archivedAt: string | null
}

export interface CustomFormSubmission {
  id: string
  formId: string
  fullName: string
  email: string
  responses: Record<string, AttendanceResponseValue>
  formVersion: number
  formSnapshot: AttendanceFormConfig
  submittedAt: string
}

type FormRow = {
  id: string; public_token: string; title: string; event_date: string; start_time: string; end_time: string; location: string
  status: CustomForm['status']; draft_config: unknown; published_config: unknown; draft_revision: number; published_version: number
  created_at: Date; updated_at: Date; published_at: Date | null
  response_opens_at: Date | null; response_closes_at: Date | null
  response_override_until: Date | null; archived_at: Date | null
}

function mapForm(row: FormRow): CustomForm {
  return {
    id: row.id,
    publicToken: row.public_token,
    title: row.title,
    eventDate: row.event_date,
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    location: row.location,
    status: row.status,
    draftConfig: parseAttendanceFormConfig(row.draft_config),
    publishedConfig: row.published_config ? parseAttendanceFormConfig(row.published_config) : null,
    draftRevision: row.draft_revision,
    publishedVersion: row.published_version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    publishedAt: row.published_at?.toISOString() ?? null,
    responseOpensAt: row.response_opens_at?.toISOString() ?? null,
    responseClosesAt: row.response_closes_at?.toISOString() ?? null,
    responseOverrideUntil: row.response_override_until?.toISOString() ?? null,
    archivedAt: row.archived_at?.toISOString() ?? null,
  }
}

// PostgreSQL's default DATE parser can turn a calendar date into a JavaScript Date.
// Format it in SQL so forms always cross the server boundary as YYYY-MM-DD.
const FORM_COLUMNS = `id,public_token,title,to_char(event_date, 'YYYY-MM-DD') AS event_date,start_time,end_time,location,status,draft_config,published_config,
  draft_revision,published_version,created_at,updated_at,published_at,response_opens_at,response_closes_at,response_override_until,archived_at`

export async function createCustomForm(input: { title: string; eventDate: string; startTime: string; endTime: string; location: string }, userId: string): Promise<CustomForm> {
  const id = `form_${randomUUID()}`
  const token = randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '')
  const config = createDefaultAttendanceForm()
  const result = await query<FormRow>(
    `INSERT INTO custom_forms(id,public_token,title,event_date,start_time,end_time,location,draft_config,response_opens_at,response_closes_at,created_by_id,updated_by_id)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,now(),($4::date + $6::time) AT TIME ZONE 'Africa/Kigali',$9,$9) RETURNING ${FORM_COLUMNS}`,
    [id, token, input.title.trim(), input.eventDate, input.startTime, input.endTime, input.location.trim(), JSON.stringify(config), userId],
  )
  return mapForm(result.rows[0])
}

export async function getCustomForms(): Promise<Array<Omit<CustomForm, 'draftConfig' | 'publishedConfig'> & { responseCount: number }>> {
  const result = await query<FormRow & { response_count: number }>(
    `SELECT ${FORM_COLUMNS},
       (SELECT count(*)::int FROM custom_form_submissions submission_record WHERE submission_record.form_id=custom_forms.id) AS response_count
     FROM custom_forms ORDER BY archived_at NULLS FIRST,created_at DESC`,
  )
  return result.rows.map((row) => {
    const form = mapForm(row)
    const { draftConfig: _draftConfig, publishedConfig: _publishedConfig, ...summary } = form
    return { ...summary, responseCount: row.response_count }
  })
}

export async function getCustomFormById(id: string): Promise<CustomForm | undefined> {
  const result = await query<FormRow>(`SELECT ${FORM_COLUMNS} FROM custom_forms WHERE id=$1`, [id])
  return result.rows[0] ? mapForm(result.rows[0]) : undefined
}

export async function getPublicCustomForm(token: string) {
  const result = await query<FormRow>(`SELECT ${FORM_COLUMNS} FROM custom_forms WHERE public_token=$1 AND status IN ('PUBLISHED','CLOSED') AND archived_at IS NULL`, [token])
  if (!result.rows[0]) return undefined
  const form = mapForm(result.rows[0])
  if (!form.publishedConfig) return undefined
  const windowState = getResponseWindowState(form)
  return {
    title: form.title,
    eventDate: form.eventDate,
    startTime: form.startTime,
    endTime: form.endTime,
    location: form.location,
    config: form.publishedConfig,
    version: form.publishedVersion,
    status: form.status,
    responseOpensAt: form.responseOpensAt,
    responseClosesAt: form.responseClosesAt,
    responseOverrideUntil: form.responseOverrideUntil,
    acceptanceState: windowState,
  }
}

export class FormRevisionConflictError extends Error {
  constructor() { super('This form was updated by another staff member. Reload the latest saved draft before continuing.') }
}

export async function saveCustomFormDraft(id: string, configInput: unknown, expectedRevision: number, userId: string): Promise<CustomForm> {
  const config = parseAttendanceFormConfig(configInput)
  return withTransaction(async (client) => {
    const current = await client.query<{ draft_revision: number; archived_at: Date | null }>(`SELECT draft_revision,archived_at FROM custom_forms WHERE id=$1 FOR UPDATE`, [id])
    if (!current.rowCount) throw new Error('FORM_NOT_FOUND')
    if (current.rows[0].archived_at) throw new Error('FORM_ARCHIVED')
    if (current.rows[0].draft_revision !== expectedRevision) throw new FormRevisionConflictError()
    const updated = await client.query<FormRow>(
      `UPDATE custom_forms SET draft_config=$2::jsonb,draft_revision=draft_revision+1,updated_by_id=$3,updated_at=now()
       WHERE id=$1 RETURNING ${FORM_COLUMNS}`,
      [id, JSON.stringify(config), userId],
    )
    return mapForm(updated.rows[0])
  })
}

export async function publishCustomForm(id: string, expectedRevision: number, userId: string): Promise<CustomForm> {
  return withTransaction(async (client) => {
    const current = await client.query<{ draft_config: unknown; draft_revision: number; published_version: number; status: CustomForm['status']; archived_at: Date | null }>(
      `SELECT draft_config,draft_revision,published_version,status,archived_at FROM custom_forms WHERE id=$1 FOR UPDATE`, [id],
    )
    if (!current.rowCount) throw new Error('FORM_NOT_FOUND')
    const row = current.rows[0]
    if (row.archived_at) throw new Error('FORM_ARCHIVED')
    if (row.draft_revision !== expectedRevision) throw new FormRevisionConflictError()
    if (row.status === 'CLOSED') throw new Error('FORM_CLOSED')
    const config = parseAttendanceFormConfig(row.draft_config)
    const version = row.published_version + 1
    config.version = version
    const updated = await client.query<FormRow>(
      `UPDATE custom_forms SET published_config=$2::jsonb,published_version=$3,status='PUBLISHED',published_at=now(),updated_by_id=$4,updated_at=now()
       WHERE id=$1 RETURNING ${FORM_COLUMNS}`,
      [id, JSON.stringify(config), version, userId],
    )
    await client.query(
      `INSERT INTO custom_form_versions(form_id,version,config,published_by_id) VALUES($1,$2,$3::jsonb,$4)`,
      [id, version, JSON.stringify(config), userId],
    )
    return mapForm(updated.rows[0])
  })
}

type SubmissionRow = {
  id: string; form_id: string; full_name: string; email: string; responses: Record<string, AttendanceResponseValue>
  form_version: number; form_snapshot: unknown; submitted_at: Date
}

function mapSubmission(row: SubmissionRow): CustomFormSubmission {
  return {
    id: row.id,
    formId: row.form_id,
    fullName: row.full_name,
    email: row.email,
    responses: row.responses,
    formVersion: row.form_version,
    formSnapshot: parseAttendanceFormConfig(row.form_snapshot),
    submittedAt: row.submitted_at.toISOString(),
  }
}

const SUBMISSION_COLUMNS = 'id,form_id,full_name,email,responses,form_version,form_snapshot,submitted_at'

export async function recordCustomFormSubmission(token: string, rawResponses: unknown, idempotencyKey: string) {
  return withTransaction(async (client) => {
    const selected = await client.query<FormRow>(
      `SELECT ${FORM_COLUMNS} FROM custom_forms WHERE public_token=$1 AND status IN ('PUBLISHED','CLOSED') AND archived_at IS NULL FOR UPDATE`, [token],
    )
    if (!selected.rowCount) throw new Error('FORM_NOT_AVAILABLE')
    const form = mapForm(selected.rows[0])
    if (!form.publishedConfig) throw new Error('FORM_NOT_AVAILABLE')

    const existingKey = await client.query<SubmissionRow>(
      `SELECT ${SUBMISSION_COLUMNS} FROM custom_form_submissions WHERE form_id=$1 AND idempotency_key=$2`,
      [form.id, idempotencyKey],
    )
    if (existingKey.rows[0]) return { submission: mapSubmission(existingKey.rows[0]), created: false }
    if (getResponseWindowState(form) !== 'ACCEPTING') throw new Error('FORM_NOT_ACCEPTING')

    const responses = validateAttendanceResponses(form.publishedConfig, rawResponses)
    const fullName = responses.full_name
    const email = responses.email
    if (typeof fullName !== 'string' || typeof email !== 'string') throw new Error('Full Name and Email Address are required.')
    const existingEmail = await client.query('SELECT 1 FROM custom_form_submissions WHERE form_id=$1 AND email=$2 LIMIT 1', [form.id, email])
    if (existingEmail.rowCount) throw new Error('An attendance response already exists for this email address.')
    const id = `form_submission_${randomUUID()}`
    const result = await client.query<SubmissionRow>(
      `INSERT INTO custom_form_submissions(id,form_id,full_name,email,responses,form_version,form_snapshot,idempotency_key)
       VALUES($1,$2,$3,$4,$5::jsonb,$6,$7::jsonb,$8) RETURNING ${SUBMISSION_COLUMNS}`,
      [id, form.id, fullName.trim(), email.trim().toLowerCase(), JSON.stringify(responses), form.publishedVersion,
        JSON.stringify(form.publishedConfig), idempotencyKey],
    )
    return { submission: mapSubmission(result.rows[0]), created: true }
  })
}

export async function getCustomFormSubmissions(formId: string): Promise<CustomFormSubmission[]> {
  const result = await query<SubmissionRow>(`SELECT ${SUBMISSION_COLUMNS} FROM custom_form_submissions WHERE form_id=$1 ORDER BY submitted_at DESC`, [formId])
  return result.rows.map(mapSubmission)
}

export async function getCustomFormSubmission(formId: string, submissionId: string): Promise<CustomFormSubmission | undefined> {
  const result = await query<SubmissionRow>(`SELECT ${SUBMISSION_COLUMNS} FROM custom_form_submissions WHERE form_id=$1 AND id=$2`, [formId, submissionId])
  return result.rows[0] ? mapSubmission(result.rows[0]) : undefined
}

export async function getLatestCustomFormEmailStatus(submissionId: string): Promise<'ACCEPTED' | 'FAILED' | 'SENDING' | null> {
  const result = await query<{ status: 'ACCEPTED' | 'FAILED' | 'SENDING' }>(
    `SELECT status FROM custom_form_email_deliveries WHERE submission_id=$1 ORDER BY attempted_at DESC LIMIT 1`, [submissionId],
  )
  return result.rows[0]?.status ?? null
}

export async function claimCustomFormEmailAttempt(submissionId: string): Promise<{ attemptId: string; attemptCount: number } | { status: 'ACCEPTED' | 'SENDING' }> {
  return withTransaction(async (client) => {
    const submission = await client.query('SELECT id FROM custom_form_submissions WHERE id=$1 FOR UPDATE', [submissionId])
    if (!submission.rowCount) throw new Error('FORM_SUBMISSION_NOT_FOUND')
    const latest = await client.query<{ id: string; status: 'SENDING' | 'ACCEPTED' | 'FAILED'; attempted_at: Date }>(
      `SELECT id,status,attempted_at FROM custom_form_email_deliveries WHERE submission_id=$1 ORDER BY attempted_at DESC LIMIT 1 FOR UPDATE`, [submissionId],
    )
    const delivery = latest.rows[0]
    if (delivery?.status === 'ACCEPTED') return { status: 'ACCEPTED' }
    if (delivery?.status === 'SENDING' && Date.now() - delivery.attempted_at.getTime() < 5 * 60 * 1000) return { status: 'SENDING' }
    if (delivery?.status === 'SENDING') {
      await client.query(`UPDATE custom_form_email_deliveries SET status='FAILED',safe_error='Previous attempt timed out.' WHERE id=$1`, [delivery.id])
    }
    const attemptCount = await client.query<{ count: number }>(`SELECT count(*)::int+1 AS count FROM custom_form_email_deliveries WHERE submission_id=$1`, [submissionId])
    const attemptId = `form_mail_${randomUUID()}`
    await client.query(
      `INSERT INTO custom_form_email_deliveries(id,submission_id,status,attempt_count)
       VALUES($1,$2,'SENDING',$3)`, [attemptId, submissionId, attemptCount.rows[0].count],
    )
    return { attemptId, attemptCount: attemptCount.rows[0].count }
  })
}

export async function finishCustomFormEmailAttempt(input: { attemptId: string; status: 'ACCEPTED' | 'FAILED'; messageId?: string; error?: string }): Promise<void> {
  await query(
    `UPDATE custom_form_email_deliveries SET status=$2,provider_message_id=$3,safe_error=$4,attempted_at=now()
     WHERE id=$1 AND status='SENDING'`,
    [input.attemptId, input.status, input.messageId || null, input.error?.slice(0, 300) || null],
  )
}

export async function getCustomFormDeliveryHistory(submissionIds: string[]) {
  if (!submissionIds.length) return new Map<string, { status: 'ACCEPTED' | 'FAILED'; attemptedAt: string }>()
  const result = await query<{ submission_id: string; status: 'ACCEPTED' | 'FAILED' | 'SENDING'; attempted_at: Date }>(
    `SELECT DISTINCT ON (submission_id) submission_id,status,attempted_at FROM custom_form_email_deliveries
     WHERE submission_id=ANY($1::text[]) ORDER BY submission_id,attempted_at DESC`, [submissionIds],
  )
  return new Map(result.rows.map((row) => [row.submission_id, { status: row.status, attemptedAt: row.attempted_at.toISOString() }]))
}

export async function closeCustomForm(id: string, userId?: string): Promise<void> {
  const result = await query(`UPDATE custom_forms SET status='CLOSED',response_override_until=NULL,
       updated_by_id=COALESCE($2,updated_by_id),updated_at=now()
     WHERE id=$1 AND status IN ('PUBLISHED','CLOSED') AND published_config IS NOT NULL AND archived_at IS NULL`, [id, userId ?? null])
  if (!result.rowCount) throw new Error('FORM_NOT_FOUND_OR_NOT_PUBLISHED')
}

export async function reopenCustomForm(id: string, userId?: string): Promise<void> {
  const result = await query(
    `UPDATE custom_forms SET status='PUBLISHED',response_opens_at=now(),response_override_until=NULL,
       response_closes_at=CASE WHEN response_closes_at <= now() THEN NULL ELSE response_closes_at END,
       updated_by_id=COALESCE($2,updated_by_id),updated_at=now()
     WHERE id=$1 AND status IN ('PUBLISHED','CLOSED') AND published_config IS NOT NULL AND archived_at IS NULL`, [id, userId ?? null],
  )
  if (!result.rowCount) throw new Error('FORM_NOT_FOUND_OR_NOT_CLOSED')
}

export async function updateCustomFormResponseWindow(id: string, opensAt: string, closesAt: string, userId: string): Promise<CustomForm> {
  const opens = new Date(opensAt)
  const closes = new Date(closesAt)
  if (!Number.isFinite(opens.getTime()) || !Number.isFinite(closes.getTime()) || closes <= opens) {
    throw new Error('The response closing time must be later than the opening time.')
  }
  const result = await query<FormRow>(
    `UPDATE custom_forms SET response_opens_at=$2::timestamptz,response_closes_at=$3::timestamptz,
       updated_by_id=$4,updated_at=now() WHERE id=$1 AND archived_at IS NULL RETURNING ${FORM_COLUMNS}`,
    [id, opens.toISOString(), closes.toISOString(), userId],
  )
  if (!result.rowCount) throw new Error('FORM_NOT_FOUND')
  return mapForm(result.rows[0])
}

export async function setCustomFormResponseOverride(id: string, minutes: number | null, userId?: string): Promise<CustomForm> {
  const result = await query<FormRow>(
    `UPDATE custom_forms SET response_override_until=CASE
       WHEN $2::int IS NULL THEN NULL ELSE now() + ($2::int * interval '1 minute') END,
       updated_by_id=COALESCE($3,updated_by_id),updated_at=now()
     WHERE id=$1 AND published_config IS NOT NULL AND archived_at IS NULL
     RETURNING ${FORM_COLUMNS}`,
    [id, minutes, userId ?? null],
  )
  if (!result.rowCount) throw new Error('FORM_NOT_FOUND_OR_UNPUBLISHED')
  return mapForm(result.rows[0])
}

export async function archiveCustomForm(id: string, userId?: string): Promise<CustomForm | undefined> {
  const result = await query<FormRow>(
    `UPDATE custom_forms SET archived_at=now(),response_override_until=NULL,updated_by_id=COALESCE($2,updated_by_id),updated_at=now()
     WHERE id=$1 AND archived_at IS NULL RETURNING ${FORM_COLUMNS}`,
    [id, userId ?? null],
  )
  return result.rows[0] ? mapForm(result.rows[0]) : undefined
}

export async function restoreCustomForm(id: string, userId?: string): Promise<CustomForm | undefined> {
  const result = await query<FormRow>(
    `UPDATE custom_forms SET archived_at=NULL,updated_by_id=COALESCE($2,updated_by_id),updated_at=now()
     WHERE id=$1 AND archived_at IS NOT NULL RETURNING ${FORM_COLUMNS}`,
    [id, userId ?? null],
  )
  return result.rows[0] ? mapForm(result.rows[0]) : undefined
}

export async function getCustomFormByToken(token: string): Promise<CustomForm | undefined> {
  const result = await query<FormRow>(`SELECT ${FORM_COLUMNS} FROM custom_forms WHERE public_token=$1 AND archived_at IS NULL`, [token])
  return result.rows[0] ? mapForm(result.rows[0]) : undefined
}

export async function consumeCustomFormRateLimit(token: string, clientHash: string, limit = 10, windowSeconds = 60): Promise<number | null> {
  const form = await query<{ id: string }>(
    `SELECT id FROM custom_forms WHERE public_token=$1 AND published_config IS NOT NULL AND archived_at IS NULL
     AND (status='PUBLISHED' OR response_override_until > now())`,
    [token],
  )
  if (!form.rows[0]) return null
  const result = await query<{ attempts: number }>(
    `INSERT INTO custom_form_rate_limits(form_id,client_hash,window_started_at,attempts)
     VALUES($1,$2,now(),1)
     ON CONFLICT(form_id,client_hash) DO UPDATE SET
       attempts=CASE WHEN custom_form_rate_limits.window_started_at <= now() - make_interval(secs => $3)
         THEN 1 ELSE custom_form_rate_limits.attempts + 1 END,
       window_started_at=CASE WHEN custom_form_rate_limits.window_started_at <= now() - make_interval(secs => $3)
         THEN now() ELSE custom_form_rate_limits.window_started_at END
     RETURNING attempts`,
    [form.rows[0].id, clientHash, windowSeconds],
  )
  if (Math.random() < 0.02) await query(`DELETE FROM custom_form_rate_limits WHERE window_started_at < now() - interval '48 hours'`)
  return result.rows[0]?.attempts ?? null
}
