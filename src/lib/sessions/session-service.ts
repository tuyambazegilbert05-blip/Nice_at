import { Session, CreateSessionInput, SessionStatus } from '../../types/session'
import { generatePublicToken } from '../../utils/crypto'

// Temporary operational store for sessions until PostgreSQL migration in Phase 03
let memorySessions: Session[] = [
  {
    id: 'sess_kgl_001',
    title: 'Rwanda Youth Nuclear Summit 2026',
    description: 'Youth-led conference exploring clean nuclear energy for Rwanda and East Africa sustainable development.',
    type: 'YOUTH_EVENT',
    location: 'Kigali Convention Centre, Kigali, Rwanda',
    date: new Date().toISOString(),
    startTime: '09:00',
    endTime: '13:00',
    attendanceOpens: new Date(Date.now() - 3600000).toISOString(),
    attendanceCloses: new Date(Date.now() + 7200000).toISOString(),
    status: 'OPEN',
    publicToken: 'nice-summit-2026-demo-token',
    duplicatePolicy: 'PREVENT_BY_EMAIL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      attendance: 0,
    },
  },
]

export function getAllSessions(): Session[] {
  return [...memorySessions]
}

export function getSessionById(id: string): Session | undefined {
  return memorySessions.find((s) => s.id === id)
}

export function getSessionByPublicToken(token: string): Session | undefined {
  return memorySessions.find((s) => s.publicToken === token)
}

export function createSession(input: CreateSessionInput, createdById?: string): Session {
  const newSession: Session = {
    id: `sess_${Date.now().toString(36)}`,
    title: input.title,
    description: input.description,
    type: input.type,
    location: input.location,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    attendanceOpens: input.attendanceOpens,
    attendanceCloses: input.attendanceCloses,
    status: 'UPCOMING',
    publicToken: generatePublicToken(),
    duplicatePolicy: input.duplicatePolicy || 'PREVENT_BY_EMAIL',
    createdById,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      attendance: 0,
    },
  }

  memorySessions.unshift(newSession)
  return newSession
}

export function updateSessionStatus(id: string, status: SessionStatus): Session | null {
  const session = memorySessions.find((s) => s.id === id)
  if (!session) return null
  session.status = status
  session.updatedAt = new Date().toISOString()
  return session
}
