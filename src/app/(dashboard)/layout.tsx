import React from 'react'
import { Sidebar } from '../../components/navigation/Sidebar'
import { Header } from '../../components/navigation/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden text-slate-900">
      {/* Desktop Persistent Left Sidebar */}
      <Sidebar className="hidden md:flex shrink-0" />

      {/* Main Administrative Operating Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main data-scroll-container className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
