import { gsap, ScrollTrigger } from '../gsap'
import { MOTION_BREAKPOINTS, MOTION_DURATION, MOTION_EASE, getMotionProfile } from '../gsap/config'

export interface RevealOptions {
  fromY?: number
  duration?: number
  start?: string
  once?: boolean
}

/** Desktop gets a single viewport reveal; mobile content remains immediately visible. */
export function createScrollReveal(target: gsap.TweenTarget, scroller?: Element, options: RevealOptions = {}) {
  const media = gsap.matchMedia()
  const profile = getMotionProfile({ reducedMotion: false, compact: false })
  media.add(`(prefers-reduced-motion: no-preference) and ${MOTION_BREAKPOINTS.desktop}`, () => gsap.fromTo(target,
    { autoAlpha: 0, y: options.fromY ?? profile.revealDistance },
    { autoAlpha: 1, y: 0, duration: options.duration ?? MOTION_DURATION.medium, ease: MOTION_EASE.enter,
        scrollTrigger: { trigger: target as gsap.DOMTarget, scroller, start: options.start ?? 'top 94%', once: options.once ?? true } },
  ))
  media.add(`(prefers-reduced-motion: no-preference) and (max-width: 1023px)`, () => gsap.fromTo(target,
    { autoAlpha: 0, y: 7 }, { autoAlpha: 1, y: 0, duration: MOTION_DURATION.short, ease: MOTION_EASE.standard },
  ))
  media.add('(prefers-reduced-motion: reduce)', () => gsap.set(target, { autoAlpha: 1, clearProps: 'transform' }))
  return () => media.revert()
}

export function createStaggerReveal(targets: gsap.TweenTarget, trigger: Element, scroller?: Element, options: RevealOptions & { stagger?: number } = {}) {
  const media = gsap.matchMedia()
  const profile = getMotionProfile({ reducedMotion: false, compact: false })
  media.add(`(prefers-reduced-motion: no-preference) and ${MOTION_BREAKPOINTS.desktop}`, () => gsap.fromTo(targets,
    { autoAlpha: 0, y: options.fromY ?? profile.revealDistance },
    { autoAlpha: 1, y: 0, duration: options.duration ?? MOTION_DURATION.medium, stagger: options.stagger ?? profile.stagger,
      ease: MOTION_EASE.enter, scrollTrigger: { trigger, scroller, start: options.start ?? 'top 94%', once: options.once ?? true } },
  ))
  media.add(`(prefers-reduced-motion: no-preference) and (max-width: 1023px)`, () => gsap.fromTo(targets,
    { autoAlpha: 0, y: 7 }, { autoAlpha: 1, y: 0, duration: MOTION_DURATION.short, stagger: 0.02, ease: MOTION_EASE.standard },
  ))
  media.add('(prefers-reduced-motion: reduce)', () => gsap.set(targets, { autoAlpha: 1, clearProps: 'transform' }))
  return () => media.revert()
}

export function createScrollProgress(target: Element, onProgress: (progress: number) => void, scroller?: Element) {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined
  const trigger = ScrollTrigger.create({ trigger: target, scroller, start: 'top bottom', end: 'bottom top', onUpdate: (self) => onProgress(self.progress) })
  return () => trigger.kill()
}
