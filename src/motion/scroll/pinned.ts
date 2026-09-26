import { gsap, registerMotionPlugins } from '../gsap'
import { MOTION_BREAKPOINTS, MOTION_DURATION, MOTION_EASE } from '../gsap/config'

export interface PinnedStoryOptions {
  trigger: Element
  pin: Element
  steps: Element[]
  scroller?: Element
  start?: string
  viewportLengths?: number
  onProgress?: (progress: number, activeStep: number) => void
}

/** Pin a story scene on large screens and advance its steps with scroll progress. */
export function createPinnedStory({ trigger, pin, steps, scroller, start = 'top top', viewportLengths = 1, onProgress }: PinnedStoryOptions) {
  registerMotionPlugins()
  const media = gsap.matchMedia()
  if (steps.length < 2) return () => undefined

  media.add(`(prefers-reduced-motion: no-preference) and ${MOTION_BREAKPOINTS.desktop}`, () => {
    gsap.set(steps, { autoAlpha: 0, y: 18 })
    gsap.set(steps[0], { autoAlpha: 1, y: 0 })

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        pin,
        scroller,
        start,
        end: () => `+=${Math.round(window.innerHeight * viewportLengths * (steps.length - 1))}`,
        scrub: 0.55,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => onProgress?.(self.progress, Math.min(steps.length - 1, Math.floor(self.progress * steps.length))),
      },
      defaults: { ease: MOTION_EASE.smooth, duration: MOTION_DURATION.standard },
    })

    steps.slice(1).forEach((step, index) => {
      const previous = steps[index]
      const position = index
      timeline.to(previous, { autoAlpha: 0, y: -18 }, position)
        .fromTo(step, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0 }, position + 0.12)
    })

    return () => timeline.kill()
  })

  media.add(`(prefers-reduced-motion: reduce), (max-width: 1023px)`, () => {
    gsap.set(steps, { clearProps: 'all' })
  })

  return () => media.revert()
}
