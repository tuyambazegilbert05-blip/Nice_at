'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../utils/cn'

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

  return (
    <nav className="flex flex-col space-y-1">
      {NAVIGATION_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500 rounded-l-none'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            )}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
