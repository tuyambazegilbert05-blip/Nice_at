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
    'session:view',
    'attendance:view',
    'attendance:record',
    'attendance:export',
    'qr:generate',
    'users:manage',
    'settings:manage',
    'communications:send',
  ],
  MANAGER: [
    'session:create',
    'session:edit',
    'session:view',
    'attendance:view',
    'attendance:record',
    'attendance:export',
    'qr:generate',
  ],
  STAFF: [
    'session:view',
    'attendance:view',
    'attendance:record',
    'qr:generate',
  ],
  VIEWER: [
    'session:view',
    'attendance:view',
  ],
}

export const ROLE_DESCRIPTIONS: Record<UserRole, { title: string; description: string }> = {
  ADMIN: {
    title: 'Administrator',
    description: 'Full organizational authority across all sessions, team permissions, data exports, and audit settings.',
  },
  MANAGER: {
    title: 'Session Manager',
    description: 'Can create and configure scientific sessions, generate custom questions, and export attendance records.',
  },
  STAFF: {
    title: 'Field Coordinator / Staff',
    description: 'Can manage live event check-ins, project QR flyers, and assist attendees on-site across Rwanda.',
  },
  VIEWER: {
    title: 'Executive Viewer',
    description: 'Read-only visibility into published sessions, real-time dashboard counts, and aggregated analytics.',
  },
}
