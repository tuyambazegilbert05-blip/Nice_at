import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getAllSessions } from '../../../lib/sessions/session-service'
import { SessionList } from '../../../components/sessions/SessionList'
import { Button } from '../../../components/ui/Button'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { redirect } from 'next/navigation'

export default async function SessionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'session:view')) redirect('/dashboard')
  const sessions = await getAllSessions()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/NiCE-Logo-Animated.gif"
            alt="NiCE Club Rwanda"
            className="w-12 h-12 rounded-xl object-contain bg-white shadow-subtle p-0.5 border border-slate-200/80"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Scientific Sessions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage clean energy lectures, workshops, youth outreach, and summits across Rwanda.
            </p>
          </div>
        </div>
        <Link href="/sessions/new">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Create Session
          </Button>
        </Link>
      </div>

      <SessionList sessions={sessions} />
    </div>
  )
}
