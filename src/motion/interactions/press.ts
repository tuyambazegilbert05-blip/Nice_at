import { gsap } from '../gsap'
import { MOTION_DURATION, MOTION_EASE } from '../gsap/config'

/** Short press feedback for a primary action, with pointer and keyboard cleanup. */
export function bindPressFeedback(target: HTMLElement) {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined
  const press = () => gsap.to(target, { scale: 0.98, duration: MOTION_DURATION.micro, ease: MOTION_EASE.standard, overwrite: 'auto' })
  const release = () => gsap.to(target, { scale: 1, duration: MOTION_DURATION.short, ease: MOTION_EASE.standard, overwrite: 'auto' })
  const onKeyDown = (event: KeyboardEvent) => { if (event.key === ' ' || event.key === 'Enter') press() }
  target.addEventListener('pointerdown', press)
  target.addEventListener('pointerup', release)
  target.addEventListener('pointercancel', release)
  target.addEventListener('pointerleave', release)
  target.addEventListener('keydown', onKeyDown)
  target.addEventListener('keyup', release)
  return () => {
    target.removeEventListener('pointerdown', press)
    target.removeEventListener('pointerup', release)
    target.removeEventListener('pointercancel', release)
    target.removeEventListener('pointerleave', release)
    target.removeEventListener('keydown', onKeyDown)
    target.removeEventListener('keyup', release)
    gsap.killTweensOf(target)
    gsap.set(target, { clearProps: 'transform' })
  }
}
