'use client'

import React, { useRef } from 'react'
import { gsap, registerMotionPlugins } from './index'
import { useGSAP } from './useGsap'
import { MOTION_BREAKPOINTS, MOTION_EASE } from './config'

/** Reveals a form section the first time it enters the viewport. */
export function FormSectionReveal({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  const section = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const element = section.current
    if (!element) return
    registerMotionPlugins()

    const scroller = element.closest('[data-scroll-container]') || undefined
    const media = gsap.matchMedia(element)
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const compact = window.matchMedia(MOTION_BREAKPOINTS.mobile).matches
      gsap.fromTo(element,
        { autoAlpha: 0, y: compact ? 10 : 18, scale: compact ? 0.995 : 0.99, transformOrigin: 'center top' },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: compact ? 0.26 : 0.38,
          ease: MOTION_EASE.enter,
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: element, scroller, start: compact ? 'top 96%' : 'top 92%', once: true },
        },
      )
    })
    media.add('(prefers-reduced-motion: reduce)', () => gsap.set(element, { clearProps: 'all' }))
    return () => media.revert()
  }, { scope: section, dependencies: [], revertOnUpdate: true })

  return <div ref={section} className={className} data-form-scroll-reveal>{children}</div>
}

/** Adds a brief lift to text fields while preserving native focus and validation styles. */
export function FormFieldsMotion({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  const fields = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const element = fields.current
    if (!element) return

    const media = gsap.matchMedia(element)
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const isTextField = (target: EventTarget | null): target is HTMLElement =>
        target instanceof HTMLElement
        && target.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), textarea, select')

      const onFocus = (event: FocusEvent) => {
        if (!isTextField(event.target)) return
        gsap.killTweensOf(event.target)
        gsap.to(event.target, { y: -1, scale: 1.006, duration: 0.16, ease: 'power2.out', overwrite: 'auto' })
      }
      const onBlur = (event: FocusEvent) => {
        if (!isTextField(event.target)) return
        gsap.killTweensOf(event.target)
        gsap.to(event.target, { y: 0, scale: 1, duration: 0.18, ease: 'power2.out', overwrite: 'auto' })
      }

      element.addEventListener('focusin', onFocus)
      element.addEventListener('focusout', onBlur)
      return () => {
        element.removeEventListener('focusin', onFocus)
        element.removeEventListener('focusout', onBlur)
        gsap.killTweensOf(element.querySelectorAll('input, textarea, select'))
      }
    })
    return () => media.revert()
  }, { scope: fields, dependencies: [], revertOnUpdate: true })

  return <div ref={fields} className={className} data-form-fields-motion>{children}</div>
}
