import React from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/Card'
import { Badge } from '../../../../../components/ui/Badge'
import { StatCard } from '../../../../../components/ui/StatCard'
import { DistributionBars } from '../../../../../components/analytics/DistributionBars'
import { DonutChart, PercentageRing } from '../../../../../components/analytics/Charts'
import { ResponsiveTimeSeriesChart } from '../../../../../components/analytics/ResponsiveTimeSeriesChart'
import { getSessionAnalytics } from '../../../../../lib/analytics/analytics-service'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { formatDate, formatDateTime } from '../../../../../utils/date'

export default async function SessionAnalyticsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/dashboard')

  const { sessionId } = await params
  const analytics = await getSessionAnalytics(sessionId)
  if (!analytics) notFound()
  const returningRate = analytics.uniqueAttendees ? (analytics.returningAttendees / analytics.uniqueAttendees) * 100 : 0

  return (
    <div className="space-y-6">
      <Link href={`/sessions/${encodeURIComponent(sessionId)}`} className="inline-flex items-center gap-2 text-sm font-medium text-nice-blue-700 hover:underline"><ArrowLeft className="h-4 w-4" />Back to session</Link>
      <Card className="overflow-hidden border-nice-blue-100 bg-gradient-to-br from-white via-white to-sky-50/80">
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2"><Badge>{analytics.sessionStatus.replaceAll('_', ' ')}</Badge><span className="text-xs text-slate-500">Analytics</span></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{analytics.sessionTitle}</h1>
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-nice-blue-600" />{formatDate(analytics.sessionDate)}</p>
            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-nice-blue-600" />{analytics.startTime}–{analytics.endTime} CAT · {analytics.durationMinutes} minutes</p>
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" />{analytics.location}</p>
            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-600" />Check-in: {formatDateTime(analytics.attendanceOpens)} – {formatDateTime(analytics.attendanceCloses)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4">
        <StatCard title="Check-ins" value={analytics.totalAttendance} icon={<Users className="h-5 w-5 text-nice-blue-600" />} />
        <StatCard title="People" value={analytics.uniqueAttendees} icon={<Users className="h-5 w-5 text-emerald-600" />} />
        <Card className="flex min-w-0 items-center border-slate-200/80 px-3 py-3 sm:px-5"><CardContent className="w-full min-w-0 p-0"><div className="flex min-w-0 items-center justify-between gap-1"><div className="min-w-0"><p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">Returning</p><p className="mt-1 truncate text-base font-bold text-slate-900 sm:text-lg">{analytics.returningAttendees.toLocaleString()}</p></div><PercentageRing value={returningRate} label="Return rate" /></div></CardContent></Card>
        <StatCard title="Reflections" value={analytics.feedbackCount + analytics.keyTakeawayCount} icon={<Clock className="h-5 w-5 text-nice-blue-600" />} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card className="min-w-0 xl:col-span-3"><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Check-in timeline</CardTitle><p className="mt-1 text-xs text-slate-500">By local time · CAT</p></div><div className="rounded-lg bg-nice-blue-50 p-2 text-nice-blue-700"><Clock className="h-5 w-5" /></div></CardHeader>
          <CardContent className="min-w-0 pt-3"><ResponsiveTimeSeriesChart label="Check-ins" data={analytics.attendanceTimeline.map((point) => ({ label: point.timestamp, value: point.count }))} /></CardContent>
        </Card>
        <Card className="min-w-0 xl:col-span-2"><CardHeader><CardTitle>Participant mix</CardTitle></CardHeader><CardContent className="min-w-0 pt-3"><DonutChart items={analytics.participantTypeDistribution} emptyLabel="No attendee data" /></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card><CardHeader><CardTitle>Faculties</CardTitle></CardHeader><CardContent className="pt-3"><DistributionBars items={analytics.facultyDistribution} emptyLabel="No faculty data" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Programs</CardTitle></CardHeader><CardContent className="pt-3"><DistributionBars items={analytics.programDistribution} emptyLabel="No program data" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Study year</CardTitle></CardHeader><CardContent className="pt-3"><DistributionBars items={analytics.yearDistribution} emptyLabel="No study-year data" /></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <Card><CardHeader><CardTitle>Participant reflections</CardTitle></CardHeader><CardContent>
          {analytics.recentReflections.length ? <ul className="space-y-4">{analytics.recentReflections.map((item, index) => <li key={`${item.submittedAt}-${index}`} className="border-b border-slate-100 pb-3 last:border-0">{item.keyTakeaway && <p className="text-sm text-slate-800">“{item.keyTakeaway}”</p>}{item.feedback && <p className="mt-1 text-sm text-slate-600">{item.feedback}</p>}<time className="mt-2 block text-xs text-slate-400">{formatDateTime(item.submittedAt)}</time></li>)}</ul> : <p className="py-8 text-center text-sm text-slate-500">No reflections yet.</p>}
        </CardContent></Card>
      </div>
    </div>
  )
}
