/**
 * Analytics and aggregation types for NiCE Club Rwanda.
 */

export interface OverviewMetrics {
  totalSessions: number
  totalAttendees: number
  thisMonthAttendees: number
  averageAttendance: number
  activeSessionsCount: number
}

export interface DistributionItem {
  label: string
  count: number
  percentage: number
}

export interface TimelineDataPoint {
  timestamp: string
  count: number
  cumulative: number
}

export interface SessionAnalytics {
  sessionId: string
  sessionTitle: string
  totalAttendance: number
  attendanceTimeline: TimelineDataPoint[]
  facultyDistribution: DistributionItem[]
  programDistribution: DistributionItem[]
  yearDistribution: DistributionItem[]
  participantTypeDistribution: DistributionItem[]
  recentFeedback: {
    fullName: string
    keyTakeaway?: string | null
    feedback?: string | null
    submittedAt: string
  }[]
}

export interface GlobalAnalytics {
  overview: OverviewMetrics
  attendanceByMonth: { month: string; attendees: number; sessions: number }[]
  attendanceBySessionType: DistributionItem[]
  attendanceByParticipantType: DistributionItem[]
  topFaculties: DistributionItem[]
}
