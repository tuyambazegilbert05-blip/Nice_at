import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { getSessionById } from '../../../../../lib/sessions/session-service'
import { getAttendanceForSession } from '../../../../../lib/attendance/check-in-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/Card'
import { SessionAttendeesTable } from '../../../../../components/attendance/SessionAttendeesTable'

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
      <CardContent><SessionAttendeesTable records={attendance} questions={session.questions} /></CardContent>
    </Card>
  </div>
}
