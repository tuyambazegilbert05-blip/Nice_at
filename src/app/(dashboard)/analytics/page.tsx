import Link from 'next/link'
import { Activity, BarChart3, CalendarDays, FileText, Users, UserRoundCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { DistributionBars } from '../../../components/analytics/DistributionBars'
import { DonutChart, PercentageRing } from '../../../components/analytics/Charts'
import { ResponsiveTimeSeriesChart } from '../../../components/analytics/ResponsiveTimeSeriesChart'
import { AnalyticsAutoRefresh } from '../../../components/analytics/AnalyticsAutoRefresh'
import { AnalyticsFilters } from '../../../components/analytics/AnalyticsFilters'
import { formatDate } from '../../../utils/date'
import { ScrollReveal } from '../../../motion/gsap/ScrollReveal'
import { EmptyStateAnimation } from '../../../lottie/empty'
import { getCustomFormsAnalytics, getGlobalAnalytics, parseAnalyticsFilters } from '../../../lib/analytics/analytics-service'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { redirect } from 'next/navigation'
import type { AnalyticsSessionOption, AnalyticsSessionSummary } from '../../../types/analytics'
import { TourTarget } from '../../../components/onboarding/TourTarget'

function monthLabel(month: string) {
  const date = new Date(`${month}-01T12:00:00Z`)
  return new Intl.DateTimeFormat('en-RW', { month: 'short', timeZone: 'UTC' }).format(date)
}

function SessionList({ title, sessions, emptyLabel }: { title: string; sessions: AnalyticsSessionOption[]; emptyLabel: string }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      {sessions.length ? <ul className="space-y-2">{sessions.map((session) => (
        <li key={session.id} data-analytics-flip className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
          <span className="min-w-0 truncate font-medium text-slate-700">{session.title}</span>
          <span className="shrink-0 text-xs text-slate-500">{formatDate(session.date)}</span>
        </li>
      ))}</ul> : <p className="text-sm text-slate-500">{emptyLabel}</p>}
    </section>
  )
}

function MostAttendedList({ sessions }: { sessions: AnalyticsSessionSummary[] }) {
  if (!sessions.length) return <p className="py-8 text-center text-sm text-slate-500">No sessions in this selection.</p>
  return <ol className="space-y-2">{sessions.map((session, index) => (
    <li key={session.id} data-analytics-flip className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nice-blue-50 text-xs font-bold text-nice-blue-700">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <Link href={`/sessions/${encodeURIComponent(session.id)}/analytics`} className="block truncate text-sm font-medium text-slate-800 hover:text-nice-blue-700">{session.title}</Link>
        <p className="text-xs text-slate-500">{formatDate(session.date)}</p>
      </div>
      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700">{session.attendance}</span>
    </li>
  ))}</ol>
}

export default async function AnalyticsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/dashboard')

  const filters = parseAnalyticsFilters(await searchParams)
  const [analytics, customFormsAnalytics] = await Promise.all([
    getGlobalAnalytics(filters),
    getCustomFormsAnalytics(filters),
  ])
  const totalYearAttendees = analytics.attendanceByYear.reduce((total, year) => total + year.attendees, 0)
  const returningRate = analytics.overview.uniqueAttendees
    ? (analytics.overview.returningAttendees / analytics.overview.uniqueAttendees) * 100
    : 0

  return (
    <TourTarget name="platform-analytics" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nice-blue-700">NiCE Club Rwanda</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Analytics</h1>
        </div>
        <AnalyticsAutoRefresh />
      </header>

      <Card className="overflow-hidden border-nice-blue-100 bg-gradient-to-br from-white via-white to-sky-50/80">
        <CardHeader className="pb-4"><div className="flex items-center justify-between gap-3"><CardTitle className="text-base">Filters</CardTitle><span className="text-xs text-slate-400">Attendance data · CAT</span></div></CardHeader>
        <CardContent className="pt-4"><AnalyticsFilters filters={filters} sessions={analytics.sessionOptions} programs={analytics.filterOptions.programs} years={analytics.filterOptions.years} /></CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard title="Sessions" value={analytics.overview.totalSessions} icon={<CalendarDays className="h-5 w-5 text-nice-blue-600" />} className="border-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]" />
        <StatCard title="Check-ins" value={analytics.overview.totalAttendees} icon={<Activity className="h-5 w-5 text-nice-blue-600" />} className="border-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]" />
        <StatCard title="People" value={analytics.overview.uniqueAttendees} icon={<Users className="h-5 w-5 text-emerald-600" />} className="border-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]" />
        <StatCard title="Avg / session" value={analytics.overview.averageAttendance} icon={<BarChart3 className="h-5 w-5 text-cyan-600" />} className="border-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]" />
        <Card className="flex min-w-0 items-center border-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:px-5"><CardContent className="w-full min-w-0 p-0"><div className="flex min-w-0 items-center justify-between gap-1"><div className="min-w-0"><p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">Returning</p><p className="mt-1 truncate text-base font-bold text-slate-900 sm:text-lg">{analytics.overview.returningAttendees.toLocaleString()}</p></div><PercentageRing value={returningRate} label="Return rate" /></div></CardContent></Card>
      </div>

      <ScrollReveal>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <Card className="min-w-0 overflow-hidden xl:col-span-3">
            <CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Attendance over time</CardTitle><p className="mt-1 text-xs text-slate-500">Last 12 months</p></div><div className="rounded-lg bg-nice-blue-50 p-2 text-nice-blue-700"><Activity className="h-5 w-5" /></div></CardHeader>
            <CardContent className="min-w-0 pt-3"><ResponsiveTimeSeriesChart data={analytics.attendanceByMonth.map((month) => ({ label: monthLabel(month.month), value: month.attendees }))} /></CardContent>
          </Card>
          <Card className="min-w-0 xl:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Participant mix</CardTitle><p className="mt-1 text-xs text-slate-500">By attendee type</p></div><div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Users className="h-5 w-5" /></div></CardHeader>
            <CardContent className="pt-3"><DonutChart items={analytics.attendanceByParticipantType} emptyLabel="No attendee data" /></CardContent>
          </Card>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card><CardHeader><CardTitle>Session types</CardTitle></CardHeader><CardContent className="pt-3"><DistributionBars items={analytics.attendanceBySessionType.map((item) => ({ ...item, label: item.label.replaceAll('_', ' ') }))} emptyLabel="No session data" /></CardContent></Card>
          <Card><CardHeader><CardTitle>Faculties</CardTitle></CardHeader><CardContent className="pt-3"><DistributionBars items={analytics.academicDistribution.faculties} emptyLabel="No faculty data" /></CardContent></Card>
          <Card><CardHeader><CardTitle>Programs</CardTitle></CardHeader><CardContent className="pt-3"><DistributionBars items={analytics.academicDistribution.programs} emptyLabel="No program data" /></CardContent></Card>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card><CardHeader><CardTitle>Study year</CardTitle></CardHeader><CardContent className="pt-3"><DistributionBars items={analytics.academicDistribution.years} emptyLabel="No study-year data" /></CardContent></Card>
          <Card><CardHeader><CardTitle>Attendance by year</CardTitle></CardHeader><CardContent className="pt-3"><DistributionBars items={analytics.attendanceByYear.map((item) => ({ label: String(item.year), count: item.attendees, percentage: Math.round((item.attendees / (totalYearAttendees || 1)) * 100) }))} emptyLabel="No yearly data" /></CardContent></Card>
          <Card><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle>Currently open</CardTitle><div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><UserRoundCheck className="h-5 w-5" /></div></CardHeader><CardContent className="pt-3"><p className="text-4xl font-bold tracking-tight text-slate-900">{analytics.overview.activeSessionsCount}</p><p className="mt-1 text-xs text-slate-500">Accepting attendance now</p></CardContent></Card>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card><CardHeader><CardTitle>Most attended sessions</CardTitle></CardHeader><CardContent className="pt-3"><MostAttendedList sessions={analytics.mostAttendedSessions} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Session activity</CardTitle></CardHeader><CardContent className="grid grid-cols-1 gap-5 pt-3 sm:grid-cols-2"><SessionList title="Recent" sessions={analytics.recentSessions} emptyLabel="No past sessions." /><SessionList title="Upcoming" sessions={analytics.upcomingSessions} emptyLabel="No upcoming sessions." /></CardContent></Card>
        </div>
        {!analytics.overview.totalAttendees && <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white p-4"><EmptyStateAnimation label="No attendance records" className="h-12 w-12 shrink-0" /><p className="text-sm text-slate-600">No check-ins match these filters. Widen the date range or clear filters.</p></div>}
      </ScrollReveal>

      <ScrollReveal>
        <section className="space-y-5" aria-labelledby="custom-forms-analytics-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nice-blue-700">Independent forms</p>
              <h2 id="custom-forms-analytics-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-900">Custom Form responses</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">Form responses appear here separately from session check-ins. The date range above applies to this section.</p>
            </div>
            <Link href="/forms" className="inline-flex items-center gap-2 rounded-lg border border-nice-blue-200 bg-white px-3 py-2 text-sm font-semibold text-nice-blue-700 transition-colors hover:bg-nice-blue-50">
              <FileText className="h-4 w-4" /> Open Custom Forms
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard title="Form responses" value={customFormsAnalytics.totalResponses} subtitle="Submitted published forms" icon={<FileText className="h-5 w-5 text-nice-blue-600" />} className="border-nice-blue-100 shadow-[0_8px_24px_rgba(15,23,42,0.05)]" />
            <StatCard title="Respondents" value={customFormsAnalytics.uniqueRespondents} subtitle="Unique email addresses" icon={<Users className="h-5 w-5 text-emerald-600" />} className="border-emerald-100 shadow-[0_8px_24px_rgba(15,23,42,0.05)]" />
            <StatCard title="Published forms" value={customFormsAnalytics.publishedForms} subtitle="Active form definitions" icon={<BarChart3 className="h-5 w-5 text-cyan-600" />} className="border-cyan-100 shadow-[0_8px_24px_rgba(15,23,42,0.05)]" />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <Card className="min-w-0 overflow-hidden xl:col-span-3">
              <CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Responses over time</CardTitle><p className="mt-1 text-xs text-slate-500">Last 12 months</p></div><div className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><Activity className="h-5 w-5" /></div></CardHeader>
              <CardContent className="min-w-0 pt-3"><ResponsiveTimeSeriesChart data={customFormsAnalytics.responsesByMonth.map((month) => ({ label: monthLabel(month.month), value: month.responses }))} label="Form responses" /></CardContent>
            </Card>
            <Card className="min-w-0 xl:col-span-2">
              <CardHeader><CardTitle>Responses by form</CardTitle><p className="mt-1 text-xs text-slate-500">Includes archived forms so their records stay visible</p></CardHeader>
              <CardContent className="pt-3"><DistributionBars items={customFormsAnalytics.forms.filter((form) => form.responses > 0).map((form) => ({ label: form.archived ? `${form.title} (archived)` : form.title, count: form.responses, percentage: form.percentage }))} emptyLabel="No Custom Form responses in this period" /></CardContent>
            </Card>
          </div>
        </section>
      </ScrollReveal>
      <p className="text-right text-[11px] text-slate-400">Live database aggregates · attendee contact details stay private</p>
    </TourTarget>
  )
}
