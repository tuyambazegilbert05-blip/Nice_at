'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, ChevronRight, Download, Eye, Search, Share2, Users } from 'lucide-react'
import type { AttendanceResponseValue } from '../../lib/forms/attendance-form'
import type { CustomForm, CustomFormSubmission } from '../../lib/forms/form-service'
import { formatDateTime } from '../../utils/date'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table'
import { CustomFormBrand } from './CustomFormBrand'

type EmailStatus = 'ACCEPTED' | 'FAILED' | 'PENDING'
type ResponseRecord = CustomFormSubmission & { emailStatus: EmailStatus }

function responseValue(value: AttendanceResponseValue | undefined): string {
  if (value === undefined) return 'No response provided'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function hasResponseValue(value: AttendanceResponseValue | undefined) {
  if (value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  return typeof value !== 'string' || value.trim().length > 0
}

function emailStatusLabel(status: EmailStatus) {
  if (status === 'ACCEPTED') return 'Email accepted'
  if (status === 'FAILED') return 'Email failed'
  return 'Email pending'
}

function emailStatusClass(status: EmailStatus) {
  if (status === 'ACCEPTED') return 'bg-emerald-50 text-emerald-800'
  if (status === 'FAILED') return 'bg-rose-50 text-rose-800'
  return 'bg-amber-50 text-amber-800'
}

function phoneNumber(submission: ResponseRecord) {
  const value = submission.responses.phone
  return hasResponseValue(value) ? responseValue(value) : null
}

function responseHighlights(submission: ResponseRecord) {
  return submission.formSnapshot.fields
    .filter((field) => field.visible && !['full_name', 'email', 'phone'].includes(field.id) && field.type !== 'CONSENT' && hasResponseValue(submission.responses[field.id]))
    .sort((left, right) => left.order - right.order)
    .slice(0, 3)
}

function ResponseHighlights({ submission, compact = false }: { submission: ResponseRecord; compact?: boolean }) {
  const fields = responseHighlights(submission)
  if (!fields.length) return <span className="italic text-slate-400">No additional answers</span>

  return <span className={`block ${compact ? 'space-y-1.5' : 'space-y-2'}`}>
    {fields.map((field) => <span key={field.id} className="block min-w-0">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</span>
      <span className={`mt-0.5 block break-words text-slate-700 ${compact ? 'line-clamp-1 text-xs' : 'line-clamp-2 text-xs leading-relaxed'}`}>{responseValue(submission.responses[field.id])}</span>
    </span>)}
  </span>
}

function FullResponse({ submission, canRetryEmail, retrying, onRetryEmail }: { submission: ResponseRecord; canRetryEmail: boolean; retrying: boolean; onRetryEmail: () => void }) {
  const fields = submission.formSnapshot.fields.filter((field) => field.visible).sort((left, right) => left.order - right.order)
  return <div className="max-h-[calc(100dvh-9rem)] space-y-4 overflow-y-auto overscroll-contain p-1 pr-2 sm:max-h-[calc(100dvh-11rem)] sm:space-y-5">
    <section className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50/60 p-4 sm:p-6">
      <div className="mb-4"><CustomFormBrand logoClassName="h-10 w-10" showTagline={false} /></div>
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-sky-700">Saved form response · version {submission.formVersion}</p>
      <h3 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{submission.fullName}</h3>
      <p className="mt-1 break-all text-sm text-slate-600">{submission.email}</p>
      <p className="mt-1 text-xs text-slate-500">Submitted {formatDateTime(submission.submittedAt)}</p>
      {canRetryEmail && submission.emailStatus === 'FAILED' && <Button size="sm" variant="outline" disabled={retrying} isLoading={retrying} className="mt-3" onClick={onRetryEmail}>Retry confirmation email</Button>}
    </section>
    <section aria-label="Complete submitted answers" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {fields.map((field) => <div key={field.id} className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">{field.label}</p><p className={`mt-1.5 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed ${submission.responses[field.id] === undefined ? 'italic text-slate-400' : 'text-slate-800'}`}>{responseValue(submission.responses[field.id])}</p></div>)}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Confirmation email</p><p className="mt-1.5 text-sm font-medium text-slate-800">{submission.emailStatus === 'ACCEPTED' ? 'Accepted by the email provider' : submission.emailStatus === 'FAILED' ? 'Failed to send' : 'Pending or not sent'}</p></div>
    </section>
  </div>
}

export function CustomFormResponses({ form, submissions: initialSubmissions, canRetryEmail, canExport }: {
  form: CustomForm
  submissions: ResponseRecord[]
  canRetryEmail: boolean
  canExport: boolean
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [search, setSearch] = useState('')
  const [emailFilter, setEmailFilter] = useState<'ALL' | EmailStatus>('ALL')
  const [selected, setSelected] = useState<ResponseRecord | null>(null)
  const [retryingId, setRetryingId] = useState('')
  const [error, setError] = useState('')
  const closeModal = useCallback(() => setSelected(null), [])
  const visible = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    return submissions.filter((submission) => {
      const answers = Object.values(submission.responses).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ')
      const matchesSearch = !needle || `${submission.fullName} ${submission.email} ${answers}`.toLocaleLowerCase().includes(needle)
      return matchesSearch && (emailFilter === 'ALL' || submission.emailStatus === emailFilter)
    })
  }, [emailFilter, search, submissions])

  async function retryEmail(submissionId: string) {
    setRetryingId(submissionId)
    setError('')
    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(form.id)}/submissions/${encodeURIComponent(submissionId)}/retry-email`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not retry the confirmation email.')
      setSubmissions((current) => current.map((item) => item.id === submissionId ? { ...item, emailStatus: result.emailStatus } : item))
      setSelected((current) => current?.id === submissionId ? { ...current, emailStatus: result.emailStatus } : current)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not retry the confirmation email.')
    } finally { setRetryingId('') }
  }

  return <div className="space-y-6">
    <Link href={`/forms/${encodeURIComponent(form.id)}`} className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:underline"><ArrowLeft className="h-4 w-4" />Back to form overview</Link>
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start gap-3"><CustomFormBrand logoClassName="h-12 w-12" showTagline={false} /><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-sky-700">Custom Forms · responses</p><h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">{form.title}</h1><p className="mt-1 text-sm text-slate-500">{submissions.length} saved response{submissions.length === 1 ? '' : 's'} · each keeps its original published field definitions.</p></div></div>
      <div className="flex flex-wrap gap-2"><Link href={`/forms/${encodeURIComponent(form.id)}/analytics`}><Button size="sm" variant="outline" leftIcon={<BarChart3 className="h-4 w-4" />}>Analytics</Button></Link><Link href={`/forms/${encodeURIComponent(form.id)}/share`}><Button size="sm" variant="outline" leftIcon={<Share2 className="h-4 w-4" />}>Sharing</Button></Link>{canExport && <a href={`/api/forms/${encodeURIComponent(form.id)}/export`}><Button size="sm" variant="outline" leftIcon={<Download className="h-4 w-4" />}>Export</Button></a>}</div>
    </header>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><label htmlFor="response-search" className="sr-only">Search name, email, or answer</label><input id="response-search" type="search" placeholder="Search name, email, or answer" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></div>
      <label className="sr-only" htmlFor="email-filter">Filter by confirmation email status</label><select id="email-filter" value={emailFilter} onChange={(event) => setEmailFilter(event.target.value as typeof emailFilter)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"><option value="ALL">All email statuses</option><option value="ACCEPTED">Provider accepted</option><option value="FAILED">Email failed</option><option value="PENDING">Email pending</option></select>
    </div>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {visible.length === 0 ? <Card><CardContent className="py-10 text-center"><Users className="mx-auto h-7 w-7 text-sky-700" /><p className="mt-3 text-sm text-slate-600">{submissions.length ? 'No responses match those filters.' : 'Responses will appear here after attendees submit the published form.'}</p></CardContent></Card> : <Card className="overflow-hidden">
      <CardContent className="p-0">
        <p className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-5">Select a response to view the full submitted form.</p>
        <div className="grid grid-cols-1 gap-3 p-3 xl:hidden sm:p-4">
          {visible.map((submission) => <button
            key={submission.id}
            type="button"
            aria-haspopup="dialog"
            aria-label={`View full form response from ${submission.fullName}`}
            onClick={() => setSelected(submission)}
            className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 sm:p-5"
          >
            <span className="flex min-w-0 items-start justify-between gap-3">
              <span className="min-w-0"><span className="block break-words text-sm font-bold text-slate-900 sm:text-base">{submission.fullName}</span><span className="mt-1 block break-all text-xs text-slate-600">{submission.email}</span></span>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
            </span>
            <span className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
              <span className="min-w-0 text-xs text-slate-700"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phone</span><span className="mt-0.5 block break-words">{phoneNumber(submission) || 'Not provided'}</span></span>
              <span className="min-w-0 text-xs text-slate-700"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Confirmation</span><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${emailStatusClass(submission.emailStatus)}`}>{emailStatusLabel(submission.emailStatus)}</span></span>
            </span>
            <span className="mt-3 block min-w-0 border-t border-slate-100 pt-3 text-xs text-slate-600"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Response highlights</span><ResponseHighlights submission={submission} /></span>
            <span className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500"><span>Submitted {formatDateTime(submission.submittedAt)} · form v{submission.formVersion}</span><span className="font-semibold text-sky-700">View full response</span></span>
          </button>)}
        </div>
        <div className="hidden xl:block">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[16%]">Name</TableHead>
                <TableHead className="w-[20%]">Email / phone</TableHead>
                <TableHead className="w-[32%]">Response highlights</TableHead>
                <TableHead className="w-[13%]">Confirmation</TableHead>
                <TableHead className="w-[16%]">Submitted</TableHead>
                <TableHead className="w-[3%]"><span className="sr-only">Response details</span><Eye className="h-3.5 w-3.5" aria-hidden="true" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((submission) => <TableRow
                key={submission.id}
                role="button"
                tabIndex={0}
                aria-haspopup="dialog"
                aria-label={`View full form response from ${submission.fullName}`}
                onClick={() => setSelected(submission)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelected(submission)
                  }
                }}
                className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600"
              >
                <TableCell className="whitespace-normal break-words font-semibold text-slate-900">{submission.fullName}</TableCell>
                <TableCell className="whitespace-normal"><span className="block break-all">{submission.email}</span><span className="break-words text-xs text-slate-500">{phoneNumber(submission) || 'No phone provided'}</span></TableCell>
                <TableCell className="whitespace-normal"><ResponseHighlights submission={submission} compact /></TableCell>
                <TableCell className="whitespace-normal"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${emailStatusClass(submission.emailStatus)}`}>{emailStatusLabel(submission.emailStatus)}</span></TableCell>
                <TableCell className="whitespace-normal break-words text-xs leading-relaxed text-slate-600">{formatDateTime(submission.submittedAt)}<span className="mt-1 block text-[10px] text-slate-400">Form v{submission.formVersion}</span></TableCell>
                <TableCell className="text-sky-700"><ChevronRight className="h-4 w-4" aria-hidden="true" /></TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>}
    <Modal isOpen={Boolean(selected)} onClose={closeModal} title={selected?.fullName || 'Form response'} description="Complete submitted answers from the saved form version" className="max-w-3xl overflow-hidden p-4 sm:p-6">{selected && <FullResponse key={selected.id} submission={selected} canRetryEmail={canRetryEmail} retrying={retryingId === selected.id} onRetryEmail={() => void retryEmail(selected.id)} />}</Modal>
  </div>
}
