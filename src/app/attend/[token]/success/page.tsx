'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, Sparkles, Home } from 'lucide-react'
import { Card, CardContent } from '../../../../components/ui/Card'
import { Button } from '../../../../components/ui/Button'

export default function CheckInSuccessPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 bg-scientific-grid">
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
      <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
        <Card className="border-nice-blue-100 shadow-elevated text-center overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-nice-blue-500 to-cyan-500" />
          <CardContent className="p-8 space-y-6">
            {/* Animated Brand Logo & Energy Icon */}
            <div className="flex flex-col items-center justify-center space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/NiCE-Logo-Animated.gif"
                alt="NiCE Club Rwanda"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm rounded-xl"
              />
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-75" />
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-subtle relative z-10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Attendance</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Attendance Recorded
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                Thank you for participating in this NiCE Club Rwanda session. Your active participation powers our scientific community.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
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
