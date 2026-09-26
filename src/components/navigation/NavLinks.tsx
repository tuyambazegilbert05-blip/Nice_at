'use client'

import React, { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '../../utils/cn'
import { MotionLink } from '../../motion/gsap/MotionLink'
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

const NAVIGATION_GROUPS = [
  { label: 'Operations', items: NAVIGATION_ITEMS.slice(0, 7) },
  { label: 'Workspace', items: NAVIGATION_ITEMS.slice(7) },
]
type NavigationItem = (typeof NAVIGATION_ITEMS)[number]

export function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()
  const nav = useRef<HTMLElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Operations: true, Workspace: true })
  const groupStateKey = Object.entries(expandedGroups).map(([label, expanded]) => `${label}:${expanded}`).join('|')

  useGSAP(() => {
    const navigation = nav.current
    const active = navigation?.querySelector<HTMLElement>('[aria-current="page"]')
    const marker = indicator.current
    if (!navigation || !active || !marker) return
    const targetY = active.getBoundingClientRect().top - navigation.getBoundingClientRect().top + navigation.scrollTop
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
  }, { scope: nav, dependencies: [pathname, groupStateKey] })

  return (
    <nav ref={nav} className="relative flex flex-col space-y-1" aria-label="Main navigation">
      <span ref={indicator} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 rounded-lg bg-nice-blue-50 ring-1 ring-nice-blue-100" />
      {NAVIGATION_GROUPS.map(({ label, items }) => {
        const expanded = expandedGroups[label]
        const groupId = `nice-nav-group-${label.toLowerCase()}`
        return (
          <NavigationGroup
            key={label}
            id={groupId}
            label={label}
            items={items}
            expanded={expanded}
            pathname={pathname ?? ''}
            onToggle={() => setExpandedGroups((current) => ({ ...current, [label]: !current[label] }))}
            onItemClick={onItemClick}
          />
        )
      })}
    </nav>
  )
}

function NavigationGroup({ id, label, items, expanded, pathname, onToggle, onItemClick }: {
  id: string
  label: string
  items: NavigationItem[]
  expanded: boolean
  pathname: string
  onToggle: () => void
  onItemClick?: () => void
}) {
  const list = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const element = list.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(element, { height: expanded ? 'auto' : 0, autoAlpha: expanded ? 1 : 0 })
      return
    }
    if (expanded) {
      gsap.fromTo(element, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: MOTION_DURATION.standard, ease: MOTION_EASE.enter, clearProps: 'height' })
    } else {
      gsap.to(element, { height: 0, autoAlpha: 0, duration: MOTION_DURATION.short, ease: MOTION_EASE.exit })
    }
  }, { scope: list, dependencies: [expanded], revertOnUpdate: true })

  return (
    <section className="relative z-10">
      <button type="button" aria-expanded={expanded} aria-controls={id} onClick={onToggle} className="flex min-h-9 w-full items-center justify-between rounded-md px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nice-blue-500">
        {label}
        <ChevronDown aria-hidden="true" className={cn('h-3.5 w-3.5 transition-transform duration-150', expanded && 'rotate-180')} />
      </button>
      <div id={id} ref={list} aria-hidden={!expanded} className="overflow-hidden">
        <div className="relative flex flex-col space-y-1 py-1">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <MotionLink
                key={item.name}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={onItemClick}
                className={cn(
                  'relative z-10 flex items-center rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'border-nice-blue-600 text-nice-blue-800 font-semibold' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                )}
              >
                {item.name}
              </MotionLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
