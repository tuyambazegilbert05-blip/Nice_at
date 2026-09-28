'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { RestrictedActionPanel } from '../../../components/ui/RestrictedAction'
import type { UserRole } from '../../../types/user'

type Recipient = { email: string; name: string; category: 'Team' | 'Opted-in attendee' }

export default function CommunicationsClient({ canCommunicate = true, role }: { canCommunicate?: boolean; role: UserRole }) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [extraEmails, setExtraEmails] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(canCommunicate)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

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
        const response = await fetch('/api/communications/preview', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, message }),
        })
        const result = await response.json()
        if (response.ok) setPreview(result.html)
      } catch { /* Preview remains available when the connection returns. */ }
    }, 250)
    return () => clearTimeout(timer)
  }, [canCommunicate, subject, message])

  const parsedCustomEmails = useMemo(() => extraEmails.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean), [extraEmails])
  const finalRecipients = useMemo(() => [...new Set([...selected, ...parsedCustomEmails])], [selected, parsedCustomEmails])

  function toggle(email: string) {
    setSelected((current) => current.includes(email) ? current.filter((item) => item !== email) : [...current, email])
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    if (!canCommunicate) return setError(`Access denied: your ${role} role cannot use communications.`)
    setStatus('')
    setError('')
    if (!finalRecipients.length) return setError('Select or enter at least one recipient.')
    if (finalRecipients.length > 100) return setError('Send to no more than 100 recipients at a time.')
    if (!window.confirm(`Send “${subject}” to ${finalRecipients.length} recipient(s)?`)) return
    setSending(true)
    try {
      const response = await fetch('/api/communications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: finalRecipients, subject, message }),
      })
      const result = await response.json()
      if (!response.ok && response.status !== 207) throw new Error(result.error || 'Email could not be sent.')
      setStatus(result.message || `${result.sent} email(s) accepted by Brevo.`)
      if (result.failedRecipients?.length) setError(`Not sent: ${result.failedRecipients.join(', ')}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Email could not be sent.')
    } finally { setSending(false) }
  }

  const team = recipients.filter((recipient) => recipient.category === 'Team')
  const attendees = recipients.filter((recipient) => recipient.category === 'Opted-in attendee')

  return <div className="space-y-6">
    <header className="flex items-start gap-3 border-b border-slate-200 pb-4">
      <div className="rounded-xl bg-sky-50 p-3 text-sky-700"><Mail className="h-6 w-6" /></div>
      <div><h1 className="text-2xl font-bold text-slate-900">Communications</h1><p className="mt-1 text-sm text-slate-600">Compose a NiCE Club Rwanda email, preview the branded layout, then confirm delivery.</p></div>
    </header>
    <RestrictedActionPanel
      enabled={!canCommunicate}
      message={`Access denied: your ${role} role cannot view recipients, preview messages, or send communications. Contact an administrator if you need access.`}
    ><form onSubmit={send}>
      <fieldset disabled={!canCommunicate} aria-disabled={!canCommunicate} className="grid min-w-0 grid-cols-1 gap-6 border-0 p-0 xl:grid-cols-2">
      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="font-semibold text-slate-900">Recipients</h2><p className="mt-1 text-xs text-slate-500">Bulk updates include attendees who opted in at check-in. You can also enter addresses directly.</p></div>
        {loading ? <p className="text-sm text-slate-500">Loading contacts…</p> : error && !recipients.length ? <p role="alert" className="text-sm text-rose-700">{error}</p> : <>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelected(recipients.map((item) => item.email))} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Select all available</button><button type="button" onClick={() => setSelected([])} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Clear</button><span className="self-center text-xs text-slate-500">{selected.length} selected</span></div>
          <div className="max-h-56 space-y-4 overflow-auto rounded-lg border border-slate-200 p-3">
            {(['Team', 'Opted-in attendee'] as const).map((category) => {
              const items = category === 'Team' ? team : attendees
              return <fieldset key={category}><legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{category} ({items.length})</legend>{items.length ? <div className="space-y-2">{items.map((item) => <label key={`${category}-${item.email}`} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={selected.includes(item.email)} onChange={() => toggle(item.email)} className="rounded border-slate-300 text-sky-700 focus:ring-sky-600" /><span className="min-w-0 truncate">{item.name} <span className="text-slate-400">{item.email}</span></span></label>)}</div> : <p className="text-xs text-slate-400">No contacts</p>}</fieldset>
            })}
          </div>
        </>}
        <label className="block text-sm font-medium text-slate-700">Additional email addresses<textarea value={extraEmails} onChange={(event) => setExtraEmails(event.target.value)} rows={3} placeholder="Separate addresses with commas or new lines" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        <p className="text-xs text-slate-500">Total recipients: {finalRecipients.length} / 100</p>
        <label className="block text-sm font-medium text-slate-700">Subject<input required minLength={3} maxLength={180} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="A NiCE Club update" /></label>
        <label className="block text-sm font-medium text-slate-700">Message<textarea required minLength={2} maxLength={6000} rows={8} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Write your update… Use a blank line to start a new paragraph." /></label>
        {status && <p role="status" className="text-sm font-medium text-emerald-700">{status}</p>}{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button disabled={sending || !finalRecipients.length} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"><Send className="h-4 w-4" />{sending ? 'Sending emails…' : 'Review and send'}</button>
      </section>
      <section className="space-y-3"><div><h2 className="font-semibold text-slate-900">Branded email preview</h2><p className="mt-1 text-xs text-slate-500">This preview uses the same NiCE Club template and escaped message content used for delivery.</p></div><iframe title="Branded email preview" sandbox="" srcDoc={preview} className="h-[680px] w-full rounded-xl border border-slate-200 bg-slate-100" /></section>
      </fieldset>
    </form></RestrictedActionPanel>
  </div>
}
