'use client'

import { useRef } from 'react'
import { Flip, gsap } from './index'
import { MOTION_DURATION, MOTION_EASE } from './config'
import { useGSAP } from './useGsap'

/** Capture a layout before React changes it, then animate the new layout after commit. */
export function useFlipLayout(changeKey: string, selector: string) {
  const state = useRef<ReturnType<typeof Flip.getState> | null>(null)

  const capture = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    state.current = Flip.getState(document.querySelectorAll(selector))
  }

  useGSAP(() => {
    const previous = state.current
    state.current = null
    if (!previous || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    Flip.from(previous, {
      duration: MOTION_DURATION.medium,
      ease: MOTION_EASE.smooth,
      simple: true,
      absolute: true,
      nested: true,
      onEnter: (elements) => gsap.fromTo(elements, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: MOTION_DURATION.standard, ease: MOTION_EASE.enter, clearProps: 'all' }),
      onLeave: (elements) => gsap.to(elements, { autoAlpha: 0, scale: 0.96, duration: MOTION_DURATION.short, ease: MOTION_EASE.exit }),
    })
  }, { dependencies: [changeKey], revertOnUpdate: true })

  return capture
}
