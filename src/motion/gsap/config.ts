/** Shared motion scale. Durations are seconds; use tokens rather than local timings. */
export const MOTION_DURATION = {
  micro: 0.12,
  short: 0.18,
  standard: 0.28,
  medium: 0.42,
  long: 0.64,
} as const

export const MOTION_EASE = {
  standard: 'power2.out',
  enter: 'power3.out',
  exit: 'power2.in',
  smooth: 'power2.inOut',
  energy: 'sine.inOut',
} as const

export const MOTION_BREAKPOINTS = {
  mobile: '(max-width: 639px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
} as const

export interface MotionProfile {
  durationScale: number
  revealDistance: number
  stagger: number
  scrollEffects: boolean
}

/** Pure profile resolver; safe to call from server code and unit tests. */
export function getMotionProfile({ reducedMotion, compact }: { reducedMotion: boolean; compact: boolean }): MotionProfile {
  if (reducedMotion) return { durationScale: 0, revealDistance: 0, stagger: 0, scrollEffects: false }
  if (compact) return { durationScale: 0.72, revealDistance: 7, stagger: 0.025, scrollEffects: false }
  return { durationScale: 1, revealDistance: 14, stagger: 0.055, scrollEffects: true }
}

export const MOTION_DEBUG = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_MOTION_DEBUG === 'true'
