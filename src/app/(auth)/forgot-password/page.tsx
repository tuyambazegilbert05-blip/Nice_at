'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { KeyRound, ArrowLeft } from 'lucide-react'
import { FormFieldsMotion } from '../../../motion/gsap/FormMotion'
import { EmailSuccessDialog } from '../../../components/ui/EmailSuccessDialog'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [submitted, setSubmitted] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try { const response = await fetch('/api/auth/password-reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'request', email }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSubmitted(true) } catch (err) { setError(err instanceof Error ? err.message : 'Unable to send the reset link.') } finally { setLoading(false) }
  }
  return <>
    <Card className="shadow-elevated border-slate-200"><CardHeader className="text-center pb-4"><div className="w-12 h-12 rounded-2xl bg-nice-blue-50 border border-nice-blue-100 text-nice-blue-600 mx-auto mb-3 flex items-center justify-center"><KeyRound className="w-6 h-6" /></div><CardTitle className="text-xl font-bold">Reset Password</CardTitle><CardDescription>Enter your staff email and we&apos;ll send a secure link that expires in 10 minutes.</CardDescription></CardHeader><CardContent><FormFieldsMotion><form onSubmit={handleSubmit} className="flex flex-col gap-4">{error && <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</div>}<Input label="Staff Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@niceclub.rw" /><Button type="submit" variant="primary" className="w-full" isLoading={loading}>{loading ? 'Sending secure link...' : 'Send Reset Link'}</Button><div className="text-center pt-2"><Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"><ArrowLeft className="w-3 h-3" /> Back to Sign In</Link></div></form></FormFieldsMotion></CardContent></Card>
    <EmailSuccessDialog
      isOpen={submitted}
      onClose={() => setSubmitted(false)}
      title="Check your email"
      message="If an active account matches that address, a reset link has been sent."
      nextStep="Check your inbox and spam folder. The secure link expires in 10 minutes. If you requested the wrong address, close this message and try again."
      actionLabel="Back to Sign In"
      actionHref="/login"
    />
  </>
}
