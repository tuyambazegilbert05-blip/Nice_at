'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, CalendarDays, ChevronRight, MailCheck, MailWarning, Search, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { StatCard } from '../ui/StatCard'
import { Modal } from '../ui/Modal'
import { ResponsiveTimeSeriesChart } from '../analytics/ResponsiveTimeSeriesChart'
import { DistributionBars } from '../analytics/DistributionBars'
import { formatDateTime } from '../../utils/date'
import { buildCustomFormAnalytics, type FormEmailStatus } from '../../lib/forms/form-analytics'
import { getResponseWindowState } from '../../lib/forms/response-window'
import type { CustomForm, CustomFormSubmission } from '../../lib/forms/form-service'
import { ResponseWindowControls } from './ResponseWindowControls'
import { CustomFormBrand } from './CustomFormBrand'
import { CustomFormOperations } from './CustomFormOperations'

type OverviewSubmission = CustomFormSubmission & { emailStatus: FormEmailStatus }

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

function FullSubmissionDetails({ submission }: { submission: OverviewSubmission }) {
  const initials = submission.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
  const fields = submission.formSnapshot.fields.filter((field) => field.visible).sort((left, right) => left.order - right.order)

  return <div className="max-h-[calc(100dvh-9rem)] space-y-4 overflow-y-auto overscroll-contain p-1 pr-2 sm:max-h-[calc(100dvh-11rem)] sm:space-y-5">
    <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50/60 p-4 sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border-[18px] border-sky-100/60" />
      <div className="relative flex min-w-0 items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold text-sky-800 shadow-sm ring-1 ring-sky-100 sm:h-16 sm:w-16">{initials || 'A'}</div>
        <div className="min-w-0 flex-1"><div className="mb-3"><CustomFormBrand logoClassName="h-9 w-9" showTagline={false} /></div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-sky-700">Full attendance submission</p><h3 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{submission.fullName}</h3><p className="mt-1 break-all text-sm text-slate-600">{submission.email}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(submission.submittedAt)} · form version {submission.formVersion}</p></div>
      </div>
    </section>
    <section aria-label="Complete attendee responses" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {fields.map((field) => {
        const value = submission.responses[field.id]
        const display = value === undefined ? 'No response provided' : Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
        return <div key={field.id} className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">{field.label}</p><p className={`mt-1.5 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed ${value === undefined ? 'italic text-slate-400' : 'text-slate-800'}`}>{display}</p></div>
      })}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Confirmation email</p><p className="mt-1.5 text-sm font-medium text-slate-800">{submission.emailStatus === 'ACCEPTED' ? 'Accepted by the email provider' : submission.emailStatus === 'FAILED' ? 'Failed to send' : 'Pending or not sent'}</p></div>
    </section>
  </div>
}

export function CustomFormOverview({ form, submissions, canEdit, canExport, canGenerateQr, canOverride, canArchive, responseOverrideActive }: {
  form: CustomForm
  submissions: OverviewSubmission[]
  canEdit: boolean
  canExport: boolean
  canGenerateQr: boolean
  canOverride: boolean
  canArchive: boolean
  responseOverrideActive: boolean
}) {
  const [search, setSearch] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<OverviewSubmission | null>(null)
  const closeSubmission = useCallback(() => setSelectedSubmission(null), [])
  const fields = form.publishedConfig?.fields ?? form.draftConfig.fields
  const analytics = useMemo(() => buildCustomFormAnalytics(submissions, fields), [fields, submissions])
  const responseState = getResponseWindowState(form)
  const emailAcceptanceRate = analytics.attendeeCount ? Math.round(analytics.acceptedEmailCount / analytics.attendeeCount * 100) : 0
  const needle = search.trim().toLocaleLowerCase()
  const visibleSubmissions = submissions.filter((submission) => {
    if (!needle) return true
    const answerText = Object.values(submission.responses).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ')
    return `${submission.fullName} ${submission.email} ${answerText}`.toLocaleLowerCase().includes(needle)
  })

  return <div className="space-y-6">
    <Link href="/forms" className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:underline"><ArrowLeft className="h-4 w-4" />Back to Custom Forms</Link>

    <Card className="overflow-hidden border-sky-100 bg-gradient-to-br from-white via-white to-sky-50/70">
      <CardContent className="space-y-5 p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <CustomFormBrand logoClassName="h-10 w-10" showTagline={false} />
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${form.archivedAt ? 'border-slate-300 bg-slate-100 text-slate-700' : form.status === 'PUBLISHED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : form.status === 'CLOSED' ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{form.archivedAt ? 'Archived' : form.status === 'PUBLISHED' ? `Published · v${form.publishedVersion}` : form.status}</span>
              <span className="text-xs text-slate-500">Custom Forms · form landing page</span>
            </div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${responseState === 'ACCEPTING' ? 'bg-emerald-50 text-emerald-800' : responseState === 'SCHEDULED' ? 'bg-sky-50 text-sky-800' : responseState === 'ENDED' || responseState === 'CLOSED' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-800'}`}>{responseState === 'ACCEPTING' ? 'Accepting responses' : responseState === 'SCHEDULED' ? 'Scheduled' : responseState === 'ENDED' ? 'Window ended' : responseState === 'CLOSED' ? 'Closed' : 'Draft'}</span>
            <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{form.title}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <p className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-sky-700" />{new Intl.DateTimeFormat('en-RW', { dateStyle: 'long', timeZone: 'Africa/Kigali' }).format(new Date(`${form.eventDate}T12:00:00+02:00`))}</p>
              <p>{form.startTime}–{form.endTime} CAT</p><p>{form.location}</p>
            </div>
          </div>
        </div>
        <CustomFormOperations form={form} canEdit={canEdit} canGenerateQr={canGenerateQr} canOverride={canOverride} canArchive={canArchive} responseOverrideActive={responseOverrideActive} />
        {canExport && <a href={`/api/forms/${encodeURIComponent(form.id)}/export`} className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Export responses</a>}
        {!form.archivedAt && form.status === 'PUBLISHED' && <p className="rounded-lg border border-sky-100 bg-white/80 p-3 text-sm text-sky-900">You can customize the draft while this published version stays live. Publish the updates to replace the live form; existing attendee responses keep their original form version.</p>}
        {!form.archivedAt && form.status === 'DRAFT' && <p className="rounded-lg border border-amber-100 bg-white/80 p-3 text-sm text-amber-900">Customize the form and publish it before attendees can submit responses.</p>}
        {!form.archivedAt && form.status === 'CLOSED' && <p className="rounded-lg border border-slate-200 bg-white/80 p-3 text-sm text-slate-700">This form is closed. Its attendee records and analytics remain available.</p>}
        {form.archivedAt && <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">This form is archived. The public link is disabled, and its submitted responses and analytics are preserved. An administrator can restore it.</p>}
      </CardContent>
    </Card>

    <ResponseWindowControls form={form} canEdit={canEdit && !form.archivedAt} />

    <section aria-label="Form analytics" id="form-analytics" className="space-y-4">
      <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-sky-700" /><h2 className="text-lg font-bold text-slate-900">Attendance analytics</h2></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard title="Attendees" value={analytics.attendeeCount} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Email accepted" value={analytics.acceptedEmailCount} subtitle="Accepted by the mail provider" icon={<MailCheck className="h-5 w-5" />} />
        <StatCard title="Email failed" value={analytics.failedEmailCount} icon={<MailWarning className="h-5 w-5" />} />
        <StatCard title="Email pending" value={analytics.pendingEmailCount} subtitle="No accepted send recorded" icon={<MailWarning className="h-5 w-5" />} />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-5">
        <Card className="min-w-0 xl:col-span-3"><CardHeader><CardTitle>Registration timeline</CardTitle><p className="text-xs text-slate-500">Daily submissions · CAT · recent 14-day window</p></CardHeader><CardContent className="min-w-0 pt-3"><ResponsiveTimeSeriesChart label="Attendees" data={analytics.timeline} /></CardContent></Card>
        <Card className="min-w-0 xl:col-span-2"><CardHeader><CardTitle>Latest response</CardTitle></CardHeader><CardContent className="pt-3">{analytics.latestSubmissionAt ? <p className="text-sm font-medium text-slate-800">{formatDateTime(analytics.latestSubmissionAt)}</p> : <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">No attendees have submitted yet.</p>}</CardContent></Card>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-5">
        <Card className="min-w-0 xl:col-span-3"><CardHeader><CardTitle>Response time histogram</CardTitle><p className="text-xs text-slate-500">Submissions by hour of day · CAT</p></CardHeader><CardContent className="pt-3"><HourlyHistogram data={analytics.hourlyHistogram} /></CardContent></Card>
        <Card className="min-w-0 xl:col-span-2"><CardHeader><CardTitle>Email confirmation rate</CardTitle><p className="text-xs text-slate-500">Provider accepted responses</p></CardHeader><CardContent className="flex min-h-48 items-center justify-center gap-5 pt-3"><div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#10b981 ${emailAcceptanceRate * 3.6}deg, #e2e8f0 0deg)` }}><div className="grid h-20 w-20 place-items-center rounded-full bg-white text-2xl font-bold tabular-nums text-slate-900">{emailAcceptanceRate}%</div></div><div><p className="text-sm font-semibold text-slate-800">{analytics.acceptedEmailCount} of {analytics.attendeeCount} confirmations</p><p className="mt-1 max-w-44 text-xs leading-relaxed text-slate-500">Delivery rate from recorded email provider results.</p></div></CardContent></Card>
      </div>

      {analytics.distributions.length > 0 && <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        {analytics.distributions.map((distribution) => <Card key={distribution.id} className="min-w-0"><CardHeader><CardTitle>{distribution.label}</CardTitle><p className="text-xs text-slate-500">{distribution.answeredCount} attendee{distribution.answeredCount === 1 ? '' : 's'} answered · answer share and percentage</p></CardHeader><CardContent className="grid gap-5 pt-3 lg:grid-cols-2"><DistributionPie items={distribution.items} /><DistributionBars items={distribution.items} emptyLabel="No answers to this question yet" /></CardContent></Card>)}
      </div>}
    </section>

    <section id="attendees" className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Attendees</h2><p className="mt-1 text-sm text-slate-500">{visibleSubmissions.length} of {submissions.length} attendee{submissions.length === 1 ? '' : 's'} · select an attendee to open the full submission.</p></div>
        <label className="relative block"><span className="sr-only">Search attendees and responses</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or answer" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:w-80" /></label>
      </div>
      {visibleSubmissions.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-slate-500">{submissions.length ? 'No attendees match this search.' : 'Attendees will appear here after the published form receives submissions.'}</CardContent></Card> : <div className="space-y-3">
        {visibleSubmissions.map((submission) => {
          const answers = submission.formSnapshot.fields.filter((field) => field.visible && field.id !== 'full_name' && field.id !== 'email' && submission.responses[field.id] !== undefined)
          return <Card key={submission.id} role="button" tabIndex={0} aria-haspopup="dialog" aria-label={`Open the full attendance submission from ${submission.fullName}`} onClick={() => setSelectedSubmission(submission)} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedSubmission(submission) }
          }} className="cursor-pointer transition hover:border-sky-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
            <CardContent className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><h3 className="break-words font-semibold text-slate-900">{submission.fullName}</h3><p className="mt-0.5 break-all text-sm text-slate-600">{submission.email}</p><p className="mt-1 text-xs text-slate-400">{formatDateTime(submission.submittedAt)} · form v{submission.formVersion}</p></div>
              <div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${submission.emailStatus === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-800' : submission.emailStatus === 'FAILED' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>{submission.emailStatus === 'ACCEPTED' ? 'Email accepted' : submission.emailStatus === 'FAILED' ? 'Email failed' : 'Email pending'}</span><ChevronRight className="h-4 w-4 text-sky-700" aria-hidden="true" /></div>
            </div>
            {answers.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{answers.slice(0, 3).map((field) => {
              const value = submission.responses[field.id]
              const display = Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
              return <div key={field.id} className="min-w-0 rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{field.label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{display}</p></div>
            })}</div>}
            <p className="mt-3 text-xs font-semibold text-sky-700">Open full submission{answers.length > 3 ? ` · ${answers.length - 3} more answers` : ''}</p>
          </CardContent></Card>
        })}
      </div>}
    </section>

    <Modal isOpen={Boolean(selectedSubmission)} onClose={closeSubmission} title={selectedSubmission?.fullName || 'Attendee submission'} description="Complete submitted attendance details" className="max-w-3xl overflow-hidden p-4 sm:p-6">
      {selectedSubmission && <FullSubmissionDetails key={selectedSubmission.id} submission={selectedSubmission} />}
    </Modal>
  </div>
}
