import React from 'react'
import Link from 'next/link'
import { CalendarDays, Users, TrendingUp, CheckCircle, Plus, QrCode } from 'lucide-react'
import { StatCard } from '../../../components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { getDashboardOverview } from '../../../lib/dashboard/dashboard-service'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { redirect } from 'next/navigation'
import { RestrictedActionButton } from '../../../components/ui/RestrictedAction'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/login')
  const canCreateSessions = hasPermission(user.role, 'session:create')
  const overview = await getDashboardOverview()
  return (
    <div className="space-y-8">
      {overview.hasDataError && (
        <div role="alert" className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p>Some dashboard data couldn’t be loaded. Available sections remain visible; try again to refresh the data.</p>
          <a href="/dashboard" className="shrink-0 font-semibold underline underline-offset-2">Retry loading</a>
        </div>
      )}

      {/* Welcome Banner */}
      <div data-motion-item className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Operational Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            NiCE Club Rwanda - Clean energy session attendance and engagement intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {canCreateSessions ? <Link href="/sessions/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Create Session
            </Button>
          </Link> : <RestrictedActionButton message={`Access denied: your ${user.role} role cannot create sessions. Ask an administrator or manager for access.`} variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>Create Session</RestrictedActionButton>}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sessions"
          value={overview.totalSessions?.toLocaleString() ?? '—'}
          subtitle="All recorded events"
          icon={<CalendarDays className="w-5 h-5 text-nice-blue-600" />}
        />
        <StatCard
          title="Total Attendees"
          value={overview.totalAttendees?.toLocaleString() ?? '—'}
          subtitle="Verified check-ins"
          icon={<Users className="w-5 h-5 text-nice-blue-600" />}
        />
        <StatCard
          title="This Month"
          value={overview.thisMonthAttendees?.toLocaleString() ?? '—'}
          subtitle="Current calendar month"
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Average Attendance"
          value={overview.averageAttendance?.toLocaleString() ?? '—'}
          subtitle="Per published session"
          icon={<TrendingUp className="w-5 h-5 text-nice-blue-600" />}
        />
      </div>

      {/* Main Grid: Active Sessions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions Activity Section */}
        <div data-motion-item className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Live status of your latest outreach and technical sessions</CardDescription>
              </div>
              <Link href="/sessions" className="text-xs font-semibold text-nice-blue-600 hover:text-nice-blue-700">
                View all →
              </Link>
            </CardHeader>
            <CardContent>
              {overview.recentSessions === null ? <div role="status" className="py-10 text-center text-sm text-slate-600">Recent sessions could not be loaded.</div> : overview.recentSessions.length === 0 ? <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-nice-blue-50 border border-nice-blue-100 flex items-center justify-center text-nice-blue-600 mb-3">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No sessions published yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Create your first NiCE session to schedule events, generate branded QR codes, and collect attendance.
                </p>
                {canCreateSessions ? <Link href="/sessions/new" className="mt-4">
                  <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    Create Your First Session
                  </Button>
                </Link> : <RestrictedActionButton message={`Access denied: your ${user.role} role cannot create sessions. Ask an administrator or manager for access.`} className="mt-4" variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Create Your First Session</RestrictedActionButton>}
              </div> : <div className="divide-y divide-slate-100">
                {overview.recentSessions.map((session) => <Link key={session.id} href={`/sessions/${session.id}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{session.title}</p><p className="mt-1 text-xs text-slate-500">{String(session.date)} · {session.location}</p></div>
                  <Badge variant={session.status === 'OPEN' ? 'success' : 'neutral'} size="sm">{session.status.replace('_', ' ')}</Badge>
                </Link>)}
              </div>}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live QR Quick Action & System Readiness */}
        <div data-motion-item className="space-y-6">
          <Card className="bg-gradient-to-br from-nice-blue-50/60 to-white border-nice-blue-100">
            <CardHeader>
              <div className="flex items-center gap-2 text-nice-blue-700 font-semibold text-xs uppercase tracking-wider">
                <QrCode className="w-4 h-4" />
                <span>Instant QR Check-In</span>
              </div>
              <CardTitle className="text-base">Ready for In-Person Events</CardTitle>
              <CardDescription>
                Project high-contrast branded posters or display dynamic QR codes for instant phone check-in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-white p-4 border border-nice-blue-100/80 shadow-subtle space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Verification Engine</span>
                  <Badge variant="success" size="sm" dot>Active</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Timezone</span>
                  <span className="font-semibold text-slate-700">Africa/Kigali (UTC+2)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Public Check-In</span>
                  <span className="font-semibold text-slate-700">Zero App Required</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Guidelines</CardTitle>
              <CardDescription>Best practices for session coordinators</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-slate-600 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-nice-blue-600 font-bold">•</span>
                  <span>Open attendance windows 15 minutes before workshops begin.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-nice-blue-600 font-bold">•</span>
                  <span>Download printable A4 posters for projection or physical venue placement.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-nice-blue-600 font-bold">•</span>
                  <span>Export verified attendee lists directly to CSV or XLSX post-event.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
