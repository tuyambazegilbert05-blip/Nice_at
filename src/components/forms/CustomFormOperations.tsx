'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Archive, BarChart3, Check, Copy, ExternalLink, LoaderCircle, Pencil, QrCode, RotateCcw, Share2, Trash2, Users, X } from 'lucide-react'
import type { CustomForm } from '../../lib/forms/form-service'
import { getResponseWindowState } from '../../lib/forms/response-window'
import { formatDateTime } from '../../utils/date'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export function CustomFormOperations({ form, canEdit, canGenerateQr, canOverride, canArchive, responseOverrideActive }: {
  form: CustomForm
  canEdit: boolean
  canGenerateQr: boolean
  canOverride: boolean
  canArchive: boolean
  responseOverrideActive: boolean
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [overrideMinutes, setOverrideMinutes] = useState(10)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [archiveError, setArchiveError] = useState('')
  const [archiving, setArchiving] = useState(false)

  const archived = Boolean(form.archivedAt)
  const published = Boolean(form.publishedConfig)
  const overrideActive = responseOverrideActive
  const responseState = getResponseWindowState(form)
  const formPath = `/form/${encodeURIComponent(form.publicToken)}`

  useEffect(() => {
    if (!responseOverrideActive || !form.responseOverrideUntil) return
    const remaining = new Date(form.responseOverrideUntil).getTime() - Date.now()
    const timer = window.setTimeout(() => router.refresh(), Math.max(0, remaining))
    return () => window.clearTimeout(timer)
  }, [form.responseOverrideUntil, responseOverrideActive, router])

  async function copyPublicLink() {
    if (!published) return
    setError('')
    setCopying(true)
    try {
      await navigator.clipboard.writeText(new URL(formPath, window.location.origin).toString())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy the public link. Open Sharing to copy it manually.')
    } finally { setCopying(false) }
  }

  async function updateResponseState(opening: boolean) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(form.id)}/${opening ? 'open' : 'close'}`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || `Could not ${opening ? 'open' : 'close'} responses.`)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Could not ${opening ? 'open' : 'close'} responses.`)
    } finally { setBusy(false) }
  }

  function toggleResponses() {
    const opening = responseState !== 'ACCEPTING'
    if (!opening) {
      setCloseConfirmOpen(true)
      return
    }
    return updateResponseState(true)
  }

  async function toggleOverride() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(form.id)}/response-override`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideActive ? { open: false } : { open: true, minutes: overrideMinutes }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not change the extra response window.')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not change the extra response window.')
    } finally { setBusy(false) }
  }

  async function archiveForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!password) return setArchiveError('Enter your password to confirm form archival.')
    setArchiving(true)
    setArchiveError('')
    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(form.id)}/archive`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not archive this form.')
      router.replace('/forms')
    } catch (cause) {
      setArchiveError(cause instanceof Error ? cause.message : 'Could not archive this form.')
      setArchiving(false)
    }
  }

  async function restoreForm() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(form.id)}/restore`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not restore this form.')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not restore this form.')
    } finally { setBusy(false) }
  }

  const actionLinkClass = 'inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-white/80 bg-white/70 px-2.5 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/70 backdrop-blur-md transition hover:border-sky-200 hover:bg-white hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:cursor-wait disabled:opacity-60 sm:px-3 sm:text-xs'

  return <>
    <div className="space-y-3">
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {!archived && published && canGenerateQr && <Link className={`${actionLinkClass} col-span-2 !border-sky-600 !bg-sky-600 !text-white shadow-sky-900/10 hover:!border-sky-700 hover:!bg-sky-700 hover:!text-white sm:col-span-1`} href={`/forms/${encodeURIComponent(form.id)}/share#shareable-qr`}><QrCode className="h-4 w-4 shrink-0" aria-hidden="true" />Display QR</Link>}
          <Link className={`${actionLinkClass} sm:order-2`} href={`/forms/${encodeURIComponent(form.id)}/responses`}><Users className="h-4 w-4" aria-hidden="true" />Responses</Link>
          {!archived && canEdit && <Link className={`${actionLinkClass} sm:order-3`} href={`/forms/${encodeURIComponent(form.id)}/edit#customize-form`}><Pencil className="h-4 w-4" aria-hidden="true" />Customize</Link>}
          <Link className={`${actionLinkClass} sm:order-4`} href={`/forms/${encodeURIComponent(form.id)}/analytics`}><BarChart3 className="h-4 w-4" aria-hidden="true" />Analytics</Link>
          {!archived && <Link className={`${actionLinkClass} sm:order-5`} href={`/forms/${encodeURIComponent(form.id)}/share`}><Share2 className="h-4 w-4" aria-hidden="true" />Sharing</Link>}
          {!archived && published && <button type="button" aria-live="polite" aria-busy={copying} className={actionLinkClass} disabled={copied || copying} onClick={() => void copyPublicLink()}><span className="flex items-center gap-2">{copying ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : copied ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : <Copy className="h-4 w-4 shrink-0" />}{copying ? 'Copying…' : copied ? 'Copied' : 'Copy link'}</span></button>}
          {!archived && published && <Link className={`${actionLinkClass} sm:order-7`} href={`/form/${encodeURIComponent(form.publicToken)}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" aria-hidden="true" />Open form</Link>}
          {!archived && canEdit && published && <button type="button" className={actionLinkClass} disabled={busy} onClick={toggleResponses}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : responseState === 'ACCEPTING' ? <X className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}{responseState === 'ACCEPTING' ? 'Close responses' : 'Open responses'}</button>}
          {archived && canArchive && <Button variant="secondary" size="sm" disabled={busy} onClick={() => restoreForm()} leftIcon={<RotateCcw className="h-4 w-4" />}>{busy ? 'Restoring…' : 'Restore form'}</Button>}
        </div>
        {!archived && canArchive && <button type="button" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200/90 bg-rose-50/80 px-3 text-xs font-semibold text-rose-700 shadow-sm ring-1 ring-white/70 backdrop-blur-md transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 sm:w-auto" onClick={() => { setPassword(''); setArchiveError(''); setArchiveOpen(true) }}><Archive className="h-4 w-4 shrink-0" aria-hidden="true" />Archive form</button>}
      </div>

      {!archived && canOverride && published && <div className="flex flex-col gap-2 rounded-xl border border-white/80 bg-white/55 p-3 shadow-sm ring-1 ring-slate-200/60 backdrop-blur-md sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Extra response window</span>
          {!overrideActive && <label className="sr-only" htmlFor="extra-response-duration">Extra response duration</label>}
          {!overrideActive && <select id="extra-response-duration" value={overrideMinutes} onChange={(event) => setOverrideMinutes(Number(event.target.value))} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
            {[5, 10, 15, 30, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>}
          {overrideActive && <p role="status" className="text-xs text-emerald-700">Open until {formatDateTime(form.responseOverrideUntil!)}.</p>}
        </div>
        <Button variant={overrideActive ? 'danger' : 'secondary'} size="sm" className="w-full sm:w-auto" disabled={busy} onClick={() => toggleOverride()}>
          {busy ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />Updating…</> : overrideActive ? <><X className="h-4 w-4" aria-hidden="true" />Close extra window</> : <><Check className="h-4 w-4" aria-hidden="true" />Open for {overrideMinutes} min</>}
        </Button>
      </div>}
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    </div>

    <ConfirmDialog
      isOpen={closeConfirmOpen}
      onClose={() => setCloseConfirmOpen(false)}
      onConfirm={() => updateResponseState(false)}
      title="Close responses for this form?"
      message="People will no longer be able to submit responses until the form is reopened."
      confirmLabel="Close responses"
      confirmVariant="danger"
    />

    <Modal isOpen={archiveOpen} onClose={() => { if (!archiving) setArchiveOpen(false) }} title="Archive this form?" description="The public form link will stop accepting responses. Submitted attendee responses and analytics will be preserved." className="max-w-md">
      <form onSubmit={(event) => void archiveForm(event)} className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">“{form.title}” will move to Archived forms.</p><p className="mt-1">An administrator can restore it later. Its response records will remain available.</p></div>
        <Input label="Your account password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={archiving} error={archiveError} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={archiving} onClick={() => setArchiveOpen(false)}>Cancel</Button><Button type="submit" variant="danger" disabled={archiving} isLoading={archiving} leftIcon={<Trash2 className="h-4 w-4" />}>{archiving ? 'Archiving form…' : 'Verify & Archive Form'}</Button></div>
      </form>
    </Modal>
  </>
}
