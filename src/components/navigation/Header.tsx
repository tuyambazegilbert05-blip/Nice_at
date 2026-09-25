'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, Plus, Sparkles } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { Sidebar } from './Sidebar'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-nice-blue-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">NiCE Club</span>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500">Live Operating Center</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/sessions/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-nice-blue-500 hover:bg-nice-blue-600 text-xs font-semibold text-white transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </Link>

          <UserMenu />
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
