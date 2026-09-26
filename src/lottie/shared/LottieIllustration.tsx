'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { gsap } from '../../motion/gsap'
import { useGSAP } from '../../motion/gsap/useGsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'

const DotLottie = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((module) => module.DotLottieReact),
  { ssr: false, loading: () => null },
)

export type LottieState = 'success' | 'loading' | 'empty' | 'error'

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
  const [motionAllowed, setMotionAllowed] = useState(false)
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setMotionAllowed(!preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!motionAllowed) {
      setAnimationData(null)
      return
    }

    const controller = new AbortController()
    setAnimationData(null)

    fetch(ASSET[name], { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Animation asset returned ${response.status}`)
        return response.json() as Promise<Record<string, unknown>>
      })
      .then((data) => {
        if (!controller.signal.aborted) setAnimationData(data)
      })
      .catch(() => {
        // Keep the inline SVG fallback visible for missing assets and canceled requests.
      })

    return () => controller.abort()
  }, [motionAllowed, name])

  useGSAP(() => {
    if (!root.current || !motionAllowed) return
    gsap.fromTo(root.current, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: MOTION_DURATION.standard, ease: MOTION_EASE.enter })
  }, { dependencies: [motionAllowed], revertOnUpdate: true })

  return (
    <div ref={root} className={`relative ${className}`} role="img" aria-label={label}>
      <div className="absolute inset-0"><StaticFallback name={name} /></div>
      {motionAllowed && animationData && <div className="absolute inset-0" aria-hidden="true"><DotLottie data={animationData} autoplay loop={loop ?? name === 'loading'} className="h-full w-full" /></div>}
    </div>
  )
}
