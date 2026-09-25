import { cookies } from 'next/headers'
import { AuthUser, User, UserRole } from '../../types/user'
import { createSessionToken, verifySessionToken } from './jwt'
import { hashPassword, verifyPassword } from './passwords'
import { hasMinimumRole, UnauthorizedError } from '../permissions/rbac'
import { SESSION_COOKIE_NAME, SEED_USERS } from './constants'

export { SESSION_COOKIE_NAME, SEED_USERS }

// Default seed hashed password for 'NiCE@Rwanda2026!'
const DEFAULT_PASSWORD_HASH = hashPassword('NiCE@Rwanda2026!')

const USER_CREDENTIALS: Record<string, string> = {
  'admin@niceclub.rw': DEFAULT_PASSWORD_HASH,
  'manager@niceclub.rw': DEFAULT_PASSWORD_HASH,
  'staff@niceclub.rw': DEFAULT_PASSWORD_HASH,
  'viewer@niceclub.rw': DEFAULT_PASSWORD_HASH,
}

/**
 * Authenticates user by email and password.
 */
export async function authenticate(email: string, password: string): Promise<AuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const user = SEED_USERS.find((u) => u.email.toLowerCase() === normalizedEmail)

  if (!user || !user.isActive) {
    return null
  }

  const storedHash = USER_CREDENTIALS[normalizedEmail]
  if (!storedHash) {
    return null
  }

  const isValid = verifyPassword(password, storedHash)
  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

/**
 * Retrieves the currently authenticated user from HTTP session cookies.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie || !sessionCookie.value) {
      return null
    }

    return verifySessionToken(sessionCookie.value)
  } catch {
    return null
  }
}

/**
 * Sets the HTTP-only secure session cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 604800, // 7 days
  })
}

/**
 * Clears the HTTP-only session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Enforces server-side authentication and optional minimum role hierarchy.
 * Throws UnauthorizedError if unauthenticated or under-privileged.
 */
export async function requireAuth(minimumRole?: UserRole): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new UnauthorizedError('Authentication required')
  }

  if (minimumRole && !hasMinimumRole(user.role, minimumRole)) {
    throw new UnauthorizedError(
      `Access denied: requires minimum role '${minimumRole}', current is '${user.role}'`
    )
  }

  return user
}

export function getAllUsers(): User[] {
  return [...SEED_USERS]
}
