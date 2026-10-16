'use client'

import Link from 'next/link'
import { ArrowLeft, BarChart3, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { StatCard } from '../ui/StatCard'
import { ResponsiveTimeSeriesChart } from '../analytics/ResponsiveTimeSeriesChart'
import { DistributionBars } from '../analytics/DistributionBars'
import { formatDateTime } from '../../utils/date'
import { buildCustomFormAnalytics, type FormFieldCompletion } from '../../lib/forms/form-analytics'
import type { CustomForm, CustomFormSubmission } from '../../lib/forms/form-service'

const pieColors = ['#0284c7', '#10b981', '#06b6d4', '#f59e0b', '#6366f1', '#f472b6', '#64748b']

function DistributionPie({ items }: { items: Array<{ label: string; count: number; percentage: number }> }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  if (!total) return <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">No answers to chart yet.</div>
  const positiveItems = items.filter((item) => item.count > 0)
  const segments = positiveItems.map((item, index) => {
    const precedingCount = positiveItems.slice(0, index).reduce((sum, preceding) => sum + preceding.count, 0)
    const start = precedingCount / total * 360
    const end = start + item.count / total * 360
    return `${pieColors[index % pieColors.length]} ${start}deg ${end}deg`
  })
  return <div className="flex flex-col items-center gap-4 rounded-xl bg-slate-50/80 p-4 sm:flex-row sm:justify-center">
    <div role="img" aria-label={`Pie chart of ${total} answers`} className="relative h-32 w-32 shrink-0 rounded-full" style={{ background: `conic-gradient(${segments.join(',')})` }}><div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white shadow-inner"><strong className="text-xl tabular-nums text-slate-900">{total}</strong><span className="text-[10px] uppercase tracking-wide text-slate-500">answers</span></div></div>
    <ul className="w-full min-w-0 space-y-1.5 text-xs sm:max-w-52">{items.filter((item) => item.count > 0).slice(0, 7).map((item, index) => <li key={item.label} className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} /><span className="min-w-0 flex-1 truncate text-slate-600">{item.label}</span><span className="shrink-0 font-semibold tabular-nums text-slate-800">{Math.round(item.count / total * 100)}%</span></li>)}</ul>
  </div>
}

function HourlyHistogram({ data }: { data: Array<{ label: string; hour: number; value: number }> }) {
  if (!data.some((item) => item.value > 0)) return <p className="flex h-36 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">No submissions to chart yet.</p>
  const max = Math.max(1, ...data.map((item) => item.value))
  return <div>
    <div role="img" aria-label="Histogram of response submission time by hour in Kigali" className="grid h-36 items-end gap-1 rounded-xl bg-slate-50 px-2 pt-3" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
      {data.map((item) => <div key={item.hour} title={`${item.label}: ${item.value} response${item.value === 1 ? '' : 's'}`} className="flex h-full items-end"><div className="w-full rounded-t-sm bg-gradient-to-t from-sky-600 via-cyan-500 to-emerald-400" style={{ height: item.value ? `${Math.max(5, item.value / max * 100)}%` : '0%' }} /></div>)}
    </div>
    <div className="mt-2 flex justify-between px-1 text-[10px] text-slate-400"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00 CAT</span></div>
  </div>
}

function FieldCompletion({ fields }: { fields: FormFieldCompletion[] }) {
  if (!fields.length) return null
  return <Card className="min-w-0">
    <CardHeader><CardTitle>Question completion</CardTitle><p className="text-xs text-slate-500">How often each custom question was answered. Conditional questions count only attendees who were shown the question.</p></CardHeader>
    <CardContent className="grid gap-3 pt-3 sm:grid-cols-2">
      {fields.map((field) => <div key={field.key} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
        <div className="flex items-start justify-between gap-3"><p className="min-w-0 text-sm font-semibold leading-snug text-slate-800">{field.label}</p><span className="shrink-0 text-sm font-bold tabular-nums text-sky-800">{field.completionPercentage}%</span></div>
        <p className="mt-1 text-xs text-slate-500">{field.answeredCount} of {field.eligibleCount} eligible attendee{field.eligibleCount === 1 ? '' : 's'} answered</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-400 transition-[width] duration-500" style={{ width: field.completionPercentage ? `${Math.max(2, field.completionPercentage)}%` : '0%' }} /></div>
        {field.versions.length > 1 && <p className="mt-2 text-[10px] font-medium text-slate-400">Includes published versions {field.versions.map((version) => `v${version}`).join(', ')}</p>}
      </div>)}
    </CardContent>
  </Card>
}

export function CustomFormAnalytics({ form, submissions }: { form: CustomForm; submissions: CustomFormSubmission[] }) {
  const fields = form.publishedConfig?.fields ?? form.draftConfig.fields
  const analytics = buildCustomFormAnalytics(submissions.map((submission) => ({ ...submission, emailStatus: 'PENDING' as const })), fields)
  return <div className="space-y-5 sm:space-y-6">
    <Link href={`/forms/${encodeURIComponent(form.id)}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline sm:text-sm"><ArrowLeft className="h-4 w-4" />Form overview</Link>
    <header className="flex items-start gap-3 border-b border-slate-200 pb-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700"><BarChart3 className="h-5 w-5" /></span>
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Custom Forms · analytics</p><h1 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{form.title}</h1><p className="mt-1 text-xs text-slate-500">Response patterns and question completion · Kigali time (CAT)</p></div>
    </header>
    <section aria-label="Form analytics" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"><StatCard title="Attendees" value={analytics.attendeeCount} icon={<Users className="h-5 w-5" />} className="col-span-2 min-h-0 sm:col-span-1" /></div>
      <FieldCompletion fields={analytics.fieldCompletion} />
      <div className="grid min-w-0 gap-4 xl:grid-cols-5">
        <Card className="min-w-0 xl:col-span-3"><CardHeader><CardTitle>Registration timeline</CardTitle><p className="text-xs text-slate-500">Daily submissions · recent 14-day window</p></CardHeader><CardContent className="min-w-0 pt-3"><ResponsiveTimeSeriesChart label="Attendees" data={analytics.timeline} /></CardContent></Card>
        <Card className="min-w-0 xl:col-span-2"><CardHeader><CardTitle>Latest response</CardTitle></CardHeader><CardContent className="pt-3">{analytics.latestSubmissionAt ? <p className="text-sm font-medium text-slate-800">{formatDateTime(analytics.latestSubmissionAt)}</p> : <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">No attendees have submitted yet.</p>}</CardContent></Card>
      </div>
      <Card className="min-w-0"><CardHeader><CardTitle>Response time histogram</CardTitle><p className="text-xs text-slate-500">Submissions by hour of day · CAT</p></CardHeader><CardContent className="pt-3"><HourlyHistogram data={analytics.hourlyHistogram} /></CardContent></Card>
      {analytics.distributions.length > 0 && <div className="grid min-w-0 gap-4 xl:grid-cols-2">{analytics.distributions.map((distribution) => <Card key={distribution.key} className="min-w-0"><CardHeader><CardTitle>{distribution.label}</CardTitle><p className="text-xs text-slate-500">{distribution.answeredCount} of {distribution.eligibleCount} eligible attendee{distribution.eligibleCount === 1 ? '' : 's'} answered · answer share and percentage</p></CardHeader><CardContent className="grid gap-4 pt-3 lg:grid-cols-2"><DistributionPie items={distribution.items} /><DistributionBars items={distribution.items} emptyLabel="No answers to this question yet" /></CardContent></Card>)}</div>}
    </section>
  </div>
}
