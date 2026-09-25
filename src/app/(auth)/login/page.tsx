'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { ShieldCheck, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@niceclub.rw')
  const [password, setPassword] = useState('NiCE@Rwanda2026!')
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

  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('NiCE@Rwanda2026!')
    setError(null)
  }

  return (
    <div className="space-y-4">
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
          <CardTitle className="text-xl font-bold">Staff Sign In</CardTitle>
          <CardDescription>
            Access NiCE Club attendance management and session operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-nice-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Dashboard
            </Button>

            <p className="text-center text-[11px] text-slate-500 pt-1">
              Authorized organizers and event staff only.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Development Quick Role Switcher for Phase 02 Evaluation */}
      <Card className="bg-slate-50/80 border-slate-200/80 shadow-subtle">
        <CardContent className="p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-nice-blue-600" />
              Demo Roles & Accounts
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Password: NiCE@Rwanda2026!</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <button
              type="button"
              onClick={() => fillCredentials('admin@niceclub.rw')}
              className="p-2 rounded-lg bg-white border border-slate-200 text-left hover:border-nice-blue-400 transition-colors shadow-subtle"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Admin</span>
                <Badge variant="info" size="sm">ADMIN</Badge>
              </div>
              <span className="text-[10px] text-slate-500 block truncate">admin@niceclub.rw</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('manager@niceclub.rw')}
              className="p-2 rounded-lg bg-white border border-slate-200 text-left hover:border-nice-blue-400 transition-colors shadow-subtle"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Manager</span>
                <Badge variant="default" size="sm">MANAGER</Badge>
              </div>
              <span className="text-[10px] text-slate-500 block truncate">manager@niceclub.rw</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('staff@niceclub.rw')}
              className="p-2 rounded-lg bg-white border border-slate-200 text-left hover:border-nice-blue-400 transition-colors shadow-subtle"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Staff</span>
                <Badge variant="success" size="sm">STAFF</Badge>
              </div>
              <span className="text-[10px] text-slate-500 block truncate">staff@niceclub.rw</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('viewer@niceclub.rw')}
              className="p-2 rounded-lg bg-white border border-slate-200 text-left hover:border-nice-blue-400 transition-colors shadow-subtle"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Viewer</span>
                <Badge variant="neutral" size="sm">VIEWER</Badge>
              </div>
              <span className="text-[10px] text-slate-500 block truncate">viewer@niceclub.rw</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
