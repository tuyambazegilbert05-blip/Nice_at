import { UserRole, Permission } from '../../types/user'

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 40,
  MANAGER: 30,
  STAFF: 20,
  VIEWER: 10,
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'session:create',
    'session:edit',
    'session:delete',
    'session:override',
    'session:view',
    'attendance:view',
    'attendance:record',
    'attendance:export',
    'qr:generate',
    'users:manage',
    'settings:manage',
    'communications:send',
    'activity:view',
  ],
  MANAGER: [
    'session:create',
    'session:edit',
    'session:view',
    'attendance:view',
    'attendance:record',
    'attendance:export',
    'qr:generate',
    'communications:send',
  ],
  STAFF: [
    'session:create',
    'session:edit',
    'session:view',
    'attendance:view',
    'attendance:record',
    'qr:generate',
    'communications:send',
  ],
  VIEWER: [
    'session:view',
    'attendance:view',
  ],
}

export const ROLE_DESCRIPTIONS: Record<UserRole, { title: string; description: string }> = {
  ADMIN: {
    title: 'Administrator',
    description: 'Full organizational authority, including session content editing, temporary attendance extensions, deletion with attendee records, staff invitations, role management, and communications.',
  },
  MANAGER: {
    title: 'Session Manager',
    description: 'Can manage scientific sessions, export attendance, and use the full communications section. Staff invitations are administrator-only.',
  },
  STAFF: {
    title: 'Field Coordinator / Staff',
    description: 'Can create and manage sessions, coordinate live check-ins, and use communications. Session deletion and staff invitations are administrator-only.',
  },
  VIEWER: {
    title: 'Executive Viewer',
    description: 'Read-only visibility into published sessions, dashboard counts, and aggregated analytics. Communications are unavailable.',
  },
}
