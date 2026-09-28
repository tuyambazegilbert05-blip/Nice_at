/**
 * User, authentication, and RBAC types for NiCE Club Attendance Platform.
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER'

export type Permission =
  | 'session:create'
  | 'session:edit'
  | 'session:delete'
  | 'session:view'
  | 'attendance:view'
  | 'attendance:record'
  | 'attendance:export'
  | 'qr:generate'
  | 'users:manage'
  | 'settings:manage'
  | 'communications:send'
  | 'activity:view'
  | 'session:override'

export interface User {
  id: string
  name: string
  email: string
  passwordHash?: string | null
  role: UserRole
  isActive: boolean
  avatarUrl?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string | null
  hasCompletedOnboarding: boolean
  onboardingOutcome?: 'not_started' | 'skipped' | 'completed'
}

export interface AuthSession {
  user: AuthUser
  expires: string
}
