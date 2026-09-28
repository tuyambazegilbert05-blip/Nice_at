import React from 'react'

export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-2">
          <div className="h-8 w-64 max-w-[70vw] animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-96 max-w-[85vw] animate-pulse rounded bg-slate-100" />
        </div>
        <div className="hidden h-10 w-36 animate-pulse rounded-lg bg-slate-200 sm:block" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-hidden="true">
        <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>

      <p className="sr-only" role="status">Loading dashboard data…</p>
    </div>
  )
}
