import crypto from 'crypto'
import { AuthUser } from '../../types/user'

const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'nice-club-rwanda-attendance-secure-token-secret-2026'

interface TokenPayload {
  user: AuthUser
  exp: number
  iat: number
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf8')
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token for an authenticated user.
 * Default expiration is 7 days (604,800 seconds).
 */
export function createSessionToken(user: AuthUser, expiresInSeconds = 604800): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const payload: TokenPayload = {
    user,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const dataToSign = `${encodedHeader}.${encodedPayload}`

  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${dataToSign}.${signature}`
}

/**
 * Validates a session token, checks signature and expiration, and extracts the authenticated user.
 */
export function verifySessionToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, signature] = parts
    const dataToSign = `${encodedHeader}.${encodedPayload}`

    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    // Constant-time comparison
    const sigBuf = Buffer.from(signature)
    const expectedSigBuf = Buffer.from(expectedSignature)
    if (sigBuf.length !== expectedSigBuf.length) return null
    if (!crypto.timingSafeEqual(sigBuf, expectedSigBuf)) return null

    const payloadText = base64UrlDecode(encodedPayload)
    const payload: TokenPayload = JSON.parse(payloadText)

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null // Expired
    }

    return payload.user
  } catch {
    return null
  }
}
