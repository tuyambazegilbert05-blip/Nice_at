'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function AnalyticsAutoRefresh() {
  const router = useRouter()
  const lastRefreshAt = useRef(0)

  useEffect(() => {
    lastRefreshAt.current = Date.now()
    const refresh = () => {
      const now = Date.now()
      if (document.visibilityState !== 'visible' || now - lastRefreshAt.current < 30_000) return
      lastRefreshAt.current = now
      router.refresh()
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
