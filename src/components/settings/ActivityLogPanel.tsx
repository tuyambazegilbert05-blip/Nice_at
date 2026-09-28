'use client'

import { useEffect, useState } from 'react'
import { Activity, Clock3, UserRound, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { ActivityRecord } from '../../lib/activity/activity-service'

function formatActivityTime(value: string): string {
  return new Intl.DateTimeFormat('en-RW', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Kigali',
  }).format(new Date(value)) + ' CAT'
}

function readableKey(value: string): string {
  return value.replaceAll(/([A-Z])/g, ' $1').replaceAll('_', ' ').replace(/^./, (char) => char.toUpperCase())
}

export default function ActivityLogPanel() {
  const [items, setItems] = useState<ActivityRecord[]>([])
  const [selected, setSelected] = useState<ActivityRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/activity')
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load staff activity.')
        if (!cancelled) setItems(result.data as ActivityRecord[])
      })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load staff activity.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return <>
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-50 p-2 text-sky-700"><Activity className="h-5 w-5" /></div>
          <div><CardTitle>Staff Activity Log</CardTitle><CardDescription>Recent actions by staff accounts. Select an entry to inspect its full details.</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p role="status" className="py-8 text-center text-sm text-slate-500">Loading staff activity…</p>}
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {!loading && !error && items.length === 0 && <div className="py-10 text-center"><Activity className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-700">No activity recorded yet</p><p className="mt-1 text-xs text-slate-500">New staff actions will appear here.</p></div>}
        {!loading && !error && items.length > 0 && <div className="divide-y divide-slate-100">
          {items.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item)} className="flex w-full flex-col gap-2 py-4 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-3">
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-900">{item.summary}</span><Badge variant={item.actorRole === 'ADMIN' ? 'info' : item.actorRole === 'MANAGER' ? 'default' : 'success'} size="sm">{item.actorRole}</Badge></span>
              <span className="mt-1 block text-xs text-slate-500">{item.actorName}{item.targetLabel ? ` · ${item.targetLabel}` : ''}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{formatActivityTime(item.createdAt)}</span>
          </button>)}
        </div>}
      </CardContent>
    </Card>

    {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
      <section role="dialog" aria-modal="true" aria-labelledby="activity-detail-title" className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Activity detail</p><h2 id="activity-detail-title" className="mt-1 text-lg font-bold text-slate-900">{selected.summary}</h2></div>
          <Button type="button" variant="ghost" size="sm" aria-label="Close activity details" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
        </header>
        <div className="space-y-4 p-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><UserRound className="h-4 w-4 text-sky-700" />{selected.actorName}</div>
            <p className="mt-1 text-sm text-slate-600">{selected.actorRole} performed this action</p>
            <p className="mt-2 text-xs text-slate-500">{formatActivityTime(selected.createdAt)}</p>
          </div>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-medium text-slate-500">Action</dt><dd className="mt-1 font-semibold text-slate-800">{readableKey(selected.action)}</dd></div>
            {selected.targetType && <div><dt className="text-xs font-medium text-slate-500">Record type</dt><dd className="mt-1 font-semibold text-slate-800">{readableKey(selected.targetType)}</dd></div>}
            {selected.targetLabel && <div className="sm:col-span-2"><dt className="text-xs font-medium text-slate-500">Related record</dt><dd className="mt-1 break-words font-semibold text-slate-800">{selected.targetLabel}</dd></div>}
            {selected.targetId && <div className="sm:col-span-2"><dt className="text-xs font-medium text-slate-500">Record ID</dt><dd className="mt-1 break-all font-mono text-xs text-slate-600">{selected.targetId}</dd></div>}
          </dl>
          {Object.keys(selected.details || {}).length > 0 && <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Change details</h3><dl className="space-y-2 rounded-xl border border-slate-200 p-4">
            {Object.entries(selected.details).map(([key, value]) => <div key={key} className="grid grid-cols-[minmax(7rem,0.35fr)_1fr] gap-3 text-sm"><dt className="font-medium text-slate-500">{readableKey(key)}</dt><dd className="break-words text-slate-800">{typeof value === 'string' ? value : JSON.stringify(value)}</dd></div>)}
          </dl></div>}
        </div>
        <footer className="flex justify-end border-t border-slate-100 p-4"><Button type="button" variant="outline" onClick={() => setSelected(null)}>Close</Button></footer>
      </section>
    </div>}
  </>
}
