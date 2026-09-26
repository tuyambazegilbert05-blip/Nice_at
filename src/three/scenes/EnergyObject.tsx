'use client'

import React, { useRef } from 'react'
import * as THREE from 'three'
import { gsap } from '../../motion/gsap'
import { createMotionPathTween } from '../../motion/gsap/motion-path'
import { MOTION_DURATION } from '../../motion/gsap/config'
import { useGSAP } from '../../motion/gsap/useGsap'
import { createEnergyCamera, createEnergyRenderer } from '../core'
import { createAuraRing, createEnergyParticle, createNucleus, pulseObject } from '../energy'

export function EnergyObject({ className = 'h-40 w-40', onUnavailable }: {
  className?: string
  onUnavailable?: () => void
}) {
  const mount = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const host = mount.current
    if (!host) return

    let renderer: THREE.WebGLRenderer | null = null
    let scene: THREE.Scene | null = null
    let animations: gsap.core.Animation[] = []
    let frame = 0
    let resizeObserver: ResizeObserver | null = null
    let visibilityObserver: IntersectionObserver | null = null
    let onVisibilityChange: (() => void) | null = null
    let onContextLost: (() => void) | null = null
    const cleanup = () => {
      if (onVisibilityChange) document.removeEventListener('visibilitychange', onVisibilityChange)
      if (renderer && onContextLost) renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      visibilityObserver?.disconnect()
      resizeObserver?.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      animations.forEach((animation) => animation.kill())
      scene?.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      renderer?.dispose()
      renderer?.forceContextLoss()
      renderer?.domElement.remove()
      renderer = null
    }
    try {
      renderer = createEnergyRenderer(host)
      const width = Math.max(1, host.clientWidth)
      const height = Math.max(1, host.clientHeight)
      const experience = new THREE.Scene()
      scene = experience
      const camera = createEnergyCamera(width, height)
      const root = new THREE.Group()
      experience.add(root)
      experience.add(new THREE.AmbientLight(0xffffff, 1.8))
      const keyLight = new THREE.PointLight(0x38bdf8, 14, 8)
      keyLight.position.set(1.5, 1.8, 2.4)
      experience.add(keyLight)

      const nucleus = createNucleus()
      root.add(nucleus)

      const orbitSpecs = [
        { radius: 1.12, flatten: 0.4, rotation: [0.52, 0.18, -0.18] },
        { radius: 0.98, flatten: 0.36, rotation: [-0.62, -0.3, 0.42] },
        { radius: 0.88, flatten: 0.32, rotation: [0.08, 0.72, 0.35] },
      ] as const

      for (const [index, spec] of orbitSpecs.entries()) {
        const orbit = new THREE.Group()
        orbit.rotation.set(spec.rotation[0], spec.rotation[1], spec.rotation[2])
        root.add(orbit)
        const { line, points } = createAuraRing(spec.radius, spec.flatten, index === 1 ? 0x059669 : 0x38bdf8)
        orbit.add(line)
        const particle = createEnergyParticle(index === 2 ? 0xf59e0b : 0x10b981)
        orbit.add(particle)
        const motionPath = points.map((point) => ({ x: point.x, y: point.y }))
        animations.push(createMotionPathTween(particle.position, motionPath, {
          duration: 7 + index * 1.7,
          repeat: -1,
        }))
      }

      animations.push(
        gsap.to(root.rotation, { y: `+=${Math.PI * 2}`, z: `+=${Math.PI * 2}`, duration: MOTION_DURATION.long * 32, repeat: -1, ease: 'none' }),
        pulseObject(nucleus),
      )

      resizeObserver = new ResizeObserver(() => {
        if (!host.clientWidth || !host.clientHeight || !renderer) return
        camera.aspect = host.clientWidth / host.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(host.clientWidth, host.clientHeight, false)
      })
      resizeObserver.observe(host)

      let inViewport = true
      let visible = document.visibilityState === 'visible'
      const fail = () => {
        if (frame) window.cancelAnimationFrame(frame)
        frame = 0
        onUnavailable?.()
      }
      onContextLost = () => fail()
      renderer.domElement.addEventListener('webglcontextlost', onContextLost)
      const draw = () => {
        if (!visible || !renderer) return
        try {
          renderer.render(experience, camera)
          frame = window.requestAnimationFrame(draw)
        } catch {
          fail()
        }
      }
      const setVisible = () => {
        visible = inViewport && document.visibilityState === 'visible'
        animations.forEach((animation) => visible ? animation.play() : animation.pause())
        if (visible && !frame) draw()
        if (!visible && frame) {
          window.cancelAnimationFrame(frame)
          frame = 0
        }
      }
      visibilityObserver = new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting
        setVisible()
      }, { threshold: 0.01 })
      visibilityObserver.observe(host)
      onVisibilityChange = setVisible
      document.addEventListener('visibilitychange', onVisibilityChange)
      draw()

      return cleanup
    } catch {
      cleanup()
      onUnavailable?.()
      return
    }
  }, { scope: mount, dependencies: [onUnavailable], revertOnUpdate: true })

  return <div ref={mount} className={className} aria-hidden="true" data-nice-energy-object />
}
