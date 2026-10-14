'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { Card, CardContent } from '../../../../components/ui/Card'
import { Button } from '../../../../components/ui/Button'
import { CustomFormBrand } from '../../../../components/forms/CustomFormBrand'

type Details = { title: string; eventDate: string; startTime: string; endTime: string; location: string }
type DetailsDraft = { expiresAt: number; details: Details }
const STORAGE_KEY = 'nice-custom-form-details-draft-v1'

function kigaliDate() {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

export default function NewCustomFormPage() {
  const router = useRouter()
  const [details, setDetails] = useState<Details>({ title: '', eventDate: '', startTime: '09:00', endTime: '12:00', location: '' })
  const [ready, setReady] = useState(false)
  const hydratedRef = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DetailsDraft>
          if (typeof parsed.expiresAt === 'number' && parsed.expiresAt > Date.now() && parsed.details && typeof parsed.details === 'object') {
            setDetails((current) => ({ ...current, ...parsed.details }))
          } else localStorage.removeItem(STORAGE_KEY)
        } else setDetails((current) => ({ ...current, eventDate: kigaliDate() }))
      } catch { setError('Browser draft recovery is unavailable in this browser.') }
      hydratedRef.current = true
      setReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not create the form.')
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* server draft is now recoverable */ }
      router.push(`/forms/${encodeURIComponent(result.data.id)}/edit`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the form.')
      setSaving(false)
    }
  }

  const set = (key: keyof Details, value: string) => {
    const next = { ...details, [key]: value }
    setDetails(next)
    if (hydratedRef.current) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, details: next } satisfies DetailsDraft)) }
      catch { setError('Browser draft recovery is unavailable. Keep this page open until the form is created.') }
    }
  }

  return <div className="mx-auto max-w-3xl space-y-6">
    <div className="flex items-center gap-3"><Link href="/forms" aria-label="Back to custom forms" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><ArrowLeft className="h-4 w-4" /></Link><CustomFormBrand logoClassName="h-11 w-11" showTagline={false} /><div><h1 className="text-2xl font-bold text-slate-900">Create a custom form</h1><p className="mt-1 text-sm text-slate-600">This form has its own public link and response list, separate from Scientific Sessions.</p></div></div>
    <Card><CardContent className="p-5 sm:p-7"><form onSubmit={create} className="space-y-5">
      <label className="block space-y-1.5 text-sm font-semibold text-slate-800">Form and event title<input required minLength={3} maxLength={180} value={details.title} onChange={(event) => set('title', event.target.value)} placeholder="e.g. Clean Energy Youth Dialogue" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>
      <label className="block space-y-1.5 text-sm font-semibold text-slate-800"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-sky-700" />Event date</span><input required type="date" value={details.eventDate} onChange={(event) => set('eventDate', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1.5 text-sm font-semibold text-slate-800">Start time (CAT)<input required type="time" value={details.startTime} onChange={(event) => set('startTime', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label><label className="block space-y-1.5 text-sm font-semibold text-slate-800">End time (CAT)<input required type="time" value={details.endTime} onChange={(event) => set('endTime', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label></div>
      <label className="block space-y-1.5 text-sm font-semibold text-slate-800"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-700" />Location</span><input required minLength={2} maxLength={500} value={details.location} onChange={(event) => set('location', event.target.value)} placeholder="Venue, city" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>
      <p className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">Your details are kept as a short-lived browser draft until the form is created. Field edits are saved to the server in the next step.</p>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="flex justify-end border-t border-slate-100 pt-4"><Button type="submit" disabled={!ready} isLoading={saving || !ready}>{saving ? 'Creating form…' : !ready ? 'Restoring draft…' : 'Create and customize'}</Button></div>
    </form></CardContent></Card>
  </div>
}
