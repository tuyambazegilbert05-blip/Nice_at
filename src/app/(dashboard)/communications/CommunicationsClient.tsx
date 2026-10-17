'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Mail, Paperclip, Send, X } from 'lucide-react'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { EmailSuccessDialog } from '../../../components/ui/EmailSuccessDialog'
import { RestrictedActionPanel } from '../../../components/ui/RestrictedAction'
import type { UserRole } from '../../../types/user'

type Recipient = { email: string; name: string; category: 'Team' | 'Opted-in participant' }

export default function CommunicationsClient({ canCommunicate = true, role }: { canCommunicate?: boolean; role: UserRole }) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [extraEmails, setExtraEmails] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(canCommunicate)
  const [sending, setSending] = useState(false)
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const [failedCount, setFailedCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    document.querySelector<HTMLElement>('[data-tour="platform-communications"]')?.setAttribute('data-tour-ready', 'true')
  }, [])

  useEffect(() => {
    if (!canCommunicate) return
    fetch('/api/communications').then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not load recipient list.')
      setRecipients(result.data)
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load recipient list.')).finally(() => setLoading(false))
  }, [canCommunicate])

  useEffect(() => {
    if (!canCommunicate) return
    const timer = setTimeout(async () => {
      try {
        const formData = new FormData()
        formData.set('subject', subject)
        formData.set('message', message)
        files.filter((file) => file.type.startsWith('image/')).forEach((file) => formData.append('images', file))
        const response = await fetch('/api/communications/preview', { method: 'POST', body: formData })
        const result = await response.json()
        if (response.ok) setPreview(result.html)
      } catch { /* Keep the previous preview while offline. */ }
    }, 250)
    return () => clearTimeout(timer)
  }, [canCommunicate, files, subject, message])

  const parsedCustomEmails = useMemo(() => extraEmails.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean), [extraEmails])
  const finalRecipients = useMemo(() => [...new Set([...selected, ...parsedCustomEmails])], [selected, parsedCustomEmails])

  function toggle(email: string) {
    setSelected((current) => current.includes(email) ? current.filter((item) => item !== email) : [...current, email])
  }

  function reviewSend(event: FormEvent) {
    event.preventDefault()
    if (!canCommunicate) return setError(`Access denied: your ${role} role cannot use communications.`)
    setSuccessCount(null)
    setFailedCount(0)
    setError('')
    if (!finalRecipients.length) return setError('Select or enter at least one recipient.')
    if (finalRecipients.length > 100) return setError('Send to no more than 100 recipients at a time.')
    if (fileError) return setError(fileError)
    setSendConfirmOpen(true)
  }

  async function sendEmails() {
    setSendConfirmOpen(false)
    setSending(true)
    try {
      const body = new FormData()
      body.set('recipients', JSON.stringify(finalRecipients))
      body.set('subject', subject)
      body.set('message', message)
      files.forEach((file) => body.append('attachments', file))
      const response = await fetch('/api/communications', { method: 'POST', body })
      const result = await response.json()
      if (!response.ok && response.status !== 207) throw new Error(result.error || 'Email could not be sent.')
      if (result.sent > 0) {
        setSuccessCount(result.sent)
        setFailedCount(result.failed || 0)
      }
      if (result.failedRecipients?.length) setError(`Not sent: ${result.failedRecipients.join(', ')}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Email could not be sent.')
    } finally { setSending(false) }
  }

  function selectFiles(fileList: FileList | null) {
    const nextFiles = Array.from(fileList || [])
    const allowedExtensions = /\.(jpe?g|png|gif|webp|pdf|txt|docx|pptx|xlsx)$/i
    const totalBytes = nextFiles.reduce((total, file) => total + file.size, 0)
    const issue = nextFiles.length > 5 ? 'Choose no more than 5 files.'
      : nextFiles.some((file) => !allowedExtensions.test(file.name)) ? 'Use JPEG, PNG, GIF, WebP, PDF, TXT, DOCX, PPTX, or XLSX files.'
      : nextFiles.some((file) => file.size > 5 * 1024 * 1024) ? 'Each file must be 5 MB or smaller.'
      : totalBytes > 10 * 1024 * 1024 ? 'Files must total no more than 10 MB.' : ''
    setFileError(issue)
    setError('')
    if (!issue) setFiles(nextFiles)
  }

  const team = recipients.filter((recipient) => recipient.category === 'Team')
  const optedInParticipants = recipients.filter((recipient) => recipient.category === 'Opted-in participant')

  return <div data-tour="platform-communications" aria-busy={canCommunicate && loading} className="space-y-6">
    <header className="flex items-start gap-3 border-b border-slate-200 pb-4">
      <div className="rounded-xl bg-sky-50 p-3 text-sky-700"><Mail className="h-6 w-6" /></div>
      <div><h1 className="text-2xl font-bold text-slate-900">Communications</h1><p className="mt-1 text-sm text-slate-600">Compose a NiCE Club Rwanda email, preview the branded layout, then confirm delivery.</p></div>
    </header>
    <RestrictedActionPanel
      enabled={!canCommunicate}
      message={`Access denied: your ${role} role cannot view recipients, preview messages, or send communications. Contact an administrator if you need access.`}
    ><form onSubmit={reviewSend}>
      <fieldset disabled={!canCommunicate} aria-disabled={!canCommunicate} className="grid min-w-0 grid-cols-1 gap-6 border-0 p-0 xl:grid-cols-2">
      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="font-semibold text-slate-900">Recipients</h2><p className="mt-1 text-xs text-slate-500">Bulk updates include people who explicitly opted in through a session or Custom Form. You can also enter addresses directly.</p></div>
        {loading ? <p className="text-sm text-slate-500">Loading contacts…</p> : error && !recipients.length ? <p role="alert" className="text-sm text-rose-700">{error}</p> : <>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelected(recipients.map((item) => item.email))} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Select all available</button><button type="button" onClick={() => setSelected([])} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Clear</button><span className="self-center text-xs text-slate-500">{selected.length} selected</span></div>
          <div className="max-h-56 space-y-4 overflow-auto rounded-lg border border-slate-200 p-3">
            {(['Team', 'Opted-in participant'] as const).map((category) => {
              const items = category === 'Team' ? team : optedInParticipants
              return <fieldset key={category}><legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{category} ({items.length})</legend>{items.length ? <div className="space-y-2">{items.map((item) => <label key={`${category}-${item.email}`} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={selected.includes(item.email)} onChange={() => toggle(item.email)} className="rounded border-slate-300 text-sky-700 focus:ring-sky-600" /><span className="min-w-0 truncate">{item.name} <span className="text-slate-400">{item.email}</span></span></label>)}</div> : <p className="text-xs text-slate-400">No contacts</p>}</fieldset>
            })}
          </div>
        </>}
        <label className="block text-sm font-medium text-slate-700">Additional email addresses<textarea value={extraEmails} onChange={(event) => setExtraEmails(event.target.value)} rows={3} placeholder="Separate addresses with commas or new lines" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        <p className="text-xs text-slate-500">Total recipients: {finalRecipients.length} / 100</p>
        <label className="block text-sm font-medium text-slate-700">Subject<input required minLength={3} maxLength={180} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="A NiCE Club update" /></label>
        <label className="block text-sm font-medium text-slate-700">Message<textarea required minLength={2} maxLength={6000} rows={8} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Write your update… Use a blank line to start a new paragraph." /></label>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 hover:border-sky-500 hover:bg-sky-50"><Paperclip className="h-4 w-4 text-sky-700" /><span>Add attachments or images</span><input type="file" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.docx,.pptx,.xlsx" onChange={(event) => selectFiles(event.target.files)} className="sr-only" /></label>
          <p className="text-xs text-slate-500">Images appear in the email body and are also included as regular attachments. Other files are attachments only. Up to 5 files and 10 MB total.</p>
          {fileError && <p role="alert" className="text-sm text-rose-700">{fileError}</p>}
          {files.length > 0 && <ul className="space-y-1">{files.map((file, index) => <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-2 rounded-md bg-sky-50 px-2.5 py-1.5 text-xs text-slate-700"><span className="min-w-0 truncate">{file.type.startsWith('image/') ? 'Body image + attachment · ' : 'Attachment · '}{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => { setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index)); setFileError('') }} className="rounded p-1 text-slate-500 hover:bg-white hover:text-rose-700"><X className="h-4 w-4" /></button></li>)}</ul>}
        </div>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button disabled={sending || !finalRecipients.length} aria-busy={sending} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50">{sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? 'Sending emails…' : 'Review and send'}</button>
      </section>
      <section className="space-y-3"><div><h2 className="font-semibold text-slate-900">Branded email preview</h2><p className="mt-1 text-xs text-slate-500">This preview uses the same NiCE Club template and escaped message content used for delivery.</p></div><iframe title="Branded email preview" sandbox="" srcDoc={preview} className="h-[680px] w-full rounded-xl border border-slate-200 bg-slate-100" /></section>
      </fieldset>
    </form></RestrictedActionPanel>
    <ConfirmDialog
      isOpen={sendConfirmOpen}
      onClose={() => setSendConfirmOpen(false)}
      onConfirm={() => sendEmails()}
      title="Confirm email delivery"
      message={`Send “${subject}” to ${finalRecipients.length} recipient(s)?`}
      confirmLabel="Send emails"
    />
    <EmailSuccessDialog
      isOpen={successCount !== null}
      onClose={() => setSuccessCount(null)}
      title="Email update sent"
      message={`Your email is on its way to ${successCount ?? 0} recipient${successCount === 1 ? '' : 's'}.`}
      nextStep={failedCount ? `${failedCount} address${failedCount === 1 ? '' : 'es'} could not be reached. Review the notice on this page and check those addresses before sending again.` : 'You can continue composing another update or leave this page. Recipients can check their inbox and spam folder.'}
      actionLabel="Back to communications"
    />
  </div>
}
