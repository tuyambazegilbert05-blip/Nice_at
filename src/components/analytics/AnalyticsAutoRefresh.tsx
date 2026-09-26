'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AnalyticsAutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const interval = window.setInterval(refresh, 30_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [router])

  return <p className="text-xs text-slate-500" aria-live="polite">Live data · refreshes every 30 seconds while this page is visible</p>
}
