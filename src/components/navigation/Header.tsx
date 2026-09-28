'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, Plus } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { Sidebar } from './Sidebar'
import { gsap } from '../../motion/gsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const backdrop = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const closing = useRef(false)

  const closeMobileMenu = () => {
    if (closing.current) return
    closing.current = true
    if (!panel.current || !backdrop.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMobileMenuOpen(false)
      return
    }
    gsap.timeline({ onComplete: () => setMobileMenuOpen(false) })
      .to(panel.current, { x: -16, autoAlpha: 0, duration: MOTION_DURATION.short, ease: MOTION_EASE.exit }, 0)
      .to(backdrop.current, { autoAlpha: 0, duration: MOTION_DURATION.short, ease: MOTION_EASE.exit }, 0)
  }

  useEffect(() => {
    if (!mobileMenuOpen) { closing.current = false; return }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const media = gsap.matchMedia()
    if (backdrop.current && panel.current) {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(backdrop.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: MOTION_DURATION.short, ease: MOTION_EASE.standard })
        gsap.fromTo(panel.current, { x: -18, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: MOTION_DURATION.standard, ease: MOTION_EASE.enter })
      })
      media.add('(prefers-reduced-motion: reduce)', () => gsap.set([backdrop.current, panel.current], { autoAlpha: 1, clearProps: 'transform' }))
    }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeMobileMenu() }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      media.revert()
    }
  }, [mobileMenuOpen])

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

          <Link href="/dashboard" className="flex items-center space-x-2 md:hidden" aria-label="NiCE Club dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/NiCE-Logo-Animated-transparent.webp"
              alt="NiCE Club Rwanda logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="font-bold text-slate-900 text-sm tracking-tight">NiCE Club</span>
          </Link>

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
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Main navigation">
          <div
            ref={backdrop}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          <div ref={panel} className="relative z-10 h-full w-72 max-w-[80vw] shadow-2xl">
            <Sidebar onClose={closeMobileMenu} />
          </div>
        </div>
      )}
    </>
  )
}
