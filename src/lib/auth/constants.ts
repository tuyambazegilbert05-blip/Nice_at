import { User } from '../../types/user'

export const SESSION_COOKIE_NAME = 'nice_session'

// Canonical staff registry for NiCE Club Rwanda
export const SEED_USERS: User[] = [
  {
    id: 'usr_admin_001',
    name: 'Gilbert Niyitegeka',
    email: 'admin@niceclub.rw',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'usr_manager_001',
    name: 'Marie Claire Umutoni',
    email: 'manager@niceclub.rw',
    role: 'MANAGER',
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'usr_staff_001',
    name: 'Jean Paul Mugisha',
    email: 'staff@niceclub.rw',
    role: 'STAFF',
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-02-15T08:00:00.000Z',
  },
  {
    id: 'usr_viewer_001',
    name: 'Diane Ingabire',
    email: 'viewer@niceclub.rw',
    role: 'VIEWER',
    isActive: true,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
]
