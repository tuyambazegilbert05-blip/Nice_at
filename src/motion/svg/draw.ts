import { gsap } from '../gsap'
import { MOTION_DURATION, MOTION_EASE } from '../gsap/config'

/** Draw SVG stroke paths without requiring the premium DrawSVG plugin. */
export function drawSvgPaths(target: gsap.TweenTarget, options: { duration?: number; stagger?: number; reverse?: boolean } = {}) {
  const paths = gsap.utils.toArray<SVGGeometryElement>(target)
  const timeline = gsap.timeline()
  for (const path of paths) {
    const length = path.getTotalLength()
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: options.reverse ? 0 : length })
  }
  timeline.to(paths, {
    strokeDashoffset: options.reverse ? (index: number, target: SVGGeometryElement) => -target.getTotalLength() : 0,
    duration: options.duration ?? MOTION_DURATION.medium,
    stagger: options.stagger ?? 0.035,
    ease: MOTION_EASE.standard,
  })
  return timeline
}
