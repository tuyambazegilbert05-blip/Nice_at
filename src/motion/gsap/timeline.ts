import { gsap } from './index'
import { MOTION_DURATION, MOTION_EASE } from './config'

export const motionDefaults = { ease: MOTION_EASE.standard, duration: MOTION_DURATION.standard, reducedDuration: 0 }

export function createMotionTimeline(onComplete?: () => void) {
  return gsap.timeline({ defaults: { ease: MOTION_EASE.standard, duration: MOTION_DURATION.standard }, onComplete })
}

export function createPageTimeline(targets?: gsap.TweenTarget, reducedMotion = false) {
  const timeline = createMotionTimeline()
  if (targets) timeline.fromTo(targets,
    { autoAlpha: 0, y: reducedMotion ? 0 : 8 },
    { autoAlpha: 1, y: 0, duration: reducedMotion ? 0 : MOTION_DURATION.short, clearProps: 'transform,opacity,visibility' },
  )
  return timeline
}

export function revealTimeline(targets: gsap.TweenTarget, { reducedMotion = false, stagger = 0.055 } = {}) {
  return createMotionTimeline().fromTo(targets,
    { autoAlpha: 0, y: reducedMotion ? 0 : 12 },
    { autoAlpha: 1, y: 0, duration: reducedMotion ? 0 : MOTION_DURATION.medium, stagger: reducedMotion ? 0 : stagger },
  )
}
