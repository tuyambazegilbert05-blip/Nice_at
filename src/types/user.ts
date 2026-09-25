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

export interface User {
  id: string
  name: string
  email: string
  passwordHash?: string | null
  role: UserRole
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthSession {
  user: AuthUser
  expires: string
}
