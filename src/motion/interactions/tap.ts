import { Observer } from '../gsap'

/** Optional touch/pointer gesture observer for intentional story sections. */
export function observeSectionGestures(target: Element, onGesture: (direction: 1 | -1) => void) {
  const observer = Observer.create({
    target,
    type: 'touch,pointer',
    onUp: () => onGesture(1),
    onDown: () => onGesture(-1),
    tolerance: 16,
    preventDefault: false,
  })
  return () => observer.kill()
}
