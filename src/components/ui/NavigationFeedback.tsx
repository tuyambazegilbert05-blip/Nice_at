'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationFeedback() {
  const pathname = usePathname()
  const lastAuditedPath = useRef<string | null>(null)
  const [pendingFrom, setPendingFrom] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!pathname || lastAuditedPath.current === pathname) return
    lastAuditedPath.current = pathname
    const protectedPage = /^\/(dashboard|sessions|attendance|participants|analytics|resources|settings|account|communications|forms)(\/|$)/.test(pathname)
    if (!protectedPage) return
    void fetch('/api/activity/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathname }),
      keepalive: true,
    }).catch(() => undefined)
  }, [pathname])

  useEffect(() => {
    const clear = () => {
      if (timer.current) clearTimeout(timer.current)
      if (fallback.current) clearTimeout(fallback.current)
      timer.current = null
      fallback.current = null
      setPendingFrom(null)
      setShowProgress(false)
    }

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (!(event.target instanceof Element)) return
      const activityPath = event.target.closest<HTMLElement>('[data-activity-path]')?.dataset.activityPath
      if (activityPath) {
        void fetch('/api/activity/navigation', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pathname: activityPath }), keepalive: true,
        }).catch(() => undefined)
      }
      const link = event.target.closest<HTMLAnchorElement>('a[href]')
      const buttonAction = event.target.closest<HTMLElement>('[data-navigation-action="true"]')
      if (!link && !buttonAction) return
      if (link && (link.target && link.target !== '_self' || link.hasAttribute('download'))) return

      if (link) {
        let destination: URL
        try { destination = new URL(link.href, window.location.href) } catch { return }
        if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname || destination.pathname.startsWith('/api/')) return
      }

      if (timer.current) clearTimeout(timer.current)
      if (fallback.current) clearTimeout(fallback.current)
      setPendingFrom(window.location.pathname)
      setShowProgress(false)
      timer.current = setTimeout(() => setShowProgress(true), 120)
      fallback.current = setTimeout(clear, 12000)
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
      if (timer.current) clearTimeout(timer.current)
      if (fallback.current) clearTimeout(fallback.current)
    }
  }, [pathname])

  const visible = pendingFrom === pathname && showProgress
  return <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
    {visible && <><span className="sr-only">Loading page</span><span className="block h-full origin-left animate-pulse bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(14,165,233,0.45)]" /></>}
  </div>
}
