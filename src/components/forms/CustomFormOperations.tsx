'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Archive, BarChart3, Check, Copy, ExternalLink, Pencil, QrCode, RotateCcw, Share2, Trash2, Users } from 'lucide-react'
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
    try {
      await navigator.clipboard.writeText(new URL(formPath, window.location.origin).toString())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy the public link. Open Sharing to copy it manually.')
    }
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
    void updateResponseState(true)
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

  return <>
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {!archived && canEdit && <Link href={`/forms/${encodeURIComponent(form.id)}/edit#customize-form`}><Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />}>Customize form</Button></Link>}
        <Link href={`/forms/${encodeURIComponent(form.id)}#form-analytics`}><Button variant="outline" size="sm" leftIcon={<BarChart3 className="h-4 w-4" />}>Analytics</Button></Link>
        {!archived && published && canGenerateQr && <Link href={`/forms/${encodeURIComponent(form.id)}/share#shareable-qr`}><Button variant="primary" size="sm" leftIcon={<QrCode className="h-4 w-4" />}>Display QR</Button></Link>}
        {!archived && <Link href={`/forms/${encodeURIComponent(form.id)}/share`}><Button variant="outline" size="sm" leftIcon={<Share2 className="h-4 w-4" />}>Sharing</Button></Link>}
        {!archived && published && <Button variant="outline" size="sm" disabled={copied} onClick={() => void copyPublicLink()} leftIcon={copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}>{copied ? 'Copied' : 'Copy Link'}</Button>}
        <Link href={`/forms/${encodeURIComponent(form.id)}/responses`}><Button variant="outline" size="sm" leftIcon={<Users className="h-4 w-4" />}>Responses</Button></Link>
        {!archived && published && <Link href={`/form/${encodeURIComponent(form.publicToken)}`} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>Open Form</Button></Link>}
        {!archived && canEdit && published && <Button variant="outline" size="sm" disabled={busy} onClick={toggleResponses}>{responseState === 'ACCEPTING' ? 'Close Responses' : 'Open Responses'}</Button>}
        {archived && canArchive && <Button variant="secondary" size="sm" disabled={busy} onClick={() => void restoreForm()} leftIcon={<RotateCcw className="h-4 w-4" />}>Restore Form</Button>}
        {!archived && canArchive && <Button variant="danger" size="sm" onClick={() => { setPassword(''); setArchiveError(''); setArchiveOpen(true) }} leftIcon={<Archive className="h-4 w-4" />}>Archive Form</Button>}
      </div>

      {!archived && canOverride && published && <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        {!overrideActive && <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Extra response duration
          <select value={overrideMinutes} onChange={(event) => setOverrideMinutes(Number(event.target.value))} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800">
            {[5, 10, 15, 30, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </label>}
        <Button variant={overrideActive ? 'danger' : 'secondary'} size="sm" disabled={busy} onClick={() => void toggleOverride()}>
          {busy ? 'Updating responses…' : overrideActive ? 'Close Extra Responses' : `Open Responses for ${overrideMinutes} min`}
        </Button>
        {overrideActive && <p role="status" className="text-xs text-emerald-700">Responses are temporarily open until {formatDateTime(form.responseOverrideUntil!)}. They will close automatically.</p>}
      </div>}
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    </div>

    <ConfirmDialog
      isOpen={closeConfirmOpen}
      onClose={() => setCloseConfirmOpen(false)}
      onConfirm={() => void updateResponseState(false)}
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
