'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFlipLayout } from '../../motion/gsap/useFlip'
import type { AnalyticsFilters, AnalyticsSessionOption } from '../../types/analytics'

export function AnalyticsFilters({
  filters,
  sessions,
  programs,
  years,
}: {
  filters: AnalyticsFilters
  sessions: AnalyticsSessionOption[]
  programs: string[]
  years: string[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()
  const captureFlip = useFlipLayout(searchKey, '[data-analytics-flip]')

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const params = new URLSearchParams()
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string' && value) params.set(key, value)
    }
    captureFlip()
    router.push(params.size ? `/analytics?${params.toString()}` : '/analytics', { scroll: false })
  }

  return (
    <form key={searchKey} method="get" action="/analytics" onSubmit={applyFilters} className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      <label className="space-y-1 text-xs font-medium text-slate-600">From<input type="date" name="dateFrom" defaultValue={filters.dateFrom} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-nice-blue-500 focus:outline-none focus:ring-2 focus:ring-nice-blue-100" /></label>
      <label className="space-y-1 text-xs font-medium text-slate-600">To<input type="date" name="dateTo" defaultValue={filters.dateTo} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-nice-blue-500 focus:outline-none focus:ring-2 focus:ring-nice-blue-100" /></label>
      <label className="space-y-1 text-xs font-medium text-slate-600">Session<select name="sessionId" defaultValue={filters.sessionId || ''} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"><option value="">All sessions</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}</select></label>
      <label className="space-y-1 text-xs font-medium text-slate-600">Program<select name="program" defaultValue={filters.program || ''} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"><option value="">All programs</option>{programs.map((program) => <option key={program} value={program}>{program}</option>)}</select></label>
      <label className="space-y-1 text-xs font-medium text-slate-600">Year of study<select name="yearOfStudy" defaultValue={filters.yearOfStudy || ''} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"><option value="">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
      <label className="space-y-1 text-xs font-medium text-slate-600">Session status<select name="sessionStatus" defaultValue={filters.sessionStatus || ''} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"><option value="">All statuses</option>{['DRAFT', 'UPCOMING', 'OPEN', 'CLOSING_SOON', 'CLOSED'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
      <div className="flex gap-2"><button type="submit" className="min-h-10 flex-1 rounded-lg bg-nice-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-nice-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nice-blue-500">Apply</button><button type="button" onClick={() => { captureFlip(); router.push('/analytics', { scroll: false }) }} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Clear</button></div>
    </form>
  )
}
