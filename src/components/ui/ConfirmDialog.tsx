'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel: string
  confirmVariant?: 'primary' | 'danger'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmVariant = 'primary',
}: ConfirmDialogProps) {
  const confirm = () => {
    onClose()
    onConfirm()
  }

  return <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
    <div className="space-y-5">
      <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${confirmVariant === 'danger' ? 'border-rose-200 bg-rose-50 text-rose-950' : 'border-sky-100 bg-sky-50 text-slate-700'}`}>
        <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${confirmVariant === 'danger' ? 'text-rose-600' : 'text-sky-700'}`} aria-hidden="true" />
        <p>{message}</p>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" variant={confirmVariant} onClick={confirm}>{confirmLabel}</Button>
      </div>
    </div>
  </Modal>
}
