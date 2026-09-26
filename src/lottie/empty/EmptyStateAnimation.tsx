import React from 'react'
import { LottieIllustration } from '../shared/LottieIllustration'

export function EmptyStateAnimation({ label = 'No items available', className }: { label?: string; className?: string }) {
  return <LottieIllustration name="empty" label={label} className={className} />
}
