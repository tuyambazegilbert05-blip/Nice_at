import crypto from 'crypto'

const ITERATIONS = 100000
const KEY_LEN = 64
const DIGEST = 'sha512'

/**
 * Hashes a plaintext password using cryptographic PBKDF2 with a secure random salt.
 * Output format: iterations:saltHex:hashHex
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST)
  return `${ITERATIONS}:${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifies a plaintext password against a stored PBKDF2 hash using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':')
    if (parts.length !== 3) return false

    const iterations = parseInt(parts[0], 10)
    const salt = parts[1]
    const originalHash = parts[2]

    const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST)
    const originalHashBuf = Buffer.from(originalHash, 'hex')

    if (derivedKey.length !== originalHashBuf.length) return false
    return crypto.timingSafeEqual(derivedKey, originalHashBuf)
  } catch {
    return false
  }
}
