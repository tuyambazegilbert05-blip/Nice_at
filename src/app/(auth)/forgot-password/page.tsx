'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { KeyRound, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="shadow-elevated border-slate-200">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 rounded-2xl bg-nice-blue-50 border border-nice-blue-100 text-nice-blue-600 mx-auto mb-3 flex items-center justify-center">
          <KeyRound className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Enter your staff email address to receive password reset instructions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="text-center space-y-4 py-2">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              If an account exists for {email}, a recovery link has been dispatched.
            </div>
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-nice-blue-600 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@niceclub.rw"
            />
            <Button type="submit" variant="primary" className="w-full">
              Send Reset Link
            </Button>
            <div className="text-center pt-2">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
