'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Marks a server-rendered tour target ready only after this client boundary hydrates. */
export function TourTarget({ name, className, children }: { name: string; className?: string; children: ReactNode }) {
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    targetRef.current?.setAttribute('data-tour-ready', 'true')
  }, [])

  return <div ref={targetRef} data-tour={name} className={className}>{children}</div>
}
