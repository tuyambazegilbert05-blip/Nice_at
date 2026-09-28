import React from 'react'
import { Users, Search, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table'
import { Button } from '../../../components/ui/Button'
import { getAllAttendance } from '../../../lib/attendance/check-in-service'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { redirect } from 'next/navigation'
import { RestrictedActionButton } from '../../../components/ui/RestrictedAction'
import { TourTarget } from '../../../components/onboarding/TourTarget'

export default async function ParticipantsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/dashboard')
  const canExport = hasPermission(user.role, 'attendance:export')
  const attendance = await getAllAttendance()
  const participants = new Map<string, { name: string; email: string; type: string; faculty: string | null; sessions: Set<string>; lastAttended: string }>()
  for (const record of attendance) {
    const key = record.email.trim().toLowerCase()
    const existing = participants.get(key)
    if (existing) {
      existing.sessions.add(record.sessionId)
      if (new Date(record.submittedAt) > new Date(existing.lastAttended)) existing.lastAttended = String(record.submittedAt)
    } else {
      participants.set(key, { name: record.fullName, email: record.email, type: record.participantType, faculty: record.faculty || null, sessions: new Set([record.sessionId]), lastAttended: String(record.submittedAt) })
    }
  }
  const directory = [...participants.values()].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <TourTarget name="platform-participants" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Participants Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory of attendees, students, researchers, and clean energy enthusiasts.
          </p>
        </div>
        {canExport ? <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
          Export Directory
        </Button> : <RestrictedActionButton message={`Access denied: your ${user.role} role cannot export participant records. Ask an administrator or manager for access.`} variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export Directory</RestrictedActionButton>}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Registered Individuals</CardTitle>
            <CardDescription>Profiles aggregate participation across all club sessions</CardDescription>
          </div>
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, institution…"
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Primary Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Total Sessions</TableHead>
                <TableHead>Last Attended</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directory.length === 0 ? <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No participants registered yet</p>
                    <p className="text-[11px] text-slate-400">Attendees will be indexed automatically when checking into events.</p>
                  </div>
                </TableCell>
              </TableRow> : directory.map((participant) => <TableRow key={participant.email}>
                <TableCell><span className="block font-medium text-slate-800">{participant.name}</span><span className="text-xs text-slate-500">{participant.email}</span></TableCell>
                <TableCell>{participant.type}</TableCell>
                <TableCell>{participant.faculty || '—'}</TableCell>
                <TableCell>{participant.sessions.size}</TableCell>
                <TableCell>{new Date(participant.lastAttended).toLocaleDateString('en-RW', { timeZone: 'Africa/Kigali' })}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TourTarget>
  )
}
