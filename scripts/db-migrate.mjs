import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import pg from 'pg'

for (const file of ['.env.local', '.env']) {
  try {
    const contents = await readFile(resolve(file), 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match || process.env[match[1]]) continue
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  } catch {}
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing from environment/.env.local/.env')
const host = new URL(process.env.DATABASE_URL).hostname
const useSsl = process.env.DATABASE_SSL === 'true' || (!process.env.DATABASE_SSL && !['localhost', '127.0.0.1', '::1'].includes(host))
const ca = process.env.DATABASE_SSL_CA_FILE ? await readFile(resolve(process.env.DATABASE_SSL_CA_FILE), 'utf8') : undefined
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: useSsl ? { rejectUnauthorized: true, ...(ca ? { ca } : {}) } : undefined, connectionTimeoutMillis: 10_000 })
try {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
  const files = (await readdir(resolve('database/migrations'))).filter((name) => name.endsWith('.sql')).sort()
  for (const name of files) {
    const done = await pool.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name])
    if (done.rowCount) continue
    const sql = await readFile(resolve('database/migrations', name), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      if (sql.trim()) await client.query(sql)
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name])
      await client.query('COMMIT')
      console.log(`Applied ${name}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  const required = ['users', 'sessions', 'session_questions', 'attendance_records', 'user_invitations', 'email_delivery_log', 'activity_log', 'schema_migrations']
  const result = await pool.query('SELECT table_name FROM unnest($1::text[]) AS required(table_name) WHERE to_regclass(\'public.\' || table_name) IS NULL', [required])
  if (result.rowCount) throw new Error(`Database migration completed but required tables are missing: ${result.rows.map((row) => row.table_name).join(', ')}`)
  console.log(`Database ready: verified ${required.join(', ')}`)
} catch (error) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
  if (code === 'ENETUNREACH' || code === 'EHOSTUNREACH') {
    console.error('PostgreSQL resolved to an IPv6 address that this machine cannot route to. If this is Supabase, replace the direct database URL with the Shared Pooler Session URL from Project → Connect (port 5432), or enable IPv6/IPv4 connectivity for the direct endpoint. No schema changes were applied.')
    process.exitCode = 1
  } else if (code === 'SELF_SIGNED_CERT_IN_CHAIN' || (error instanceof Error && error.message.includes('self-signed certificate'))) {
    console.error('PostgreSQL TLS certificate could not be verified. Download the project CA certificate from Supabase Project Settings → Database → SSL Configuration, set DATABASE_SSL_CA_FILE to its file path, and retry. Certificate verification remains enabled.')
    process.exitCode = 1
  } else {
    console.error(error instanceof Error ? error.message : 'Database migration failed')
    process.exitCode = 1
  }
} finally {
  await pool.end()
}
