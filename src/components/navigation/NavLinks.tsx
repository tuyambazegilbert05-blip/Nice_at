'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../utils/cn'
import { gsap } from '../../motion/gsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'
import { useGSAP } from '../../motion/gsap/useGsap'

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Sessions', href: '/sessions' },
  { name: 'Attendance', href: '/attendance' },
  { name: 'Participants', href: '/participants' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Communications', href: '/communications' },
  { name: 'Resources', href: '/resources' },
  { name: 'Settings', href: '/settings' },
  { name: 'Account', href: '/account' },
]

export function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()
  const nav = useRef<HTMLElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const active = nav.current?.querySelector<HTMLElement>('[aria-current="page"]')
    const marker = indicator.current
    if (!active || !marker) return
    const targetY = active.offsetTop
    const targetHeight = active.offsetHeight
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(marker, { y: targetY, height: targetHeight })
      marker.dataset.positioned = 'true'
      return
    }
    if (!marker.dataset.positioned) {
      gsap.set(marker, { y: targetY, height: targetHeight })
      marker.dataset.positioned = 'true'
      return
    }
    gsap.to(marker, { y: targetY, height: targetHeight, duration: MOTION_DURATION.medium, ease: MOTION_EASE.energy, overwrite: 'auto' })
  }, { scope: nav, dependencies: [pathname] })

  return (
    <nav ref={nav} className="relative flex flex-col space-y-1" aria-label="Main navigation">
      <span ref={indicator} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 rounded-lg bg-nice-blue-50 ring-1 ring-nice-blue-100" />
      {NAVIGATION_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            onClick={onItemClick}
            className={cn(
              'relative z-10 flex items-center rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-nice-blue-600 text-nice-blue-800 font-semibold'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
            )}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
