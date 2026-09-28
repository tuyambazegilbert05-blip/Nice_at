import React from 'react'
import { Download, Search, Filter, UserCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table'
import { Button } from '../../../components/ui/Button'
import { getAllAttendance } from '../../../lib/attendance/check-in-service'
import { getAllSessions } from '../../../lib/sessions/session-service'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { redirect } from 'next/navigation'
import { RestrictedActionButton } from '../../../components/ui/RestrictedAction'
import { TourTarget } from '../../../components/onboarding/TourTarget'

export default async function AttendancePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/dashboard')
  const canExport = hasPermission(user.role, 'attendance:export')
  const [records, sessions] = await Promise.all([getAllAttendance(), getAllSessions()])
  const sessionTitles = new Map(sessions.map((session) => [session.id, session.title]))
  return (
    <TourTarget name="platform-attendance" className="space-y-6">
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
              Attendance Log
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Global repository of verified participant check-ins across all NiCE Club activities.
            </p>
          </div>
        </div>
        {canExport ? <a href="/api/exports" download="nice-attendance-master.csv">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Export Master CSV
          </Button>
        </a> : <RestrictedActionButton message={`Access denied: your ${user.role} role cannot export attendance records. Ask an administrator or manager for access.`} variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export Master CSV</RestrictedActionButton>}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>All Records</CardTitle>
            <CardDescription>Real-time attendance logs across active sessions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search attendee by name/email…"
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20"
              />
            </div>
            <Button variant="outline" size="sm" leftIcon={<Filter className="w-3.5 h-3.5" />}>
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Email / Phone</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Academic Info</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recorded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <UserCheck className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">No attendance records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Check-in entries recorded via session QR codes will populate automatically.
                    </p>
                  </div>
                </TableCell>
              </TableRow> : records.map((record) => <TableRow key={record.id}>
                <TableCell><span className="font-medium text-slate-800">{record.fullName}</span></TableCell>
                <TableCell><span className="block">{record.email}</span><span className="text-xs text-slate-500">{record.phone}</span></TableCell>
                <TableCell>{sessionTitles.get(record.sessionId) || 'Archived session'}</TableCell>
                <TableCell>{[record.faculty, record.program, record.yearOfStudy].filter(Boolean).join(' · ') || '—'}</TableCell>
                <TableCell>{record.participantType}</TableCell>
                <TableCell>{new Date(record.submittedAt).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TourTarget>
  )
}
