import { gsap, registerMotionPlugins } from '../gsap'
import { MOTION_BREAKPOINTS } from '../gsap/config'

export interface HorizontalScrollOptions {
  container: HTMLElement
  track: HTMLElement
  scroller?: Element
  start?: string
  scrub?: number | boolean
  onProgress?: (progress: number) => void
}

/** Pin and translate a wide track on desktop; mobile/reduced-motion stays in document flow. */
export function createHorizontalScroll({ container, track, scroller, start = 'top top', scrub = 0.7, onProgress }: HorizontalScrollOptions) {
  registerMotionPlugins()
  const media = gsap.matchMedia()

  media.add(`(prefers-reduced-motion: no-preference) and ${MOTION_BREAKPOINTS.desktop}`, () => {
    const distance = () => Math.max(0, track.scrollWidth - container.clientWidth)
    if (!distance()) return
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        pin: container,
        scroller,
        start,
        end: () => `+=${distance()}`,
        scrub,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => onProgress?.(self.progress),
      },
    })
    return () => tween.kill()
  })

  media.add(`(prefers-reduced-motion: reduce), (max-width: 1023px)`, () => gsap.set(track, { clearProps: 'transform' }))
  return () => media.revert()
}
