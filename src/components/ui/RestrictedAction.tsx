'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ShieldAlert, X } from 'lucide-react'
import { Button, type ButtonProps } from './Button'

function AccessDeniedDialog({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/35 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <section role="alertdialog" aria-modal="true" aria-labelledby="access-denied-title" className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <ShieldAlert aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="access-denied-title" className="font-semibold text-slate-900">Access denied</h2>
            <p className="mt-1.5 text-sm leading-6 text-rose-700">{message.replace(/^Access denied:\s*/i, '')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close access denied message" className="-mr-1 -mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2">Close</button>
        </div>
      </section>
    </div>
  )
}

export function RestrictedActionButton({ message, children, className, ...props }: {
  message: string
  children: ReactNode
  className?: string
} & Omit<ButtonProps, 'onClick' | 'disabled' | 'children'>) {
  const [showMessage, setShowMessage] = useState(false)

  return <>
    <Button
      {...props}
      type="button"
      aria-disabled="true"
      onClick={() => setShowMessage(true)}
      className={`cursor-not-allowed opacity-60 ${className || ''}`}
    >{children}</Button>
    {showMessage && <AccessDeniedDialog message={message} onClose={() => setShowMessage(false)} />}
  </>
}

export function RestrictedActionPanel({ message, children, className = '', enabled = true }: {
  message: string
  children: ReactNode
  className?: string
  enabled?: boolean
}) {
  const [showMessage, setShowMessage] = useState(false)

  return <div className={`relative ${className}`}>
    {children}
    {enabled && <button
      type="button"
      aria-label="This action is unavailable to your role. Show access details."
      onClick={() => setShowMessage(true)}
      className="absolute inset-0 z-20 cursor-not-allowed rounded-xl bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
    />}
    {showMessage && <AccessDeniedDialog message={message} onClose={() => setShowMessage(false)} />}
  </div>
}
