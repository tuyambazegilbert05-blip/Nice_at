'use client'

import React, { useRef } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from './index'
import { useGSAP } from './useGsap'
import { MOTION_DURATION, MOTION_EASE, getMotionProfile } from './config'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useGSAP(() => {
    const element = root.current
    if (!element) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const compact = window.matchMedia('(max-width: 639px)').matches
      const profile = getMotionProfile({ reducedMotion: false, compact })
      gsap.fromTo(element, { autoAlpha: 0, y: profile.revealDistance * 0.55 }, { autoAlpha: 1, y: 0, duration: MOTION_DURATION.short * profile.durationScale, ease: MOTION_EASE.enter, clearProps: 'transform,opacity,visibility' })
    })
    media.add('(prefers-reduced-motion: reduce)', () => gsap.set(element, { clearProps: 'all' }))
    return () => media.revert()
  }, { scope: root, dependencies: [pathname], revertOnUpdate: true })

  return <div ref={root} data-page-transition>{children}</div>
}
