import { cookies } from 'next/headers'
import { AuthUser, User, UserRole } from '../../types/user'
import { createSessionToken, verifySessionToken } from './jwt'
import { verifyPassword } from './passwords'
import { hasMinimumRole, UnauthorizedError } from '../permissions/rbac'
import { SESSION_COOKIE_NAME } from './constants'
import { query } from '../database/client'

export { SESSION_COOKIE_NAME }

/**
 * Authenticates user by email and password.
 */
export async function authenticate(email: string, password: string): Promise<AuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const result = await query<{ id: string; name: string; email: string; role: UserRole; password_hash: string; is_active: boolean }>(
    'SELECT id, name, email, role, password_hash, is_active FROM users WHERE email=$1',
    [normalizedEmail],
  )
  const user = result.rows[0]
  if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

/** Re-checks the active user's password immediately before a sensitive action. */
export async function verifyCurrentPassword(userId: string, password: string): Promise<boolean> {
  const result = await query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id=$1 AND is_active=true',
    [userId],
  )
  const storedHash = result.rows[0]?.password_hash
  return Boolean(storedHash && verifyPassword(password, storedHash))
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

    const tokenUser = verifySessionToken(sessionCookie.value)
    if (!tokenUser) return null
    const result = await query<{ id: string; name: string; email: string; role: UserRole; avatarUrl: string | null }>(
      'SELECT id, name, email, role, avatar_url AS "avatarUrl" FROM users WHERE id=$1 AND is_active=true', [tokenUser.id],
    )
    return result.rows[0] || null
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

export async function getAllUsers(): Promise<User[]> {
  const result = await query<User>(
    'SELECT id,name,email,role,is_active AS "isActive",avatar_url AS "avatarUrl",created_at AS "createdAt",updated_at AS "updatedAt" FROM users ORDER BY name',
  )
  return result.rows
}
