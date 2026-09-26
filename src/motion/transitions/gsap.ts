import { gsap } from '../gsap'
import { MOTION_DURATION, MOTION_EASE } from '../gsap/config'

export function fadeInElement(target: gsap.TweenTarget, duration = MOTION_DURATION.standard) {
  return gsap.fromTo(target, { autoAlpha: 0 }, { autoAlpha: 1, duration, ease: MOTION_EASE.enter, clearProps: 'opacity,visibility' })
}

export function fadeOutElement(target: gsap.TweenTarget, duration = MOTION_DURATION.short) {
  return gsap.to(target, { autoAlpha: 0, duration, ease: MOTION_EASE.exit })
}

export function scaleInElement(target: gsap.TweenTarget, duration = MOTION_DURATION.standard) {
  return gsap.fromTo(target, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration, ease: MOTION_EASE.enter, clearProps: 'transform,opacity,visibility' })
}

export function slideInElement(target: gsap.TweenTarget, direction: -1 | 1 = 1, duration = MOTION_DURATION.standard) {
  return gsap.fromTo(target, { autoAlpha: 0, x: 12 * direction }, { autoAlpha: 1, x: 0, duration, ease: MOTION_EASE.enter, clearProps: 'transform,opacity,visibility' })
}
