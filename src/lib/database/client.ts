import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

declare global {
  // Keep a single connection pool across Next.js development hot reloads.
  var nicePostgresPool: Pool | undefined
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required. Set it in .env.local before using database features.')
  }

  let isRemoteDatabase = false
  try {
    const hostname = new URL(connectionString).hostname
    isRemoteDatabase = !['localhost', '127.0.0.1', '::1'].includes(hostname)
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL')
  }

  const ssl = process.env.DATABASE_SSL === 'true' || (!process.env.DATABASE_SSL && isRemoteDatabase)
  const inlineCa = process.env.DATABASE_SSL_CA?.replaceAll('\\n', '\n')
  const sslCaFile = process.env.DATABASE_SSL_CA_FILE
  const ca = inlineCa || (sslCaFile ? readFileSync(resolve(sslCaFile), 'utf8') : undefined)
  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: ssl ? { rejectUnauthorized: true, ...(ca ? { ca } : {}) } : undefined,
  })
}

function getPool(): Pool {
  if (globalThis.nicePostgresPool) return globalThis.nicePostgresPool
  const pool = createPool()
  globalThis.nicePostgresPool = pool
  return pool
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values)
}

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function checkDatabaseConnection(): Promise<void> {
  await query('SELECT 1')
}

export async function closeDatabasePool(): Promise<void> {
  if (globalThis.nicePostgresPool) {
    await globalThis.nicePostgresPool.end()
    globalThis.nicePostgresPool = undefined
  }
}
