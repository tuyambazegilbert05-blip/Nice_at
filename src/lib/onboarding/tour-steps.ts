import type { Permission } from '../../types/user'

export type OnboardingTourStep = {
  id: string
  route: string
  target: string
  title: string
  description: string
  descriptionWithoutPermission?: string
  requiredPermission?: Permission
}

/** One short overview target for each of the nine platform sidebar sections. */
export const ONBOARDING_TOUR_STEPS: readonly OnboardingTourStep[] = [
  {
    id: 'dashboard',
    route: '/dashboard',
    target: '[data-tour="dashboard-overview"]',
    title: 'Your workspace',
    description: 'See session totals, verified check-ins, and this month’s attendance.',
  },
  {
    id: 'sessions',
    route: '/sessions',
    target: '[data-tour="platform-sessions"]',
    title: 'Sessions',
    description: 'Create sessions, set check-in windows, and open attendee QR codes.',
    descriptionWithoutPermission: 'View scheduled sessions and open QR check-in details.',
    requiredPermission: 'session:view',
  },
  {
    id: 'attendance',
    route: '/attendance',
    target: '[data-tour="platform-attendance"]',
    title: 'Attendance',
    description: 'Search check-ins, review submitted responses, and export allowed records.',
    requiredPermission: 'attendance:view',
  },
  {
    id: 'participants',
    route: '/participants',
    target: '[data-tour="platform-participants"]',
    title: 'Participants',
    description: 'Find attendees and review the sessions they have attended.',
    requiredPermission: 'attendance:view',
  },
  {
    id: 'analytics',
    route: '/analytics',
    target: '[data-tour="platform-analytics"]',
    title: 'Analytics',
    description: 'Compare attendance trends by date and session.',
    requiredPermission: 'attendance:view',
  },
  {
    id: 'communications',
    route: '/communications',
    target: '[data-tour="platform-communications"]',
    title: 'Communications',
    description: 'Send updates to staff and attendees who opted in.',
    requiredPermission: 'communications:send',
  },
  {
    id: 'platform-tools',
    route: '/resources',
    target: '[data-tour="platform-tools"]',
    title: 'Platform tools',
    description: 'Use these shortcuts to open sessions, attendance, and reports.',
  },
  {
    id: 'settings',
    route: '/settings',
    target: '[data-tour="platform-settings"]',
    title: 'Settings',
    description: 'Manage staff roles, permissions, and organization settings.',
    requiredPermission: 'settings:manage',
  },
  {
    id: 'account',
    route: '/account',
    target: '[data-tour="platform-account"]',
    title: 'Your account',
    description: 'Update your name, profile photo, email, and password.',
  },
] as const
