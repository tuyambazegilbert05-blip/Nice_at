/**
 * Attendance record and submission types for NiCE Club Rwanda.
 */

export type ParticipantType =
  | 'Student'
  | 'Researcher'
  | 'Lecturer'
  | 'Professional'
  | 'School Student'
  | 'Guest'
  | 'Partner'
  | 'Other'

export interface Attendance {
  id: string
  sessionId: string
  fullName: string
  email: string
  phone: string
  faculty?: string | null
  program?: string | null
  yearOfStudy?: string | null
  participantType: ParticipantType
  keyTakeaway?: string | null
  feedback?: string | null
  customResponses?: Record<string, string | string[] | number | boolean> | null
  metadata?: Record<string, unknown> | null
  submittedAt: Date | string
  emailUpdatesOptIn?: boolean
}

export interface AttendanceSubmission {
  token: string
  fullName: string
  email: string
  phone: string
  faculty?: string
  program?: string
  yearOfStudy?: string
  participantType: ParticipantType
  keyTakeaway?: string
  feedback?: string
  emailUpdatesOptIn?: boolean
  customResponses?: Record<string, string | string[] | number | boolean>
  honeypot?: string // Bot prevention field
}

export interface AttendanceFilter {
  sessionId?: string
  search?: string
  participantType?: ParticipantType
  faculty?: string
  program?: string
  page?: number
  pageSize?: number
  sortBy?: 'fullName' | 'submittedAt' | 'email' | 'faculty'
  sortOrder?: 'asc' | 'desc'
}
