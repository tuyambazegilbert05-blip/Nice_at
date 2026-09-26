'use client'

import React, { useRef } from 'react'
import { gsap } from './index'
import { useGSAP } from './useGsap'

/** A short, reduced-motion-aware door-opening entrance for a single surface. */
export function DoorReveal({ children, className = '', delay = 0 }: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const panel = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const element = panel.current
    if (!element) return

    const media = gsap.matchMedia(element)
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const mobile = window.matchMedia('(max-width: 639px)').matches
      gsap.fromTo(element,
        {
          autoAlpha: 0,
          rotationY: mobile ? -5 : -16,
          y: mobile ? 12 : 18,
          transformPerspective: mobile ? 700 : 1100,
          transformOrigin: 'left center',
        },
        {
          autoAlpha: 1,
          rotationY: 0,
          y: 0,
          delay,
          duration: mobile ? 0.46 : 0.64,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility',
        },
      )
    })
    media.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(element, { clearProps: 'all' })
    })
    return () => media.revert()
  }, { scope: panel, dependencies: [delay], revertOnUpdate: true })

  return <div ref={panel} className={className} data-gsap-door-reveal>{children}</div>
}
