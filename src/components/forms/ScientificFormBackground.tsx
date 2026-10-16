import type React from 'react'

export function ScientificFormBackground({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  return <main className={`relative min-h-screen bg-transparent ${className}`}>
    <div className="flex min-h-screen w-full items-center justify-center">{children}</div>
  </main>
}
