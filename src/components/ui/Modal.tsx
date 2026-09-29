'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import { gsap } from '../../motion/gsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: string
  children: React.ReactNode
  className?: string
  panelRef?: React.RefObject<HTMLDivElement | null>
}

export function Modal({ isOpen, onClose, title, description, children, className, panelRef }: ModalProps) {
  const dialog = useRef<HTMLDivElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const closing = useRef(false)

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    const panel = dialog.current
    const shade = backdrop.current
    if (!panel || !shade || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      closing.current = false
      onClose()
      return
    }
    const timeline = gsap.timeline({ onComplete: () => { closing.current = false; onClose() } })
    if (panelRef) timeline.to(panelRef.current, { autoAlpha: 0, duration: MOTION_DURATION.micro, ease: MOTION_EASE.exit }, 0)
    else timeline.to(panel, { autoAlpha: 0, y: 6, scale: 0.99, duration: MOTION_DURATION.micro, ease: MOTION_EASE.exit }, 0)
    timeline
      .to(shade, { autoAlpha: 0, duration: MOTION_DURATION.micro, ease: MOTION_EASE.exit }, 0)
  }, [onClose, panelRef])

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
          if (!panelRef) {
            gsap.fromTo(panel, { autoAlpha: 0, y: 10, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: MOTION_DURATION.standard, ease: MOTION_EASE.enter })
          }
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
  }, [isOpen, close, panelRef])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal((
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'nice-modal-title' : undefined}
      ref={dialog}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-6"
    >
        <div ref={backdrop} className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />
        <div
          ref={panelRef}
          className={cn(
            'relative max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:p-6',
            className
          )}
        >
          <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="min-w-0 flex-1">
              {title && <h3 id="nice-modal-title" className="break-words text-base font-semibold text-slate-900 sm:text-lg">{title}</h3>}
              {description && <p className="mt-1 break-words text-xs leading-relaxed text-slate-500">{description}</p>}
            </div>
            <button
              onClick={close}
              aria-label="Close modal"
              className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nice-blue-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 min-w-0 sm:mt-4">{children}</div>
        </div>
    </div>
  ), document.body)
}
