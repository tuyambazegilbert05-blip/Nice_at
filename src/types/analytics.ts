/** Analytics and aggregation types for NiCE Club Rwanda. */

export interface OverviewMetrics {
  totalSessions: number
  totalAttendees: number
  uniqueAttendees: number
  returningAttendees: number
  thisMonthAttendees: number
  averageAttendance: number
  activeSessionsCount: number
}

export interface DistributionItem {
  label: string
  count: number
  percentage: number
}

export interface AnalyticsSessionOption {
  id: string
  title: string
  date: string
  status: string
}

export interface AnalyticsSessionSummary extends AnalyticsSessionOption {
  attendance: number
}

export interface AnalyticsFilters {
  dateFrom?: string
  dateTo?: string
  sessionId?: string
  program?: string
  yearOfStudy?: string
  sessionStatus?: string
}

export interface SessionAnalytics {
  sessionId: string
  sessionTitle: string
  sessionDate: string
  sessionStatus: string
  location: string
  startTime: string
  endTime: string
  attendanceOpens: string
  attendanceCloses: string
  durationMinutes: number
  totalAttendance: number
  uniqueAttendees: number
  returningAttendees: number
  attendancePercentage: null
  rejectedSubmissions: null
  feedbackCount: number
  keyTakeawayCount: number
  facultyDistribution: DistributionItem[]
  programDistribution: DistributionItem[]
  yearDistribution: DistributionItem[]
  participantTypeDistribution: DistributionItem[]
  attendanceTimeline: { timestamp: string; count: number }[]
  recentReflections: { keyTakeaway: string | null; feedback: string | null; submittedAt: string }[]
}

export interface GlobalAnalytics {
  overview: OverviewMetrics
  attendanceByMonth: { month: string; attendees: number; sessions: number }[]
  attendanceByYear: { year: number; attendees: number }[]
  attendanceBySessionType: DistributionItem[]
  attendanceByParticipantType: DistributionItem[]
  academicDistribution: {
    faculties: DistributionItem[]
    programs: DistributionItem[]
    years: DistributionItem[]
  }
  filterOptions: { programs: string[]; years: string[] }
  topFaculties: DistributionItem[]
  mostAttendedSessions: AnalyticsSessionSummary[]
  recentSessions: AnalyticsSessionOption[]
  upcomingSessions: AnalyticsSessionOption[]
  sessionOptions: AnalyticsSessionOption[]
}
