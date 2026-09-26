import React from 'react'

export function EnergyObjectFallback({ className = 'h-32 w-32' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true" fill="none">
      <ellipse cx="80" cy="80" rx="62" ry="24" stroke="#0284c7" strokeOpacity=".65" strokeWidth="2.5" transform="rotate(-32 80 80)" />
      <ellipse cx="80" cy="80" rx="62" ry="24" stroke="#059669" strokeOpacity=".6" strokeWidth="2.5" transform="rotate(32 80 80)" />
      <ellipse cx="80" cy="80" rx="62" ry="24" stroke="#38bdf8" strokeOpacity=".45" strokeWidth="2.5" />
      <circle cx="80" cy="80" r="14" fill="#0284c7" fillOpacity=".14" />
      <circle cx="80" cy="80" r="7" fill="#0284c7" />
      <circle cx="32" cy="55" r="4" fill="#059669" />
      <circle cx="123" cy="80" r="4" fill="#d97706" />
    </svg>
  )
}
