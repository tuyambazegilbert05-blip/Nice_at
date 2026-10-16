'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock3 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { formatDateTime } from '../../utils/date'
import { fromKigaliDateTimeInput, getResponseWindowState, toKigaliDateTimeInput } from '../../lib/forms/response-window'
import type { CustomForm } from '../../lib/forms/form-service'

const stateLabels = {
  DRAFT: 'Draft · publish before accepting responses',
  CLOSED: 'Closed manually',
  SCHEDULED: 'Scheduled to open',
  ACCEPTING: 'Accepting responses',
  ENDED: 'Response window ended',
} as const

export function ResponseWindowControls({ form, canEdit }: { form: CustomForm; canEdit: boolean }) {
  const router = useRouter()
  const [opensAt, setOpensAt] = useState(() => toKigaliDateTimeInput(form.responseOpensAt))
  const [closesAt, setClosesAt] = useState(() => toKigaliDateTimeInput(form.responseClosesAt))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const state = getResponseWindowState(form)

  async function saveWindow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(form.id)}/response-window`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opensAt: fromKigaliDateTimeInput(opensAt), closesAt: fromKigaliDateTimeInput(closesAt) }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not save the response window.')
      setSaved(true)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the response window.')
    } finally { setBusy(false) }
  }

  return <Card className="overflow-hidden border-white/80 bg-white/65 shadow-sm ring-1 ring-sky-100/80 backdrop-blur-md">
    <CardHeader className="flex flex-row items-center justify-between gap-3 border-b-0 p-4 pb-2 sm:px-5 sm:pt-4">
      <div className="min-w-0"><CardTitle className="text-base">Response availability</CardTitle><p className="mt-0.5 text-[11px] text-slate-500">Public response window · Kigali time (CAT)</p></div>
      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${state === 'ACCEPTING' ? 'bg-emerald-50/90 text-emerald-800' : state === 'SCHEDULED' ? 'bg-sky-50/90 text-sky-800' : state === 'ENDED' || state === 'CLOSED' ? 'bg-slate-100/90 text-slate-700' : 'bg-amber-50/90 text-amber-800'}`}><Clock3 className="h-3.5 w-3.5" />{stateLabels[state]}</span>
    </CardHeader>
    <CardContent className="space-y-2.5 px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
      {form.responseOpensAt && form.responseClosesAt && <p className="text-[11px] text-slate-500">{formatDateTime(form.responseOpensAt)} – {formatDateTime(form.responseClosesAt)}</p>}
      {form.archivedAt ? <p className="rounded-lg border border-white/80 bg-white/60 p-2.5 text-xs text-slate-700 ring-1 ring-slate-200/60">Restore this archived form before changing its response schedule.</p> : canEdit ? <>
        <form onSubmit={saveWindow} className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="space-y-1 text-[11px] font-semibold text-slate-600">Opens at CAT<input type="datetime-local" required value={opensAt} onChange={(event) => { setOpensAt(event.target.value); setSaved(false) }} className="block w-full rounded-xl border border-white/90 bg-white/75 px-3 py-2 text-xs font-normal text-slate-800 shadow-sm ring-1 ring-slate-200/80 backdrop-blur outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" /></label>
          <label className="space-y-1 text-[11px] font-semibold text-slate-600">Closes at CAT<input type="datetime-local" required value={closesAt} onChange={(event) => { setClosesAt(event.target.value); setSaved(false) }} className="block w-full rounded-xl border border-white/90 bg-white/75 px-3 py-2 text-xs font-normal text-slate-800 shadow-sm ring-1 ring-slate-200/80 backdrop-blur outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" /></label>
          <Button type="submit" size="sm" className="w-full sm:w-auto" disabled={busy} isLoading={busy} leftIcon={<Check className="h-4 w-4" />}>{busy ? 'Saving…' : 'Save window'}</Button>
        </form>
      </> : <p className="text-xs text-slate-600">A form manager can change this response window.</p>}
      {saved && <p role="status" className="text-sm font-medium text-emerald-700">Response window saved.</p>}
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    </CardContent>
  </Card>
}
