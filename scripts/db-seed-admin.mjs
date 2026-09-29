import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomBytes, pbkdf2Sync, randomUUID } from 'node:crypto'
import pg from 'pg'

for (const file of ['.env.local', '.env']) {
  try {
    for (const line of (await readFile(resolve(file), 'utf8')).split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  } catch {}
}

const { DATABASE_URL, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, INITIAL_ADMIN_NAME } = process.env
if (!DATABASE_URL) throw new Error('DATABASE_URL is required')
if (!INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_PASSWORD || !INITIAL_ADMIN_NAME) {
  throw new Error('Admin seed settings are missing. Add INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD to .env.local (or export them in your shell) before running npm run db:seed-admin. Do not use the example password from .env.example.')
}
const strongPassword = typeof INITIAL_ADMIN_PASSWORD === 'string'
  && INITIAL_ADMIN_PASSWORD.length >= 6
  && INITIAL_ADMIN_PASSWORD.length <= 200
  && /[A-Z]/.test(INITIAL_ADMIN_PASSWORD)
  && /[a-z]/.test(INITIAL_ADMIN_PASSWORD)
  && /\d/.test(INITIAL_ADMIN_PASSWORD)
  && /[^A-Za-z0-9]/.test(INITIAL_ADMIN_PASSWORD)
if (!strongPassword) throw new Error('Initial admin password must contain at least 6 characters, uppercase and lowercase letters, a number, and a symbol')
const email = INITIAL_ADMIN_EMAIL.trim().toLowerCase()
const salt = randomBytes(16).toString('hex')
const hash = pbkdf2Sync(INITIAL_ADMIN_PASSWORD, salt, 100000, 64, 'sha512').toString('hex')
const host = new URL(DATABASE_URL).hostname
const useSsl = process.env.DATABASE_SSL === 'true' || (!process.env.DATABASE_SSL && !['localhost', '127.0.0.1', '::1'].includes(host))
const ca = process.env.DATABASE_SSL_CA_FILE ? await readFile(resolve(process.env.DATABASE_SSL_CA_FILE), 'utf8') : undefined
const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: useSsl ? { rejectUnauthorized: true, ...(ca ? { ca } : {}) } : undefined, connectionTimeoutMillis: 10_000 })
try {
  await pool.query(
    `INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,'ADMIN')
     ON CONFLICT(email) DO NOTHING`,
    [`usr_${randomUUID()}`, INITIAL_ADMIN_NAME.trim(), email, `100000:${salt}:${hash}`],
  )
  console.log(`Admin account ensured for ${email}`)
} catch (error) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
  if (code === 'SELF_SIGNED_CERT_IN_CHAIN' || (error instanceof Error && error.message.includes('self-signed certificate'))) {
    console.error('PostgreSQL TLS certificate could not be verified. Download the project CA certificate from Supabase Project Settings → Database → SSL Configuration, set DATABASE_SSL_CA_FILE to its file path, and retry. Certificate verification remains enabled.')
  } else {
    console.error(error instanceof Error ? error.message : 'Admin seed failed')
  }
  process.exitCode = 1
} finally {
  await pool.end()
}
