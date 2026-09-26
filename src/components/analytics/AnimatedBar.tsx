'use client'

import React, { useRef } from 'react'
import { gsap } from '../../motion/gsap'
import { useGSAP } from '../../motion/gsap/useGsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'

export function AnimatedBar({ percentage, className = 'bg-nice-blue-500', label }: {
  percentage: number
  className?: string
  label?: string
}) {
  const bar = useRef<HTMLDivElement>(null)
  const value = Math.min(100, Math.max(0, percentage))

  useGSAP(() => {
    const element = bar.current
    if (!element) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(element, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: value / 100, duration: MOTION_DURATION.medium, ease: MOTION_EASE.standard, delay: MOTION_DURATION.micro })
    })
    media.add('(prefers-reduced-motion: reduce)', () => { gsap.set(element, { scaleX: value / 100 }) })
    return () => media.revert()
  }, { dependencies: [value], revertOnUpdate: true })

  return <div className="h-full w-full overflow-hidden rounded-full" role={label ? 'img' : undefined} aria-label={label}><div ref={bar} className={`h-full rounded-full ${className}`} style={{ width: '100%', transform: `scaleX(${value / 100})`, transformOrigin: 'left center' }} /></div>
}
