import React from 'react'
import { BarChart3, TrendingUp, Users, Calendar, Award } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { getAllAttendance } from '../../../lib/attendance/check-in-service'
import { getAllSessions } from '../../../lib/sessions/session-service'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/dashboard')
  const [sessions, attendance] = await Promise.all([getAllSessions(), getAllAttendance()])
  const participantCounts = attendance.reduce<Record<string, number>>((counts, record) => {
    counts[record.participantType] = (counts[record.participantType] || 0) + 1
    return counts
  }, {})
  const participantTypes = Object.entries(participantCounts).sort((a, b) => b[1] - a[1])
  const topSegment = participantTypes[0]?.[0] || '—'
  const avgAttendance = sessions.length ? Math.round(attendance.length / sessions.length) : 0
  const monthly = new Map<string, number>()
  attendance.forEach((record) => {
    const key = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'Africa/Kigali' }).format(new Date(record.submittedAt))
    monthly.set(key, (monthly.get(key) || 0) + 1)
  })
  const monthlyCounts = [...monthly.entries()].slice(-6)
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/NiCE-Logo-Animated.gif"
          alt="NiCE Club Rwanda"
          className="w-12 h-12 rounded-xl object-contain bg-white shadow-subtle p-0.5 border border-slate-200/80"
        />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Session Intelligence & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Evidence-based participation statistics, academic demographics, and engagement trajectories.
          </p>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={sessions.length.toLocaleString()}
          subtitle="All sessions"
          icon={<Calendar className="w-5 h-5 text-nice-blue-600" />}
        />
        <StatCard
          title="Verified Attendance"
          value={attendance.length.toLocaleString()}
          subtitle="Cumulative check-ins"
          icon={<Users className="w-5 h-5 text-nice-blue-600" />}
        />
        <StatCard
          title="Avg Participants"
          value={avgAttendance.toLocaleString()}
          subtitle="Per session"
          icon={<TrendingUp className="w-5 h-5 text-nice-blue-600" />}
        />
        <StatCard
          title="Top Segment"
          value={topSegment}
          subtitle={participantTypes[0] ? `${participantTypes[0][1]} check-ins` : 'No check-ins yet'}
          icon={<Award className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Demographic Distribution</CardTitle>
            <CardDescription>Attendee breakdown by participant categorization</CardDescription>
          </CardHeader>
          <CardContent>
            {participantTypes.length ? <div className="space-y-3 py-3">
              {participantTypes.map(([type, count]) => <div key={type} className="space-y-1">
                <div className="flex justify-between text-xs"><span className="font-medium text-slate-700">{type}</span><span className="text-slate-500">{count}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-nice-blue-500" style={{ width: `${Math.round((count / attendance.length) * 100)}%` }} /></div>
              </div>)}
            </div> : <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6"><BarChart3 className="w-8 h-8 text-slate-300 mb-2" /><p className="font-semibold text-slate-600">No attendance records yet</p><p className="mt-1">Participant breakdown will appear after check-ins are recorded.</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Trajectory</CardTitle>
            <CardDescription>Monthly growth and participation trend across Rwanda</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyCounts.length ? <div className="space-y-3 py-3">
              {monthlyCounts.map(([month, count]) => <div key={month} className="flex items-center gap-3 text-xs"><span className="w-20 text-slate-600">{month}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, Math.round((count / Math.max(...monthlyCounts.map((item) => item[1]))) * 100))}%` }} /></div><span className="w-8 text-right text-slate-500">{count}</span></div>)}
            </div> : <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6"><TrendingUp className="w-8 h-8 text-slate-300 mb-2" /><p className="font-semibold text-slate-600">No attendance trajectory yet</p><p className="mt-1">Monthly totals appear as check-ins are recorded.</p></div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
