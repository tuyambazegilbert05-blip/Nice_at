import type { Metadata } from 'next'
import './globals.css'
import 'driver.js/dist/driver.css'
import { ButtonFeedback } from '../motion/gsap/ButtonFeedback'

export const metadata: Metadata = {
  title: 'NiCE Club Rwanda — Attendance Platform',
  description:
    'Operational attendance, event management, and intelligence platform for NiCE Club Rwanda (Nuclear is Clean Energy).',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <ButtonFeedback>{children}</ButtonFeedback>
      </body>
    </html>
  )
}
