import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { getSessionById } from '../../../../../lib/sessions/session-service'
import { getAttendanceForSession } from '../../../../../lib/attendance/check-in-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/Table'

export default async function SessionAttendeesPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/dashboard')
  const { sessionId } = await params
  const session = await getSessionById(sessionId)
  if (!session) notFound()
  const attendance = await getAttendanceForSession(sessionId)

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold text-slate-900">Session Attendees</h1><p className="mt-1 text-sm text-slate-500">{session.title} · {attendance.length} recorded check-ins</p></div>
    <Card>
      <CardHeader><CardTitle>Attendance records</CardTitle><CardDescription>Private participant details for this session.</CardDescription></CardHeader>
      <CardContent><Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email / Phone</TableHead><TableHead>Academic information</TableHead><TableHead>Participant type</TableHead><TableHead>Checked in</TableHead></TableRow></TableHeader>
        <TableBody>{attendance.length ? attendance.map((record) => <TableRow key={record.id}>
          <TableCell>{record.fullName}</TableCell>
          <TableCell><span className="block">{record.email}</span><span className="text-xs text-slate-500">{record.phone}</span></TableCell>
          <TableCell>{[record.faculty, record.program, record.yearOfStudy].filter(Boolean).join(' · ') || '—'}</TableCell>
          <TableCell>{record.participantType}</TableCell>
          <TableCell>{new Date(record.submittedAt).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</TableCell>
        </TableRow>) : <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">No attendance records for this session yet.</TableCell></TableRow>}</TableBody>
      </Table></CardContent>
    </Card>
  </div>
}
