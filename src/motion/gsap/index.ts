import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { Observer } from 'gsap/Observer'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { SplitText } from 'gsap/SplitText'
import { MOTION_DEBUG, MOTION_DURATION, MOTION_EASE } from './config'

let registered = false

export function registerMotionPlugins() {
  if (registered) return
  gsap.registerPlugin(ScrollTrigger, Flip, Observer, MotionPathPlugin, SplitText)
  gsap.config({ autoSleep: 60 })
  gsap.defaults({ duration: MOTION_DURATION.standard, ease: MOTION_EASE.standard, overwrite: 'auto' })
  if (MOTION_DEBUG && typeof window !== 'undefined') console.info('[NiCE Motion] GSAP plugins registered')
  registered = true
}

export { gsap, ScrollTrigger, Flip, Observer, MotionPathPlugin, SplitText }
export { MOTION_BREAKPOINTS, MOTION_DURATION, MOTION_EASE, getMotionProfile } from './config'
