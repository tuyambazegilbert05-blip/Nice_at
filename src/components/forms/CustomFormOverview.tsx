'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, ChevronRight, Download, Eye, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table'
import { formatDateTime } from '../../utils/date'
import { type FormEmailStatus } from '../../lib/forms/form-analytics'
import { getResponseWindowState } from '../../lib/forms/response-window'
import type { CustomForm, CustomFormSubmission } from '../../lib/forms/form-service'
import { ResponseWindowControls } from './ResponseWindowControls'
import { CustomFormBrand } from './CustomFormBrand'
import { CustomFormOperations } from './CustomFormOperations'

type OverviewSubmission = CustomFormSubmission & { emailStatus: FormEmailStatus }

function hasResponse(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.some((item) => hasResponse(item))
  return true
}

function responseText(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => responseText(item)).filter(Boolean).join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value ?? '')
}

function getAnsweredCustomFields(submission: OverviewSubmission) {
  return submission.formSnapshot.fields
    .filter((field) => field.visible && field.id !== 'full_name' && field.id !== 'email' && field.type !== 'PHONE' && field.type !== 'CONSENT' && hasResponse(submission.responses[field.id]))
    .sort((left, right) => left.order - right.order)
}

function getContactPhone(submission: OverviewSubmission) {
  const phoneField = submission.formSnapshot.fields.find((field) => field.visible && (field.type === 'PHONE' || /phone|mobile|telephone/i.test(`${field.id} ${field.label}`)))
  const value = phoneField ? submission.responses[phoneField.id] : undefined
  return hasResponse(value) ? responseText(value) : null
}

function getRosterHighlights(submission: OverviewSubmission) {
  const fields = getAnsweredCustomFields(submission)
  const conciseFields = fields.filter((field) => field.type !== 'LONG_TEXT')
  const detailedFields = fields.filter((field) => field.type === 'LONG_TEXT')
  return [...conciseFields, ...detailedFields].slice(0, 3)
}

function FullSubmissionDetails({ submission }: { submission: OverviewSubmission }) {
  const initials = submission.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
  const fields = submission.formSnapshot.fields.filter((field) => field.visible).sort((left, right) => left.order - right.order)

  return <div className="max-h-[calc(100dvh-9rem)] space-y-4 overflow-y-auto overscroll-contain p-1 pr-2 sm:max-h-[calc(100dvh-11rem)] sm:space-y-5">
    <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50/60 p-4 sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border-[18px] border-sky-100/60" />
        <div className="relative flex min-w-0 items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold text-sky-800 shadow-sm ring-1 ring-sky-100 sm:h-16 sm:w-16">{initials || 'A'}</div>
        <div className="min-w-0 flex-1"><div className="mb-3"><CustomFormBrand logoClassName="h-9 w-9" showTagline={false} /></div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-sky-700">Full form submission</p><h3 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{submission.fullName}</h3><p className="mt-1 break-all text-sm text-slate-600">{submission.email}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(submission.submittedAt)} · form version {submission.formVersion}</p></div>
      </div>
    </section>
    <section aria-label="Complete attendee responses" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {fields.map((field) => {
        const value = submission.responses[field.id]
        const display = value === undefined ? 'No response provided' : Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
        return <div key={field.id} className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">{field.label}</p><p className={`mt-1.5 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed ${value === undefined ? 'italic text-slate-400' : 'text-slate-800'}`}>{display}</p></div>
      })}
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
  const responseState = getResponseWindowState(form)
  const needle = search.trim().toLocaleLowerCase()
  const visibleSubmissions = submissions.filter((submission) => {
    if (!needle) return true
    const answerText = Object.values(submission.responses).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ')
    return `${submission.fullName} ${submission.email} ${answerText}`.toLocaleLowerCase().includes(needle)
  })

  return <div className="space-y-4 sm:space-y-6">
    <Link href="/forms" className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline sm:text-sm"><ArrowLeft className="h-4 w-4" />Custom Forms</Link>

    <Card className="overflow-hidden border-sky-100 bg-gradient-to-br from-white via-white to-sky-50/70">
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.9fr)] lg:items-center lg:gap-8">
          <div className="min-w-0 space-y-3">
            <div className="flex min-w-0 items-center gap-3">
              <CustomFormBrand logoClassName="h-9 w-9 sm:h-10 sm:w-10" showTagline={false} />
              <span className={`ml-auto shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${form.archivedAt ? 'border-slate-300 bg-slate-100 text-slate-700' : form.status === 'PUBLISHED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : form.status === 'CLOSED' ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{form.archivedAt ? 'Archived' : form.status === 'PUBLISHED' ? 'Published' : form.status}</span>
            </div>
            <div className="space-y-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${responseState === 'ACCEPTING' ? 'bg-emerald-50 text-emerald-800' : responseState === 'SCHEDULED' ? 'bg-sky-50 text-sky-800' : responseState === 'ENDED' || responseState === 'CLOSED' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-800'}`}>{responseState === 'ACCEPTING' ? 'Accepting responses' : responseState === 'SCHEDULED' ? 'Scheduled' : responseState === 'ENDED' ? 'Window ended' : responseState === 'CLOSED' ? 'Closed' : 'Draft'}</span>
              <h1 className="break-words text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">{form.title}</h1>
              <div className="grid gap-1.5 text-xs text-slate-600 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-2 sm:text-sm">
                <p className="inline-flex min-w-0 items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-sky-700" /><span>{new Intl.DateTimeFormat('en-RW', { dateStyle: 'medium', timeZone: 'Africa/Kigali' }).format(new Date(`${form.eventDate}T12:00:00+02:00`))} · {form.startTime}–{form.endTime} CAT</span></p>
                <p className="break-words sm:pl-6">{form.location}</p>
              </div>
            </div>
          </div>
          <div className="min-w-0 border-t border-slate-100 pt-3 lg:border-l lg:border-t-0 lg:py-1 lg:pl-6">
            <CustomFormOperations form={form} canEdit={canEdit} canGenerateQr={canGenerateQr} canOverride={canOverride} canArchive={canArchive} responseOverrideActive={responseOverrideActive} />
          </div>
        </div>
      </CardContent>
    </Card>

    <ResponseWindowControls form={form} canEdit={canEdit && !form.archivedAt} />

    <section id="attendees" aria-label="Form responses" className="scroll-mt-6">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Form responses</CardTitle>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Submitted attendee details captured through this form.</p>
          </div>
          {canExport && <a href={`/api/forms/${encodeURIComponent(form.id)}/export`} className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"><Download className="h-4 w-4" />Export CSV</a>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-xs text-slate-500">{visibleSubmissions.length} of {submissions.length} response{submissions.length === 1 ? '' : 's'} · select a response to view the full submission.</p>
            <label className="relative block shrink-0"><span className="sr-only">Search attendees and responses</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or answer" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:w-80" /></label>
          </div>

          {visibleSubmissions.length === 0 ? <div className="flex min-h-44 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">{submissions.length ? 'No responses match this search.' : 'Responses will appear here after the published form receives submissions.'}</div> : <>
            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {visibleSubmissions.map((submission) => {
                const highlights = getRosterHighlights(submission)
                const phone = getContactPhone(submission)
                return <button
                  key={submission.id}
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`View full form submission from ${submission.fullName}`}
                  onClick={() => setSelectedSubmission(submission)}
                  className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 sm:p-5"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="break-words text-sm font-bold text-slate-900 sm:text-base">{submission.fullName}</h3></div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
                    <div className="min-w-0 text-xs text-slate-700"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Email</span><span className="mt-0.5 block break-all">{submission.email}</span></div>
                    <div className="min-w-0 text-xs text-slate-700"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phone</span><span className="mt-0.5 block break-words">{phone || 'Not provided'}</span></div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
                    {highlights.length ? highlights.map((field) => <div key={field.id} className="min-w-0 text-xs text-slate-600"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</span><span className="mt-0.5 block line-clamp-2 break-words">{responseText(submission.responses[field.id])}</span></div>) : <p className="text-xs italic text-slate-400 sm:col-span-2">No additional answers were provided.</p>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500"><span>Submitted {formatDateTime(submission.submittedAt)} · form v{submission.formVersion}</span><span className="font-semibold text-sky-700">View full submission</span></div>
                </button>
              })}
            </div>

            <div className="hidden xl:block">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[18%]">Name</TableHead>
                    <TableHead className="w-[22%]">Email / contact</TableHead>
                    <TableHead className="w-[42%]">Response summary</TableHead>
                    <TableHead className="w-[14%]">Submitted</TableHead>
                    <TableHead className="w-[4%]"><span className="sr-only">View full submission</span><Eye className="h-3.5 w-3.5" aria-hidden="true" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSubmissions.map((submission) => {
                    const highlights = getRosterHighlights(submission)
                    const phone = getContactPhone(submission)
                    return <TableRow
                      key={submission.id}
                      role="button"
                      tabIndex={0}
                      aria-haspopup="dialog"
                      aria-label={`View full form submission from ${submission.fullName}`}
                      onClick={() => setSelectedSubmission(submission)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedSubmission(submission)
                        }
                      }}
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600"
                    >
                      <TableCell className="whitespace-normal break-words align-top"><p className="font-semibold text-slate-900">{submission.fullName}</p></TableCell>
                      <TableCell className="whitespace-normal align-top"><span className="block break-all">{submission.email}</span><span className="mt-1 block break-words text-xs text-slate-500">{phone || 'No phone provided'}</span></TableCell>
                      <TableCell className="whitespace-normal align-top"><div className="space-y-2">{highlights.length ? highlights.map((field) => <div key={field.id} className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</p><p title={responseText(submission.responses[field.id])} className="mt-0.5 line-clamp-2 break-words text-sm text-slate-700">{responseText(submission.responses[field.id])}</p></div>) : <span className="italic text-slate-400">No additional answers</span>}</div></TableCell>
                      <TableCell className="whitespace-normal break-words align-top text-slate-600"><span className="block">{formatDateTime(submission.submittedAt)}</span><span className="mt-1 block text-xs text-slate-400">Form v{submission.formVersion}</span></TableCell>
                      <TableCell className="align-top text-sky-700"><span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" aria-hidden="true" /><ChevronRight className="h-4 w-4" aria-hidden="true" /></span></TableCell>
                    </TableRow>
                  })}
                </TableBody>
              </Table>
            </div>
          </>}
        </CardContent>
      </Card>
    </section>

    <Modal isOpen={Boolean(selectedSubmission)} onClose={closeSubmission} title={selectedSubmission?.fullName || 'Form submission'} description="Complete submitted form details" className="max-w-3xl overflow-hidden p-4 sm:p-6">
      {selectedSubmission && <FullSubmissionDetails key={selectedSubmission.id} submission={selectedSubmission} />}
    </Modal>
  </div>
}
