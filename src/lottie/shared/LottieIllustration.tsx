'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { DotLottie as DotLottiePlayer } from '@lottiefiles/dotlottie-react'
import { gsap } from '../../motion/gsap'
import { useGSAP } from '../../motion/gsap/useGsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'

const DotLottie = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((module) => module.DotLottieReact),
  { ssr: false, loading: () => null },
)

export type LottieState = 'success' | 'loading' | 'empty' | 'error'

type LottieDocument = Record<string, unknown> & {
  v?: unknown
  w?: unknown
  h?: unknown
  ip?: unknown
  op?: unknown
  fr?: unknown
  layers?: unknown
}

function isLottieDocument(value: unknown): value is LottieDocument {
  if (!value || typeof value !== 'object') return false
  const document = value as LottieDocument
  return typeof document.v === 'string'
    && Number.isFinite(document.w) && Number(document.w) > 0
    && Number.isFinite(document.h) && Number(document.h) > 0
    && Number.isFinite(document.ip) && Number.isFinite(document.op)
    && Number(document.op) > Number(document.ip)
    && Number.isFinite(document.fr) && Number(document.fr) > 0
    && Array.isArray(document.layers)
}

const ASSET: Record<LottieState, string> = {
  success: '/lottie/success.json',
  loading: '/lottie/loading.json',
  empty: '/lottie/empty.json',
  error: '/lottie/error.json',
}

function StaticFallback({ name }: { name: LottieState }) {
  if (name === 'success') return <svg viewBox="0 0 128 128" aria-hidden="true" className="h-full w-full"><circle cx="64" cy="64" r="41" fill="#ecfdf5" stroke="#059669" strokeWidth="5" /><path d="m42 64 15 15 30-32" fill="none" stroke="#059669" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  if (name === 'loading') return <svg viewBox="0 0 128 128" aria-hidden="true" className="h-full w-full"><circle cx="64" cy="64" r="38" fill="none" stroke="#93c5fd" strokeWidth="4" /><circle cx="64" cy="64" r="11" fill="#059669" /><circle cx="64" cy="26" r="6" fill="#0284c7" /></svg>
  if (name === 'empty') return <svg viewBox="0 0 128 128" aria-hidden="true" className="h-full w-full"><ellipse cx="64" cy="64" rx="46" ry="19" transform="rotate(-28 64 64)" fill="none" stroke="#0284c7" strokeWidth="4" /><ellipse cx="64" cy="64" rx="46" ry="19" transform="rotate(28 64 64)" fill="none" stroke="#059669" strokeWidth="4" /><circle cx="64" cy="64" r="11" fill="#d97706" /></svg>
  return <svg viewBox="0 0 128 128" aria-hidden="true" className="h-full w-full"><path d="M64 20 111 103H17L64 20Z" fill="#fff7ed" stroke="#b45309" strokeWidth="5" strokeLinejoin="round" /><path d="M64 48v24" stroke="#b45309" strokeWidth="7" strokeLinecap="round" /><circle cx="64" cy="86" r="4" fill="#b45309" /></svg>
}

export function LottieIllustration({ name, label, className = 'h-24 w-24', loop }: {
  name: LottieState
  label: string
  className?: string
  loop?: boolean
}) {
  const root = useRef<HTMLDivElement>(null)
  const [player, setPlayer] = useState<DotLottiePlayer | null>(null)
  const [motionAllowed, setMotionAllowed] = useState(false)
  const [inViewport, setInViewport] = useState(false)
  const [loadedAnimation, setLoadedAnimation] = useState<{ name: LottieState; data: Record<string, unknown> } | null>(null)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setMotionAllowed(!preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const element = root.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(([entry]) => {
      setInViewport(entry.isIntersecting)
    }, { threshold: 0.01 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!motionAllowed || !inViewport || loadedAnimation?.name === name) return

    const controller = new AbortController()

    fetch(ASSET[name], { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Animation asset returned ${response.status}`)
        return response.json() as Promise<unknown>
      })
      .then((data) => {
        if (!controller.signal.aborted && isLottieDocument(data)) {
          setLoadedAnimation({ name, data })
        }
      })
      .catch(() => {
        // Keep the inline SVG fallback visible for missing assets and canceled requests.
      })

    return () => controller.abort()
  }, [inViewport, loadedAnimation, motionAllowed, name])

  const animationData = loadedAnimation?.name === name ? loadedAnimation.data : null

  useEffect(() => {
    if (!motionAllowed || !inViewport || !animationData) {
      player?.pause()
      return
    }

    const updatePlayback = () => {
      if (document.visibilityState === 'visible' && inViewport) {
        if (player?.isLoaded) player.play()
      } else {
        player?.pause()
      }
    }
    player?.addEventListener('load', updatePlayback)
    player?.addEventListener('ready', updatePlayback)
    document.addEventListener('visibilitychange', updatePlayback)
    updatePlayback()
    return () => {
      player?.removeEventListener('load', updatePlayback)
      player?.removeEventListener('ready', updatePlayback)
      document.removeEventListener('visibilitychange', updatePlayback)
      player?.pause()
    }
  }, [animationData, inViewport, motionAllowed, player])

  useGSAP(() => {
    if (!root.current || !motionAllowed) return
    gsap.fromTo(root.current, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: MOTION_DURATION.standard, ease: MOTION_EASE.enter })
  }, { dependencies: [motionAllowed], revertOnUpdate: true })

  return (
    <div ref={root} className={`relative ${className}`} role="img" aria-label={label}>
      <div className="absolute inset-0"><StaticFallback name={name} /></div>
      {motionAllowed && inViewport && animationData && <div className="absolute inset-0" aria-hidden="true"><DotLottie data={JSON.stringify(animationData)} autoplay={false} loop={loop ?? name === 'loading'} dotLottieRefCallback={setPlayer} className="h-full w-full" /></div>}
    </div>
  )
}
