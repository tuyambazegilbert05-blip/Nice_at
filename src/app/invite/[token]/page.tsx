'use client'

import { FormEvent, use, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PasswordField } from '../../../components/ui/PasswordField'
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../../../lib/auth/password-policy'

type Invitation = { email: string; role: string; name: string | null }

export default function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`/api/invitations/accept?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'This invitation is unavailable.')
        if (active) {
          setInvitation(result.data)
          setName(result.data.name || '')
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'This invitation is unavailable.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!isStrongPassword(password)) return setError(PASSWORD_POLICY_MESSAGE)
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

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <Image src="/brand/logo.png" alt="NiCE Club Rwanda" width={150} height={52} priority className="mb-6 h-12 w-auto" />
        <h1 className="text-2xl font-bold text-slate-900">Accept your invitation</h1>
        <p className="mt-2 text-sm text-slate-600">Set up your NiCE Club account to access the attendance platform.</p>

        {loading ? (
          <p role="status" className="mt-6 rounded-lg bg-sky-50 p-4 text-sm text-sky-800">Checking your invitation…</p>
        ) : invitation ? (
          <>
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-800">Invitation details</p>
              <p className="mt-2 text-slate-600"><span className="font-medium text-slate-700">Email:</span> {invitation.email}</p>
              <p className="mt-1 text-slate-600"><span className="font-medium text-slate-700">Access role:</span> {invitation.role}</p>
            </div>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Full name
                <input required maxLength={120} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" />
              </label>
              <PasswordField label="Create a strong password" value={password} onChange={setPassword} placeholder="Create a password" showRequirements />
              <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} confirmValue={password} placeholder="Re-enter your password" />
              {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
              <button disabled={saving} className="w-full rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-60">{saving ? 'Activating…' : 'Activate account'}</button>
            </form>
          </>
        ) : (
          <div role="alert" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p>{error || 'This invitation is unavailable.'}</p>
            <p className="mt-2">Ask the person who invited you to send a new link.</p>
          </div>
        )}

        <p className="mt-5 text-center text-xs text-slate-500"><Link href="/login" className="text-sky-700 underline">Return to sign in</Link></p>
      </section>
    </main>
  )
}
