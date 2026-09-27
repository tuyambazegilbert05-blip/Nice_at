'use client'

import React from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { NavLinks } from './NavLinks'
import { cn } from '../../utils/cn'

export interface SidebarProps {
  className?: string
  onClose?: () => void
}

export function Sidebar({ className = '', onClose }: SidebarProps) {
  return (
    <aside className={cn('w-64 border-r border-slate-200 bg-white flex flex-col justify-between h-full select-none', className)}>
      <div>
        {/* Brand Logo Header with live animated GIF */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center space-x-2.5" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/NiCE-Logo-Animated-transparent.webp"
              alt="NiCE Club Rwanda Logo"
              className="w-9 h-9 object-contain rounded-lg drop-shadow-sm"
            />
            <div>
              <div className="text-slate-900 font-bold text-sm tracking-tight leading-none">NiCE Club</div>
              <div className="text-nice-blue-600 text-[10px] font-bold tracking-widest uppercase mt-0.5">Attendance OS</div>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation items */}
        <div className="py-5 px-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Main Menu</div>
          <NavLinks onItemClick={onClose} />
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
        <p className="font-bold text-slate-800 text-xs">NiCE Club Rwanda</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Nuclear is Clean Energy</p>
      </div>
    </aside>
  )
}
