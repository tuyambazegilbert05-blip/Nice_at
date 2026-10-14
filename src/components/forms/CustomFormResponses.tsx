'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, ChevronRight, Download, Search, Share2, Users } from 'lucide-react'
import type { AttendanceResponseValue } from '../../lib/forms/attendance-form'
import type { CustomForm, CustomFormSubmission } from '../../lib/forms/form-service'
import { formatDateTime } from '../../utils/date'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { CustomFormBrand } from './CustomFormBrand'

type EmailStatus = 'ACCEPTED' | 'FAILED' | 'PENDING'
type ResponseRecord = CustomFormSubmission & { emailStatus: EmailStatus }

function responseValue(value: AttendanceResponseValue | undefined): string {
  if (value === undefined) return 'No response provided'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
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
      <div className="flex flex-wrap gap-2"><Link href={`/forms/${encodeURIComponent(form.id)}#form-analytics`}><Button size="sm" variant="outline" leftIcon={<BarChart3 className="h-4 w-4" />}>Analytics</Button></Link><Link href={`/forms/${encodeURIComponent(form.id)}/share`}><Button size="sm" variant="outline" leftIcon={<Share2 className="h-4 w-4" />}>Sharing</Button></Link>{canExport && <a href={`/api/forms/${encodeURIComponent(form.id)}/export`}><Button size="sm" variant="outline" leftIcon={<Download className="h-4 w-4" />}>Export</Button></a>}</div>
    </header>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><label htmlFor="response-search" className="sr-only">Search name, email, or answer</label><input id="response-search" type="search" placeholder="Search name, email, or answer" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></div>
      <label className="sr-only" htmlFor="email-filter">Filter by confirmation email status</label><select id="email-filter" value={emailFilter} onChange={(event) => setEmailFilter(event.target.value as typeof emailFilter)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"><option value="ALL">All email statuses</option><option value="ACCEPTED">Provider accepted</option><option value="FAILED">Email failed</option><option value="PENDING">Email pending</option></select>
    </div>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {visible.length === 0 ? <Card><CardContent className="py-10 text-center"><Users className="mx-auto h-7 w-7 text-sky-700" /><p className="mt-3 text-sm text-slate-600">{submissions.length ? 'No responses match those filters.' : 'Responses will appear here after attendees submit the published form.'}</p></CardContent></Card> : <div className="space-y-3">
      {visible.map((submission) => <Card key={submission.id} role="button" tabIndex={0} aria-haspopup="dialog" aria-label={`Open response from ${submission.fullName}`} onClick={() => setSelected(submission)} onKeyDown={(event) => { if ((event.target as HTMLElement).closest('button,a,input,select,textarea')) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(submission) } }} className="cursor-pointer transition hover:border-sky-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-semibold text-slate-900">{submission.fullName}</h2><p className="mt-0.5 break-all text-sm text-slate-600">{submission.email}</p><p className="mt-1 text-xs text-slate-400">{formatDateTime(submission.submittedAt)} · form v{submission.formVersion}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${submission.emailStatus === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-800' : submission.emailStatus === 'FAILED' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>{submission.emailStatus === 'ACCEPTED' ? 'Email accepted' : submission.emailStatus === 'FAILED' ? 'Email failed' : 'Email pending'}</span><ChevronRight className="h-4 w-4 text-sky-700" aria-hidden="true" /></div></div>
        <p className="mt-3 text-xs font-semibold text-sky-700">Open full submission</p>
      </CardContent></Card>)}
    </div>}
    <Modal isOpen={Boolean(selected)} onClose={closeModal} title={selected?.fullName || 'Form response'} description="Complete submitted answers from the saved form version" className="max-w-3xl overflow-hidden p-4 sm:p-6">{selected && <FullResponse key={selected.id} submission={selected} canRetryEmail={canRetryEmail} retrying={retryingId === selected.id} onRetryEmail={() => void retryEmail(selected.id)} />}</Modal>
  </div>
}
