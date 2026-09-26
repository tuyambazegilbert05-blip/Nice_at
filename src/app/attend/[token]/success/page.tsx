'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { Sparkles, Home } from 'lucide-react'
import { SuccessCheckmark } from '../../../../lottie/success'
import { EnergyObjectLoader } from '../../../../three/scenes/EnergyObjectLoader'
import { Card, CardContent } from '../../../../components/ui/Card'
import { Button } from '../../../../components/ui/Button'
import { gsap } from '../../../../motion/gsap'
import { MOTION_EASE } from '../../../../motion/gsap/config'
import { useGSAP } from '../../../../motion/gsap/useGsap'

export default function CheckInSuccessPage() {
  const experience = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!experience.current) return

    const media = gsap.matchMedia(experience.current)
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const sequence = gsap.timeline({ defaults: { ease: MOTION_EASE.enter } })
      sequence
        .fromTo('[data-success-card]', { autoAlpha: 0, y: 30, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out' })
        .fromTo('[data-success-accent]', { scaleX: 0 }, { scaleX: 1, duration: 0.52, ease: 'power3.inOut' }, 0)
        .fromTo('[data-success-brand]', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.32 }, 0.2)
        .fromTo('[data-success-energy]', { autoAlpha: 0, scale: 0.52, rotation: -18 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(1.35)' }, 0.3)
        .fromTo('[data-success-check]', { autoAlpha: 0, scale: 0.28, rotation: -24 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(1.8)' }, 0.68)
        .fromTo('[data-success-copy]', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.055 }, 0.8)
        .fromTo('[data-success-footer]', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.28 }, 1.08)
      return () => sequence.kill()
    })
    return () => media.revert()
  }, { scope: experience, dependencies: [], revertOnUpdate: true })

  return (
    <div ref={experience} className="relative min-h-screen overflow-hidden bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 bg-scientific-grid">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden p-3 sm:p-5 lg:p-8">
        <div className="absolute inset-0">
          <div className="absolute left-[9%] top-[12%] h-14 w-14 rounded-full bg-cover bg-center opacity-12 sm:left-[12%] sm:top-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute left-[20%] top-[26%] h-10 w-10 rounded-full bg-cover bg-center opacity-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute left-[32%] top-[8%] h-8 w-8 rounded-full bg-cover bg-center opacity-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute right-[9%] top-[12%] h-14 w-14 rounded-full bg-cover bg-center opacity-12 sm:right-[12%] sm:top-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute right-[20%] top-[26%] h-10 w-10 rounded-full bg-cover bg-center opacity-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute right-[32%] top-[8%] h-8 w-8 rounded-full bg-cover bg-center opacity-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute bottom-[12%] left-[12%] h-14 w-14 rounded-full bg-cover bg-center opacity-12 sm:left-[14%] sm:bottom-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute bottom-[20%] left-[24%] h-10 w-10 rounded-full bg-cover bg-center opacity-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute bottom-[10%] right-[12%] h-14 w-14 rounded-full bg-cover bg-center opacity-12 sm:right-[14%] sm:bottom-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute bottom-[20%] right-[24%] h-10 w-10 rounded-full bg-cover bg-center opacity-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
        </div>
      </div>
      <div data-success-card className="relative z-10 w-full max-w-md">
        <Card className="border-nice-blue-100 shadow-elevated text-center overflow-hidden">
          <div className="h-2 w-full origin-left bg-gradient-to-r from-emerald-500 via-nice-blue-500 to-cyan-500" data-success-accent />
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col items-center justify-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/NiCE-Logo-Animated.gif"
                alt="NiCE Club Rwanda"
                data-success-brand
                className="h-16 w-16 rounded-xl object-contain drop-shadow-sm sm:h-20 sm:w-20"
              />
              <div className="relative flex h-48 w-full max-w-xs items-center justify-center">
                <div data-success-energy className="absolute inset-y-0 left-1/2 h-44 w-44 -translate-x-1/2">
                  <EnergyObjectLoader label="NiCE orbital energy illustration" className="h-full w-full" />
                </div>
                <div data-success-check className="absolute right-6 top-5 rounded-full bg-white p-2 shadow-lg ring-1 ring-emerald-100 sm:right-10">
                  <SuccessCheckmark label="Your attendance was recorded successfully" className="h-20 w-20" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span data-success-copy>Verified Attendance</span>
              </div>
              <h1 data-success-copy className="text-2xl font-bold tracking-tight text-slate-900">
                Attendance Recorded
              </h1>
              <p data-success-copy className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                Thank you for participating in this NiCE Club Rwanda session. Your active participation powers our scientific community.
              </p>
            </div>

            <div data-success-footer className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Nuclear is Clean Energy</p>
              <p>Promoting education and informed dialogue in Rwanda.</p>
            </div>

            <div className="pt-2">
              <Link href="/">
                <Button variant="outline" size="md" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
                  Return to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
