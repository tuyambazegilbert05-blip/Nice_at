/**
 * Session and form configuration types for NiCE Club Rwanda.
 */

export type SessionType =
  | 'LECTURE'
  | 'WORKSHOP'
  | 'SEMINAR'
  | 'SCHOOL_OUTREACH'
  | 'UNIVERSITY_SESSION'
  | 'CONFERENCE'
  | 'WEBINAR'
  | 'TRAINING'
  | 'YOUTH_EVENT'
  | 'OTHER'

export type SessionStatus = 'DRAFT' | 'UPCOMING' | 'OPEN' | 'CLOSING_SOON' | 'CLOSED'

export type DuplicatePolicy =
  | 'ALLOW_DUPLICATES'
  | 'PREVENT_BY_EMAIL'
  | 'PREVENT_BY_EMAIL_AND_PHONE'

export type QuestionType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'EMAIL'
  | 'PHONE'
  | 'NUMBER'
  | 'SELECT'
  | 'RADIO'
  | 'CHECKBOX'

export interface Question {
  id: string
  sessionId: string
  label: string
  description?: string | null
  type: QuestionType
  required: boolean
  options?: string[] | null // For SELECT, RADIO, CHECKBOX
  order: number
  createdAt?: Date | string
}

export interface Session {
  id: string
  title: string
  description: string
  type: SessionType
  location: string
  date: Date | string
  startTime: string // "HH:mm" in Kigali time
  endTime: string   // "HH:mm" in Kigali time
  attendanceOpens: Date | string
  attendanceCloses: Date | string
  status: SessionStatus
  publicToken: string
  duplicatePolicy: DuplicatePolicy
  createdById?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  questions?: Question[]
  _count?: {
    attendance: number
  }
}

export interface CreateSessionInput {
  title: string
  description: string
  type: SessionType
  location: string
  date: string // ISO date string
  startTime: string
  endTime: string
  attendanceOpens: string // ISO datetime
  attendanceCloses: string // ISO datetime
  duplicatePolicy?: DuplicatePolicy
  questions?: Omit<Question, 'id' | 'sessionId'>[]
}

export interface UpdateSessionInput extends Partial<CreateSessionInput> {
  status?: SessionStatus
}
