import React from 'react'
import { LottieIllustration } from '../shared/LottieIllustration'

export function LoadingSpinner({ label = 'Loading', className }: { label?: string; className?: string }) {
  return <LottieIllustration name="loading" label={label} className={className} loop />
}
