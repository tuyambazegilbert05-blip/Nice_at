'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { gsap } from '../../../motion/gsap'
import { Camera, KeyRound, Mail, ShieldCheck, UserRound, X } from 'lucide-react'
import { LottieIllustration } from '../../../lottie/shared/LottieIllustration'
import { formatInitials } from '../../../utils/format'
import type { AuthUser } from '../../../types/user'
import { PasswordField } from '../../../components/ui/PasswordField'
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../../../lib/auth/password-policy'

type FormState = { name: string; email: string; avatarUrl: string }

export default function AccountPage() {
  const [user, setUser] = useState<(AuthUser & { avatarUrl?: string | null }) | null>(null)
  const [form, setForm] = useState<FormState>({ name: '', email: '', avatarUrl: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    root.current?.setAttribute('data-tour-ready', 'true')
  }, [])

  useEffect(() => {
    fetch('/api/auth').then((response) => response.json()).then((data) => {
      if (data.user) {
        setUser(data.user)
        setForm({ name: data.user.name, email: data.user.email, avatarUrl: data.user.avatarUrl ?? '' })
      }
    })
  }, [])

  useEffect(() => {
    if (!root.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = gsap.context(() => {
      gsap.from('[data-account-item]', { y: 16, autoAlpha: 0, duration: 0.55, stagger: 0.07, ease: 'power2.out' })
    }, root)
    return () => context.revert()
  }, [user])

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true); setMessage(''); setError('')
    const response = await fetch('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await response.json()
    if (!response.ok) setError(data.error ?? 'Could not update your profile.')
    else { setUser(data.user); setMessage('Profile updated successfully.'); setForm((current) => ({ ...current, name: data.user.name, email: data.user.email, avatarUrl: data.user.avatarUrl ?? '' })) }
    setSaving(false)
  }

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(''); setError('')
    if (!isStrongPassword(passwords.newPassword)) { setError(PASSWORD_POLICY_MESSAGE); return }
    if (passwords.newPassword !== passwords.confirmPassword) { setError('New passwords do not match.'); return }
    setChangingPassword(true); setMessage(''); setError('')
    try {
      const response = await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(passwords) })
      const data = await response.json()
      if (!response.ok) setError(data.error ?? 'Could not change your password.')
      else { setMessage('Password changed successfully.'); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }) }
    } catch {
      setError('Could not change your password. Check your connection and try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  const initials = formatInitials(user?.name ?? 'NiCE Staff')

  return (
    <div ref={root} data-tour="platform-account" className="flex flex-col gap-8 pb-10">
      <section data-account-item className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8">
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-sky-100/70 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-700">Account center</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">Your account profile</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Keep your staff identity current, secure, and recognizable across the NiCE operating center.</p></div>
          <LottieIllustration name="success" label="Animated profile status" className="size-24 shrink-0" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <form data-account-item onSubmit={saveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700"><UserRound /></div><div><h2 className="font-bold text-slate-950">Personal details</h2><p className="text-xs text-slate-500">This is how teammates see you.</p></div></div>
          <div className="mb-7 flex items-center gap-4 rounded-2xl bg-slate-50 p-4"><div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sky-100 text-lg font-bold text-sky-700">{form.avatarUrl ? <img src={form.avatarUrl} alt="Profile" className="size-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : initials}</div><div><p className="text-sm font-semibold text-slate-900">Profile image</p><p className="text-xs text-slate-500">Paste a secure image URL below.</p></div><Camera className="ml-auto text-slate-400" /> </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-normal outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" /></label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">Email address<div className="relative"><Mail className="absolute left-3 top-3 size-4 text-slate-400" /><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3.5 font-normal outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" /></div></label>
          </div>
          <label className="mt-5 flex flex-col gap-2 text-sm font-semibold text-slate-700">Profile image URL<span className="font-normal text-slate-500">Use an HTTPS link to a square image.</span><input type="url" value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} placeholder="https://…" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-normal outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" /></label>
          <div className="mt-7 flex items-center justify-between gap-4"><p role="status" className="text-sm text-emerald-600">{message}</p><button disabled={saving} className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button></div>
        </form>

        <div className="flex flex-col gap-6">
          <div data-account-item className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck /></div><div><h2 className="font-bold text-slate-950">Access & role</h2><p className="text-xs text-slate-500">Your workspace permissions.</p></div></div><div className="flex items-center justify-between border-b border-slate-100 pb-4"><span className="text-sm text-slate-500">Role</span><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{user?.role ?? '…'}</span></div><div className="flex items-center justify-between pt-4"><span className="text-sm text-slate-500">Account status</span><span className="flex items-center gap-2 text-sm font-semibold text-emerald-600"><span className="size-2 rounded-full bg-emerald-500" />Active</span></div></div>
          <div data-account-item className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><KeyRound /></div><div><h2 className="font-bold text-slate-950">Security</h2><p className="text-xs text-slate-500">Change your password.</p></div></div>
            <form onSubmit={changePassword} className="flex flex-col gap-3">
              <PasswordField label="Current password" autoComplete="current-password" value={passwords.currentPassword} onChange={(currentPassword) => setPasswords((current) => ({ ...current, currentPassword }))} placeholder="Enter current password" />
              <PasswordField label="New password" value={passwords.newPassword} onChange={(newPassword) => setPasswords((current) => ({ ...current, newPassword }))} placeholder="Create a strong password" showRequirements />
              <PasswordField label="Confirm new password" value={passwords.confirmPassword} onChange={(confirmPassword) => setPasswords((current) => ({ ...current, confirmPassword }))} confirmValue={passwords.newPassword} placeholder="Re-enter your password" />
              <button disabled={changingPassword} className="mt-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:opacity-60">{changingPassword ? 'Updating…' : 'Update password'}</button>
            </form>
          </div>
        </div>
      </div>
      {error && <div role="alert" className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex items-start gap-3 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm leading-relaxed text-rose-700 shadow-xl sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-md"><X className="mt-0.5 size-4 shrink-0" /><span className="min-w-0 break-words">{error}</span></div>}
    </div>
  )
}
