'use client'

import React, { useRef } from 'react'
import { gsap } from '../../motion/gsap'
import { useGSAP } from '../../motion/gsap/useGsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'

export function AnimatedNumber({ value, locale = 'en-RW' }: { value: number; locale?: string }) {
  const numberRef = useRef<HTMLSpanElement>(null)
  const formatted = value.toLocaleString(locale)

  useGSAP(() => {
    const node = numberRef.current
    if (!node) return
    const finalValue = Number.isFinite(value) ? value : 0
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (finalValue <= 0) {
        node.textContent = finalValue.toLocaleString(locale)
        return
      }
      const progress = { value: 0 }
      gsap.to(progress, {
        value: finalValue,
        duration: MOTION_DURATION.long,
        ease: MOTION_EASE.standard,
        onUpdate: () => { node.textContent = Math.round(progress.value).toLocaleString(locale) },
      })
    })
    media.add('(prefers-reduced-motion: reduce)', () => { node.textContent = finalValue.toLocaleString(locale) })
    return () => media.revert()
  }, { dependencies: [value, locale], revertOnUpdate: true })

  return <span ref={numberRef} aria-label={formatted} aria-live="off">{formatted}</span>
}
