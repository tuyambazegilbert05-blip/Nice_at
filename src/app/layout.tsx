import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NiCE Club Rwanda — Attendance Platform',
  description:
    'Operational attendance, event management, and intelligence platform for NiCE Club Rwanda (Nuclear is Clean Energy).',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
