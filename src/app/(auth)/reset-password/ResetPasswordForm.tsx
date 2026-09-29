'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { PasswordField } from '../../../components/ui/PasswordField'
import { Button } from '../../../components/ui/Button'
import { KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react'
import { FormFieldsMotion } from '../../../motion/gsap/FormMotion'
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../../../lib/auth/password-policy'

export default function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!token) return setError('This reset link is missing its token.')
    if (!isStrongPassword(password)) return setError(PASSWORD_POLICY_MESSAGE)
    if (password !== confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', token, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setDone(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reset your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-elevated">
      <CardHeader className="pb-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-nice-blue-100 bg-nice-blue-50 text-nice-blue-600">
          {done ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <KeyRound className="h-6 w-6" />}
        </div>
        <CardTitle className="text-xl font-bold">{done ? 'Password updated' : 'Create a new password'}</CardTitle>
        <CardDescription>{done ? 'Your account is secure. You can sign in with your new password.' : 'Choose a strong password for your NiCE Club Rwanda staff account.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormFieldsMotion>
          {done ? <div className="text-center">
            <Button type="button" variant="primary" className="w-full" onClick={() => router.push('/login')}>Continue to Sign In</Button>
          </div> : <form onSubmit={submit} className="flex flex-col gap-4">
            {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
            <PasswordField label="New password" value={password} onChange={setPassword} placeholder="Create a strong password" showRequirements />
            <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} confirmValue={password} placeholder="Re-enter your password" />
            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>{loading ? 'Updating password…' : 'Update password'}</Button>
            <Link href="/login" className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"><ArrowLeft className="h-3 w-3" /> Back to Sign In</Link>
          </form>}
        </FormFieldsMotion>
      </CardContent>
    </Card>
  )
}
