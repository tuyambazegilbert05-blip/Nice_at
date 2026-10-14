'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, MailCheck, MailWarning, Sparkles } from 'lucide-react'
import { Card, CardContent } from '../../../../components/ui/Card'
import { Button } from '../../../../components/ui/Button'
import { SuccessCheckmark } from '../../../../lottie/success'
import { CustomFormBrand } from '../../../../components/forms/CustomFormBrand'
import { ScientificFormBackground } from '../../../../components/forms/ScientificFormBackground'

type SuccessDetails = { title: string; eventDate: string; fullName: string; emailStatus: 'ACCEPTED' | 'FAILED' | 'PENDING' }

export default function CustomFormSuccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [details, setDetails] = useState<SuccessDetails | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(`nice-custom-form-success:${token}`)
        if (raw) {
          setDetails(JSON.parse(raw) as SuccessDetails)
          sessionStorage.removeItem(`nice-custom-form-success:${token}`)
        }
      } catch { /* The confirmation remains useful without browser session storage. */ }
      setReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [token])

  const date = details?.eventDate ? new Intl.DateTimeFormat('en-RW', { dateStyle: 'long', timeZone: 'Africa/Kigali' }).format(new Date(`${details.eventDate}T12:00:00+02:00`)) : ''
  const emailCopy = details?.emailStatus === 'ACCEPTED'
    ? 'The confirmation email was accepted by the NiCE email provider. Inbox delivery is not confirmed.'
    : details?.emailStatus === 'FAILED'
      ? 'Your response was saved, but the confirmation email could not be sent. The event team can retry it.'
      : 'Your response was saved. The confirmation email status is pending.'

  return <ScientificFormBackground className="flex items-center justify-center p-4 sm:p-6">
    <Card className="w-full max-w-lg overflow-hidden border-sky-100 shadow-lg"><div className="h-2 bg-gradient-to-r from-emerald-500 via-sky-500 to-cyan-500" /><CardContent className="space-y-5 p-6 text-center sm:p-8">
      <div className="flex justify-center"><CustomFormBrand logoClassName="h-14 w-14" /></div>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"><SuccessCheckmark label="Form response submitted successfully" className="h-16 w-16" /></div>
      <div><p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800"><Sparkles className="h-3.5 w-3.5" />Response submitted</p><h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Thank you{details?.fullName ? `, ${details.fullName.split(/\s+/)[0]}` : ''}.</h1><p className="mt-2 text-sm leading-relaxed text-slate-600">Your response has been saved by NiCE Club Rwanda.</p></div>
      {details && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left"><p className="font-semibold text-slate-900">{details.title}</p><p className="mt-1 text-xs text-slate-600">{date}</p></div>}
      {ready && <div role="status" className={`flex items-start gap-2 rounded-xl border p-3 text-left text-xs leading-relaxed ${details?.emailStatus === 'FAILED' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-sky-100 bg-sky-50 text-sky-950'}`}>
        {details?.emailStatus === 'FAILED' ? <MailWarning className="mt-0.5 h-4 w-4 shrink-0" /> : <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />}
        <span>{emailCopy}</span>
      </div>}
      <p className="text-xs leading-relaxed text-slate-500">Continue exploring how science and innovation can contribute to a shared future for Rwanda.</p>
      <Link href="/" className="block"><Button variant="outline" className="w-full" leftIcon={<CheckCircle2 className="h-4 w-4" />}>Return to NiCE Club</Button></Link>
    </CardContent></Card>
  </ScientificFormBackground>
}
