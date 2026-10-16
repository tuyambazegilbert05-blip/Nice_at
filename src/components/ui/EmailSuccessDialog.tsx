'use client'

import Link from 'next/link'
import { CheckCircle2, MailCheck } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

export function EmailSuccessDialog({
  isOpen,
  onClose,
  title,
  message,
  nextStep,
  actionLabel = 'Done',
  actionHref,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  nextStep: string
  actionLabel?: string
  actionHref?: string
}) {
  return <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
    <div role="status" className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-950">
        <span className="rounded-full bg-white p-2 text-emerald-700 shadow-sm"><MailCheck className="h-5 w-5" aria-hidden="true" /></span>
        <div><p className="font-semibold">{message}</p><p className="mt-1 text-sm leading-relaxed text-emerald-900">{nextStep}</p></div>
      </div>
      {actionHref
        ? <Link href={actionHref} onClick={onClose} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nice-blue-500 px-4 py-2 text-sm font-medium text-white shadow-subtle transition-colors hover:bg-nice-blue-600 focus:outline-none focus:ring-2 focus:ring-nice-blue-500 focus:ring-offset-2"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{actionLabel}</Link>
        : <Button className="w-full" onClick={onClose} leftIcon={<CheckCircle2 className="h-4 w-4" />}>{actionLabel}</Button>}
    </div>
  </Modal>
}
