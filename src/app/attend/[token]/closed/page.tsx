'use client'

import React from 'react'
import Link from 'next/link'
import { Clock, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '../../../../components/ui/Card'
import { Button } from '../../../../components/ui/Button'

export default function SessionClosedPage() {
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
      <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200">
        <Card className="border-amber-200/80 shadow-elevated text-center overflow-hidden">
          <div className="h-1.5 w-full bg-amber-500" />
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Animated Brand Logo & Status */}
            <div className="flex flex-col items-center justify-center space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/NiCE-Logo-Animated.gif"
                alt="NiCE Club Rwanda"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm rounded-xl"
              />
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center shadow-subtle">
                <Clock className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Session Concluded</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Attendance is Closed
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                The check-in window for this session has officially ended. Attendance can no longer be recorded through this link.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
              <p>If you believe this is in error, please contact the NiCE event coordinator present at the venue.</p>
            </div>

            <div className="pt-2">
              <Link href="/">
                <Button variant="outline" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Portal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
