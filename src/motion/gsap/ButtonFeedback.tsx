'use client'

import React, { useEffect } from 'react'
import { gsap } from './index'
import { MOTION_DURATION, MOTION_EASE } from './config'

const SELECTOR = 'button:not(:disabled):not([aria-disabled="true"]), [role="button"]:not([aria-disabled="true"]), input[type="submit"]:not(:disabled), input[type="button"]:not(:disabled), input[type="reset"]:not(:disabled)'

/** Global, delegated click acknowledgement for shared and native buttons. */
export function ButtonFeedback({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const active = new Set<HTMLElement>()
    const lastPressAt = new WeakMap<HTMLElement, number>()
    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const getButton = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>(SELECTOR) : null

    const press = (button: HTMLElement | null) => {
      if (!button || reducedMotion() || button.dataset.motionFeedback === 'off' || button.dataset.motionPressed === 'true') return
      button.dataset.motionPressed = 'true'
      active.add(button)
      lastPressAt.set(button, performance.now())
      gsap.to(button, { scale: 0.965, duration: MOTION_DURATION.micro, ease: MOTION_EASE.standard, overwrite: true })
    }

    const release = (button: HTMLElement) => {
      if (!active.delete(button)) return
      delete button.dataset.motionPressed
      gsap.to(button, {
        scale: 1,
        duration: reducedMotion() ? 0 : MOTION_DURATION.standard,
        ease: 'back.out(2.1)',
        overwrite: true,
        clearProps: 'scale',
      })
    }

    const onPointerDown = (event: PointerEvent) => press(getButton(event.target))
    const onPointerUp = () => active.forEach(release)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') press(getButton(event.target))
    }
    const onKeyUp = (event: KeyboardEvent) => {
      const button = getButton(event.target)
      if (button) release(button)
    }
    const onClick = (event: MouseEvent) => {
      const button = getButton(event.target)
      if (!button || active.has(button) || reducedMotion() || button.dataset.motionFeedback === 'off') return
      if (performance.now() - (lastPressAt.get(button) ?? 0) < 500) return
      // Keyboard and assistive-technology activation have no pointer-down event.
      gsap.fromTo(button, { scale: 0.975 }, { scale: 1, duration: MOTION_DURATION.standard, ease: 'back.out(2.1)', overwrite: true, clearProps: 'scale' })
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('pointerup', onPointerUp, true)
    window.addEventListener('pointercancel', onPointerUp, true)
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('keyup', onKeyUp, true)
    document.addEventListener('click', onClick, true)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointerup', onPointerUp, true)
      window.removeEventListener('pointercancel', onPointerUp, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('keyup', onKeyUp, true)
      document.removeEventListener('click', onClick, true)
      active.forEach((button) => {
        delete button.dataset.motionPressed
        gsap.killTweensOf(button)
        gsap.set(button, { clearProps: 'scale' })
      })
      active.clear()
    }
  }, [])

  return <>{children}</>
}
