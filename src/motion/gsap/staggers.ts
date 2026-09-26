import { MOTION_EASE } from './config'

export const dashboardStagger = {
  each: 0.055,
  from: 'start' as const,
  ease: MOTION_EASE.standard,
}

export const editorialStagger = {
  each: 0.09,
  from: 'start' as const,
  ease: MOTION_EASE.enter,
}
