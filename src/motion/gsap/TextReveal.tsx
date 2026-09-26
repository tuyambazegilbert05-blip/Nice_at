'use client'

import React, { useRef } from 'react'
import { gsap, SplitText } from './index'
import { MOTION_DURATION, MOTION_EASE } from './config'
import { useGSAP } from './useGsap'

/** Selective word reveal. SplitText reverts its generated DOM when the GSAP context is disposed. */
export function TextReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLHeadingElement>(null)
  useGSAP(() => {
    const element = root.current
    if (!element) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const split = SplitText.create(element, { type: 'words', aria: 'auto' })
      gsap.from(split.words, { autoAlpha: 0, yPercent: 35, duration: MOTION_DURATION.standard, stagger: 0.035, ease: MOTION_EASE.enter, clearProps: 'all' })
      return () => split.revert()
    })
    return () => media.revert()
  }, { scope: root, dependencies: [], revertOnUpdate: true })

  return <h1 ref={root} className={className}>{children}</h1>
}
