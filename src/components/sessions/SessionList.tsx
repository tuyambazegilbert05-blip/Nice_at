'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Plus, Search } from 'lucide-react'
import { SessionCard } from './SessionCard'
import { Button } from '../ui/Button'
import { Session, SessionStatus } from '../../types/session'
import { useFlipLayout } from '../../motion/gsap/useFlip'
import { StaggerReveal } from '../../motion/gsap/ScrollReveal'
import { RestrictedActionButton } from '../ui/RestrictedAction'

interface SessionListProps {
  sessions: Session[]
  canCreate?: boolean
  role?: string
}

export function SessionList({ sessions, canCreate = false, role = 'current' }: SessionListProps) {
  const [filter, setFilter] = useState<'ALL' | SessionStatus>('ALL')
  const [search, setSearch] = useState('')

  const filteredSessions = sessions.filter((s) => {
    const matchesFilter = filter === 'ALL' || s.status === filter
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })
  const layoutKey = filteredSessions.map((session) => session.id).join('|')
  const captureLayout = useFlipLayout(layoutKey, '[data-session-flip]')

  return (
    <div className="space-y-6">
      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['ALL', 'OPEN', 'UPCOMING', 'CLOSING_SOON', 'CLOSED', 'DRAFT'] as const).map((status) => (
            <button
              key={status}
              aria-pressed={filter === status}
              onClick={() => { captureLayout(); setFilter(status) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-nice-blue-500 text-white shadow-subtle'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'ALL' ? 'All Sessions' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { captureLayout(); setSearch(e.target.value) }}
            aria-label="Search sessions by title or location"
            placeholder="Search sessions…"
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20 focus:border-nice-blue-500"
          />
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredSessions.length > 0 ? (
        <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </StaggerReveal>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-nice-blue-50 border border-nice-blue-100 flex items-center justify-center text-nice-blue-600 mb-3">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No sessions found</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {search || filter !== 'ALL'
              ? 'Try adjusting your search criteria or filter options.'
              : 'Create your first NiCE session to start collecting verified attendance.'}
          </p>
          {canCreate ? <Link href="/sessions/new" className="mt-4">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create Session
            </Button>
          </Link> : <RestrictedActionButton message={`Access denied: your ${role} role cannot create sessions. Ask an administrator or manager for access.`} className="mt-4" variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Create Session</RestrictedActionButton>}
        </div>
      )}
    </div>
  )
}
