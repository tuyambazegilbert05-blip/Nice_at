'use client'

import { useRef } from 'react'
import { gsap } from '../../motion/gsap'
import { useGSAP } from '../../motion/gsap/useGsap'

interface SessionLoadingStateProps {
  label?: string
}

export function SessionLoadingState({ label = 'Loading session…' }: SessionLoadingStateProps) {
  const root = useRef<HTMLDivElement>(null)
  const logo = useRef<HTMLDivElement>(null)
  const orbitPrimary = useRef<HTMLSpanElement>(null)
  const orbitSecondary = useRef<HTMLSpanElement>(null)
  const signal = useRef<HTMLSpanElement>(null)
  const message = useRef<HTMLParagraphElement>(null)
  const progress = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const media = gsap.matchMedia()

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const entrance = gsap.timeline({ defaults: { ease: 'power3.out' } })
      entrance
        .fromTo(logo.current, { y: 14, scale: 0.88, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.65 })
        .fromTo(message.current, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38 }, '-=0.22')
        .fromTo(progress.current, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.7, ease: 'power2.out' }, '-=0.16')

      gsap.to(logo.current, { y: -5, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.65 })
      gsap.to(orbitPrimary.current, { rotation: 360, duration: 11, ease: 'none', repeat: -1, transformOrigin: '50% 50%' })
      gsap.to(orbitSecondary.current, { rotation: -360, duration: 16, ease: 'none', repeat: -1, transformOrigin: '50% 50%' })
      gsap.to(signal.current, { scale: 1.45, opacity: 0.45, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 50%' })

      return () => entrance.kill()
    })

    media.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set([logo.current, message.current, progress.current], { clearProps: 'all' })
    })

    return () => media.revert()
  }, { scope: root, dependencies: [], revertOnUpdate: true })

  return (
    <div
      ref={root}
      className="flex min-h-[60vh] w-full flex-col items-center justify-center overflow-hidden px-6 py-12 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative mb-7 flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48" aria-hidden="true">
        <span ref={orbitPrimary} className="absolute inset-2 rounded-full border border-sky-200/90 [border-style:dashed]" />
        <span ref={orbitSecondary} className="absolute inset-0 rounded-full border border-emerald-200/80" />
        <span className="absolute left-5 top-8 h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.55)]" />
        <span className="absolute bottom-7 right-5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span ref={signal} className="absolute right-4 top-1/2 h-2.5 w-2.5 rounded-full bg-sky-500 shadow-[0_0_14px_rgba(14,165,233,0.65)]" />
        <div ref={logo} className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-[0_12px_36px_rgba(15,23,42,0.10)] ring-1 ring-slate-100 sm:h-32 sm:w-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/NiCE-Logo-Animated.gif" alt="NiCE Club Rwanda" className="h-[82%] w-[82%] rounded-full object-contain" width={112} height={112} />
        </div>
      </div>

      <div className="w-full max-w-xs">
        <p ref={message} className="text-sm font-semibold tracking-wide text-slate-700">{label}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
          <span ref={progress} className="block h-full w-full origin-left rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500" />
        </div>
        <p className="mt-3 text-xs text-slate-500">Connecting your session details</p>
      </div>
    </div>
  )
}
