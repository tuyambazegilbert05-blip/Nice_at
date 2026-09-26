import { gsap, registerMotionPlugins } from '../gsap'
import { MOTION_BREAKPOINTS, MOTION_DURATION, MOTION_EASE } from '../gsap/config'

/** Subtle desktop-only parallax. The matchMedia context owns its ScrollTrigger cleanup. */
export function createParallax(target: Element, { distance = 18, scroller }: { distance?: number; scroller?: Element } = {}) {
  registerMotionPlugins()
  const media = gsap.matchMedia()
  media.add(`(prefers-reduced-motion: no-preference) and ${MOTION_BREAKPOINTS.desktop}`, () => gsap.fromTo(target,
    { y: -distance },
    { y: distance, ease: MOTION_EASE.smooth, duration: MOTION_DURATION.long, scrollTrigger: { trigger: target, scroller, start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
  ))
  return () => media.revert()
}
