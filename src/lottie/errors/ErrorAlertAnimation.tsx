import React from 'react'
import { LottieIllustration } from '../shared/LottieIllustration'

export function ErrorAlertAnimation({ label = 'An error needs attention', className }: { label?: string; className?: string }) {
  return <LottieIllustration name="error" label={label} className={className} />
}
