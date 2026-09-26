import test from 'node:test'
import assert from 'node:assert/strict'
import { getMotionProfile, MOTION_DURATION } from '../../src/motion/gsap/config.ts'

test('motion durations are a monotonic scale', () => {
  const durations = Object.values(MOTION_DURATION)
  assert.deepEqual(durations, [...durations].sort((a, b) => a - b))
  assert.ok(durations.every((duration) => duration > 0))
})

test('reduced motion removes travel, stagger, and scroll effects', () => {
  assert.deepEqual(getMotionProfile({ reducedMotion: true, compact: false }), {
    durationScale: 0,
    revealDistance: 0,
    stagger: 0,
    scrollEffects: false,
  })
})

test('compact motion is shorter and avoids scroll effects', () => {
  const compact = getMotionProfile({ reducedMotion: false, compact: true })
  const desktop = getMotionProfile({ reducedMotion: false, compact: false })
  assert.ok(compact.durationScale < desktop.durationScale)
  assert.ok(compact.revealDistance < desktop.revealDistance)
  assert.equal(compact.scrollEffects, false)
  assert.equal(desktop.scrollEffects, true)
})
