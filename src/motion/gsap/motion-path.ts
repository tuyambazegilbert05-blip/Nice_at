import { gsap, MotionPathPlugin } from './index'
import { MOTION_DURATION, MOTION_EASE } from './config'

export interface MotionPathOptions {
  duration?: number
  ease?: string
  repeat?: number
  autoRotate?: boolean
  paused?: boolean
}

/** Animate an element along a meaningful SVG path; kill the returned tween on teardown. */
export function createMotionPathTween(target: gsap.TweenTarget, path: string | SVGPathElement | Array<{ x: number; y: number }>, options: MotionPathOptions = {}) {
  return gsap.to(target, {
    duration: options.duration ?? MOTION_DURATION.long,
    ease: options.ease ?? 'none',
    repeat: options.repeat ?? 0,
    paused: options.paused ?? false,
    motionPath: { path, ...(typeof path === 'string' || path instanceof SVGPathElement ? { align: path } : {}), autoRotate: options.autoRotate ?? false },
  })
}

export { MotionPathPlugin }
