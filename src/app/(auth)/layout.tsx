import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-nice-blue-50/30 to-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 relative bg-scientific-grid">
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-slate-500 hover:text-nice-blue-600 transition-colors text-xs font-semibold"
        >
          <Image
            src="/brand/NiCE-Logo-Animated-transparent.webp"
            alt="NiCE Club Rwanda logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain rounded-lg"
            priority
          />
          <span className="font-bold text-slate-800">NiCE Club Rwanda</span>
        </Link>
      </div>

      <div className="w-full max-w-md my-8">{children}</div>

      <footer className="text-center text-xs text-slate-400 mt-6">
        <p>© {new Date().getFullYear()} NiCE Club Rwanda. Nuclear is Clean Energy.</p>
      </footer>
    </div>
  )
}
