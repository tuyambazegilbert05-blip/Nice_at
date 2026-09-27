'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { DoorReveal } from '../../../motion/gsap/DoorReveal'
import { FormFieldsMotion } from '../../../motion/gsap/FormMotion'
import { useGSAP } from '../../../motion/gsap/useGsap'
import { gsap } from '../../../motion/gsap'
import { LottieIllustration } from '../../../lottie/shared/LottieIllustration'

export default function LoginPage() {
  const router = useRouter()
  const atmosphere = useRef<HTMLDivElement>(null)
  const logo = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!atmosphere.current || !logo.current) return
    const media = gsap.matchMedia(atmosphere.current)
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const rings = atmosphere.current?.querySelectorAll('[data-auth-ring]')
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
      timeline.fromTo(logo.current, { autoAlpha: 0, scale: 0.82, y: 10 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.7 })
      if (rings?.length) {
        timeline.fromTo(rings, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.55, stagger: 0.1 }, '<0.2')
        gsap.to(rings, { rotation: 360, duration: 24, repeat: -1, ease: 'none', stagger: 1.5 })
      }
    })
    media.add('(prefers-reduced-motion: reduce)', () => gsap.set([logo.current, atmosphere.current], { clearProps: 'all' }))
    return () => media.revert()
  }, { scope: atmosphere, dependencies: [], revertOnUpdate: true })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Invalid email or password')
        setLoading(false)
        return
      }

      // Check redirect param
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const redirectTo = urlParams?.get('redirect') || '/dashboard'

      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div ref={atmosphere} className="relative space-y-4">
      <DoorReveal>
      <Card className="shadow-elevated border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/NiCE-Logo-Animated.gif"
              alt="NiCE Club Rwanda"
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="relative mx-auto mb-4 flex h-28 w-48 items-center justify-center overflow-hidden rounded-full bg-slate-50/80" aria-hidden="true">
            <div data-auth-ring className="absolute size-28 rounded-full border border-nice-blue-200/70" />
            <div data-auth-ring className="absolute size-20 rounded-full border border-emerald-200/80" />
            <div data-auth-ring className="absolute size-12 rounded-full bg-nice-blue-100/60 blur-xl" />
            <div ref={logo} className="relative rounded-full bg-white/90 p-2 shadow-sm backdrop-blur-sm">
              <LottieIllustration name="loading" label="NiCE energy emblem" className="size-10" loop />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">Staff Sign In</CardTitle>
          <CardDescription>
            Access NiCE Club attendance management and session operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormFieldsMotion>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in duration-200">
                {error}
              </div>
            )}

            <Input
              label="Staff Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="organizer@niceclub.rw"
            />

            <div className="group/field space-y-1.5" data-form-field>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 transition-colors group-focus-within/field:text-nice-blue-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-nice-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nice-blue-500/40"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              <span aria-live="polite" aria-atomic="true">
                {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              </span>
            </Button>

            <p className="text-center text-[11px] text-slate-500 pt-1">
              Authorized organizers and event staff only.
            </p>
          </form>
          </FormFieldsMotion>
        </CardContent>
      </Card>
      </DoorReveal>

    </div>
  )
}
