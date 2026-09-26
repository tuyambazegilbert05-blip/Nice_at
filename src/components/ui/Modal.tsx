'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'
import { gsap } from '../../motion/gsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  const dialog = useRef<HTMLDivElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const closing = useRef(false)

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    const panel = dialog.current
    const shade = backdrop.current
    if (!panel || !shade || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    gsap.timeline({ onComplete: onClose })
      .to(panel, { autoAlpha: 0, y: 6, scale: 0.99, duration: MOTION_DURATION.micro, ease: MOTION_EASE.exit }, 0)
      .to(shade, { autoAlpha: 0, duration: MOTION_DURATION.micro, ease: MOTION_EASE.exit }, 0)
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    if (isOpen) {
      const previousOverflow = document.body.style.overflow
      const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
      const panel = dialog.current
      const shade = backdrop.current
      const media = gsap.matchMedia()
      if (panel && shade) {
        media.add('(prefers-reduced-motion: no-preference)', () => {
          gsap.fromTo(shade, { autoAlpha: 0 }, { autoAlpha: 1, duration: MOTION_DURATION.short, ease: MOTION_EASE.standard })
          gsap.fromTo(panel, { autoAlpha: 0, y: 10, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: MOTION_DURATION.standard, ease: MOTION_EASE.enter })
        })
        media.add('(prefers-reduced-motion: reduce)', () => gsap.set([shade, panel], { autoAlpha: 1, clearProps: 'transform' }))
        panel.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus()
      }
      const trapFocus = (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || !panel) return
        const focusable = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
      window.addEventListener('keydown', trapFocus)
      return () => {
        document.body.style.overflow = previousOverflow
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keydown', trapFocus)
        media.revert()
        previousFocus?.focus()
        closing.current = false
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'nice-modal-title' : undefined}
      ref={dialog}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        ref={backdrop}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        className={cn(
          'relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 z-10',
          className
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            {title && <h3 id="nice-modal-title" className="text-lg font-semibold text-slate-900">{title}</h3>}
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>
          <button
            onClick={close}
            aria-label="Close modal"
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
