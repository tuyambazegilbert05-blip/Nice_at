'use client'

import React from 'react'
import { ErrorAlertAnimation } from '../../../lottie/errors'

export default function AnalyticsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-subtle" role="alert">
      <ErrorAlertAnimation label="Analytics could not be loaded" className="mb-3 h-16 w-16" />
      <h2 className="text-lg font-semibold text-slate-900">Analytics are temporarily unavailable</h2>
      <p className="mt-1 max-w-md text-sm text-slate-600">The database did not return the analytics data. Try again in a moment.</p>
      <button type="button" onClick={reset} className="mt-5 rounded-lg bg-nice-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-nice-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nice-blue-500">Retry</button>
    </section>
  )
}
