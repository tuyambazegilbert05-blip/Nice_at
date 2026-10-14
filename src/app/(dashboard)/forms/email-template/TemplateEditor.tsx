'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { Card, CardContent } from '../../../../components/ui/Card'
import { DEFAULT_FORM_EMAIL_TEMPLATE, type FormEmailTemplate } from '../../../../lib/forms/email-template'
import { CustomFormBrand } from '../../../../components/forms/CustomFormBrand'

export default function FormEmailTemplateEditor() {
  const [template, setTemplate] = useState<FormEmailTemplate>(DEFAULT_FORM_EMAIL_TEMPLATE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/forms/email-template', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not load the email template.')
      setTemplate(result.data)
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load the email template.'))
      .finally(() => setLoading(false))
  }, [])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch('/api/forms/email-template', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(template) })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not save the email template.')
      setMessage('Confirmation email template saved.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the email template.') }
    finally { setSaving(false) }
  }

  return <div className="mx-auto max-w-3xl space-y-6">
    <div className="flex items-start gap-3"><Link href="/forms" aria-label="Back to forms" className="mt-1 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></Link><CustomFormBrand logoClassName="h-11 w-11" showTagline={false} /><div><h1 className="text-2xl font-bold text-slate-900">Confirmation email</h1><p className="mt-1 text-sm text-slate-600">Edit the message sent after an independent custom-form response is saved. This message does not subscribe attendees to marketing.</p></div></div>
    <Card><CardContent className="p-5 sm:p-7"><form onSubmit={save} className="space-y-5">
      <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs leading-relaxed text-sky-950"><p className="font-semibold">Available placeholders</p><p className="mt-1">{'{{fullName}}'}, {'{{firstName}}'}, {'{{sessionTitle}}'}, {'{{sessionDate}}'}, {'{{sessionTime}}'}, {'{{sessionLocation}}'}</p></div>
      <label className="block space-y-1.5 text-sm font-semibold text-slate-800">Subject<input required maxLength={180} value={template.subject} onChange={(event) => setTemplate((current) => ({ ...current, subject: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>
      <label className="block space-y-1.5 text-sm font-semibold text-slate-800">Heading<input required maxLength={180} value={template.heading} onChange={(event) => setTemplate((current) => ({ ...current, heading: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>
      <label className="block space-y-1.5 text-sm font-semibold text-slate-800">Message<textarea required minLength={10} maxLength={6000} rows={16} value={template.body} onChange={(event) => setTemplate((current) => ({ ...current, body: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal leading-relaxed outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>
      <p className="text-xs text-slate-500">The email uses NiCE Club Rwanda branding, escaped attendee input, and a plain-text alternative. Delivery is reported as provider accepted or failed, not as proof of inbox delivery.</p>
      {loading && <p role="status" className="text-sm text-slate-500">Loading saved template…</p>}
      {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="flex justify-end border-t border-slate-100 pt-4"><Button type="submit" isLoading={saving || loading} leftIcon={<Check className="h-4 w-4" />}>Save template</Button></div>
    </form></CardContent></Card>
  </div>
}
