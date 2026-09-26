'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { EnergyObjectFallback } from '../components/EnergyObjectFallback'
import { supportsWebGL } from '../core'

type EnergyObjectComponent = typeof import('./EnergyObject').EnergyObject

export function EnergyObjectLoader({ label = 'NiCE nuclear energy orbital motif', className = 'h-40 w-40' }: {
  label?: string
  className?: string
}) {
  const root = useRef<HTMLDivElement>(null)
  const [Scene, setScene] = useState<EnergyObjectComponent | null>(null)
  const handleUnavailable = useCallback(() => setScene(null), [])

  useEffect(() => {
    const element = root.current
    if (!element) return
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const lowCapability = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    if (lowCapability || (memory !== undefined && memory <= 2) || typeof IntersectionObserver === 'undefined' || typeof ResizeObserver === 'undefined') return

    let active = true
    let loaded = false
    const loadScene = () => {
      if (loaded || !active || motionPreference.matches) return
      if (!supportsWebGL()) return
      loaded = true
      observer.disconnect()
      void import('./EnergyObject').then((module) => {
        if (active && !motionPreference.matches) setScene(() => module.EnergyObject)
      }).catch(() => setScene(null))
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadScene()
    }, { rootMargin: '100px', threshold: 0.05 })
    const onPreferenceChange = () => {
      if (motionPreference.matches) {
        observer.disconnect()
        loaded = false
        setScene(null)
      } else {
        observer.observe(element)
      }
    }
    motionPreference.addEventListener('change', onPreferenceChange)
    if (!motionPreference.matches) observer.observe(element)
    return () => {
      active = false
      motionPreference.removeEventListener('change', onPreferenceChange)
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={root} className={`relative inline-flex items-center justify-center ${className}`} role="img" aria-label={label}>
      <EnergyObjectFallback className="absolute inset-0 h-full w-full" />
      {Scene && <Scene className="absolute inset-0 h-full w-full" onUnavailable={handleUnavailable} />}
    </div>
  )
}
