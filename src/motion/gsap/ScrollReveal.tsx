'use client'

import React, { useRef } from 'react'
import { useGSAP } from './useGsap'
import { createScrollReveal, createStaggerReveal } from '../scroll/scroll-trigger'

export function ScrollReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const element = root.current
    if (!element) return
    const scroller = element.closest('[data-scroll-container]') || undefined
    return createScrollReveal(element, scroller)
  }, { scope: root, dependencies: [], revertOnUpdate: true })

  return <div ref={root} className={className}>{children}</div>
}

export function StaggerReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const element = root.current
    if (!element) return
    const items = element.querySelectorAll('[data-motion-item]')
    if (!items.length) return
    const scroller = element.closest('[data-scroll-container]') || undefined
    return createStaggerReveal(items, element, scroller, { start: 'top 92%' })
  }, { scope: root, dependencies: [], revertOnUpdate: true })

  return <div ref={root} className={className}>{children}</div>
}
