'use client'

import React, { useRef } from 'react'
import { gsap } from './index'
import { MOTION_DURATION, MOTION_EASE, getMotionProfile } from './config'
import { useGSAP } from './useGsap'

export function StepTransition({ step, direction, children, className = '' }: {
  step: number
  direction: -1 | 1
  children: React.ReactNode
  className?: string
}) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const element = root.current
    if (!element) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const compact = window.matchMedia('(max-width: 639px)').matches
      const profile = getMotionProfile({ reducedMotion: false, compact })
      gsap.fromTo(element,
        { autoAlpha: 0, x: direction * (profile.revealDistance + 2) },
        { autoAlpha: 1, x: 0, duration: MOTION_DURATION.short * profile.durationScale, ease: MOTION_EASE.enter, clearProps: 'transform,opacity,visibility' },
      )
    })
    media.add('(prefers-reduced-motion: reduce)', () => gsap.set(element, { clearProps: 'all' }))
    return () => media.revert()
  }, { scope: root, dependencies: [step, direction], revertOnUpdate: true })

  return <div ref={root} className={className} aria-live="polite">{children}</div>
}
