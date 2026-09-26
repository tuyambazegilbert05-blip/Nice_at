import React from 'react'
import { LottieIllustration } from '../shared/LottieIllustration'

export function SuccessCheckmark({ label = 'Success', className }: { label?: string; className?: string }) {
  return <LottieIllustration name="success" label={label} className={className} />
}
