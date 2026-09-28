'use client'

import React, { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export default function DashboardError({ error, retry }: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error('Dashboard failed to render', error)
  }, [error])

  return (
    <section className="mx-auto flex min-h-72 max-w-xl flex-col items-center justify-center rounded-xl border border-rose-200 bg-white p-8 text-center shadow-subtle" role="alert">
      <h1 className="text-lg font-bold text-slate-900">Dashboard couldn’t load</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Something interrupted the dashboard request. Try loading it again.
      </p>
      <Button type="button" variant="primary" className="mt-5" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={retry}>
        Try again
      </Button>
      {error.digest && <p className="mt-4 text-xs text-slate-400">Reference: {error.digest}</p>}
    </section>
  )
}
