'use client'

import { useRef } from 'react'
import type React from 'react'
import { gsap, registerMotionPlugins } from '../../motion/gsap'
import { useGSAP } from '../../motion/gsap/useGsap'

export function ReversibleReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const element = root.current
    if (!element) return
    const media = gsap.matchMedia()
    try {
      registerMotionPlugins()
      media.add('(prefers-reduced-motion: reduce)', () => gsap.set(element, { autoAlpha: 1, clearProps: 'all' }))
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const compact = window.matchMedia('(max-width: 767px)').matches
        const tween = gsap.fromTo(element,
          { autoAlpha: 0, y: compact ? 9 : 18, filter: 'blur(1px)' },
          {
            autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: compact ? 0.24 : 0.36, ease: 'power2.out',
            scrollTrigger: { trigger: element, start: compact ? 'top 97%' : 'top 92%', end: 'bottom 12%', toggleActions: 'play reverse play reverse', invalidateOnRefresh: true },
          },
        )
        return () => { tween.scrollTrigger?.kill(); tween.kill(); gsap.set(element, { clearProps: 'all' }) }
      })
      return () => media.revert()
    } catch {
      gsap.set(element, { autoAlpha: 1, clearProps: 'all' })
      media.revert()
      return
    }
  }, { scope: root, dependencies: [], revertOnUpdate: true })

  return <div ref={root} className={className}>{children}</div>
}
