import { gsap } from '../gsap'
import { MOTION_DURATION, MOTION_EASE } from '../gsap/config'

/** Bind a restrained hover lift to a small set of intentional interactive targets. */
export function bindHoverLift(target: Element, { y = -2, scale = 1.005 } = {}) {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined
  const enter = () => gsap.to(target, { y, scale, duration: MOTION_DURATION.micro, ease: MOTION_EASE.standard, overwrite: 'auto' })
  const leave = () => gsap.to(target, { y: 0, scale: 1, duration: MOTION_DURATION.short, ease: MOTION_EASE.standard, overwrite: 'auto' })
  target.addEventListener('pointerenter', enter)
  target.addEventListener('pointerleave', leave)
  target.addEventListener('focusin', enter)
  target.addEventListener('focusout', leave)
  return () => {
    target.removeEventListener('pointerenter', enter)
    target.removeEventListener('pointerleave', leave)
    target.removeEventListener('focusin', enter)
    target.removeEventListener('focusout', leave)
    gsap.killTweensOf(target)
    gsap.set(target, { clearProps: 'transform' })
  }
}
