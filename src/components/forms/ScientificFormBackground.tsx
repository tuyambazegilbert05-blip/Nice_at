import type React from 'react'

const atomPositions = [
  'left-[9%] top-[12%] h-14 w-14 sm:left-[12%] sm:top-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20 opacity-[0.12]',
  'left-[20%] top-[26%] h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 opacity-[0.12]',
  'left-[32%] top-[8%] h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 opacity-10',
  'right-[9%] top-[12%] h-14 w-14 sm:right-[12%] sm:top-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20 opacity-[0.12]',
  'right-[20%] top-[26%] h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 opacity-[0.12]',
  'right-[32%] top-[8%] h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 opacity-10',
  'bottom-[12%] left-[12%] h-14 w-14 sm:left-[14%] sm:bottom-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20 opacity-[0.12]',
  'bottom-[20%] left-[24%] h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 opacity-[0.12]',
  'bottom-[10%] right-[12%] h-14 w-14 sm:right-[14%] sm:bottom-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20 opacity-[0.12]',
  'bottom-[20%] right-[24%] h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 opacity-[0.12]',
]

export function ScientificFormBackground({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  return <main className={`relative isolate min-h-screen overflow-hidden bg-slate-50 bg-scientific-grid ${className}`}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden p-3 sm:p-5 lg:p-8">
      {atomPositions.map((position, index) => <div
        key={index}
        className={`absolute rounded-full bg-cover bg-center ${position}`}
        style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }}
      />)}
    </div>
    <div className="relative z-10 flex min-h-screen w-full items-center justify-center">{children}</div>
  </main>
}
