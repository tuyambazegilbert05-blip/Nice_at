'use client'

import { FormEvent, use, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    setSaving(true)
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Invitation could not be accepted.')
      router.replace('/login?invited=1')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invitation could not be accepted.')
    } finally { setSaving(false) }
  }

  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-lg">
    <Image src="/brand/logo.png" alt="NiCE Club Rwanda" width={150} height={52} priority className="mb-6 h-12 w-auto" />
    <h1 className="text-2xl font-bold text-slate-900">Accept your invitation</h1><p className="mt-2 text-sm text-slate-600">Create your NiCE Club account to access the attendance platform.</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-slate-700">Full name<input required maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
      <label className="block text-sm font-medium text-slate-700">Password<input required minLength={14} maxLength={200} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /><span className="mt-1 block text-xs text-slate-500">Use at least 14 characters.</span></label>
      <label className="block text-sm font-medium text-slate-700">Confirm password<input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button disabled={saving} className="w-full rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-60">{saving ? 'Activating…' : 'Activate account'}</button>
    </form><p className="mt-5 text-center text-xs text-slate-500"><Link href="/login" className="text-sky-700 underline">Return to sign in</Link></p>
  </section></main>
}
