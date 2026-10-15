import React from 'react'
import Link from 'next/link'
import { Users, Search, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table'
import { Button } from '../../../components/ui/Button'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { redirect } from 'next/navigation'
import { RestrictedActionButton } from '../../../components/ui/RestrictedAction'
import { TourTarget } from '../../../components/onboarding/TourTarget'
import { getParticipantDirectory } from '../../../lib/participants/participant-service'
import { formatDate } from '../../../utils/date'

export default async function ParticipantsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/dashboard')
  const canExport = hasPermission(user.role, 'attendance:export')
  const params = await searchParams
  const searchValue = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim().slice(0, 160) || ''
  const searchNeedle = searchValue.toLocaleLowerCase()
  const allParticipants = await getParticipantDirectory()
  const directory = searchNeedle
    ? allParticipants.filter((participant) => [participant.name, participant.email, participant.primaryRole, participant.organization]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(searchNeedle)))
    : allParticipants
  return (
    <TourTarget name="platform-participants" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Participants Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            One profile per person across session check-ins and Custom Form responses.
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
            <CardDescription>Session check-ins and form responses remain separate while profiles are matched by email.</CardDescription>
          </div>
          <form action="/participants" className="relative flex w-full sm:w-80">
            <label className="sr-only" htmlFor="participant-search">Search participants</label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="participant-search"
              name="q"
              type="text"
              defaultValue={searchValue}
              placeholder="Search by name, institution…"
              className="w-full pl-9 pr-16 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold text-nice-blue-700 hover:bg-nice-blue-50">Search</button>
          </form>
        </CardHeader>
        <CardContent>
          {searchValue && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><span>{directory.length} participant{directory.length === 1 ? '' : 's'} match “{searchValue}”</span><Link href="/participants" className="font-semibold text-nice-blue-700 hover:underline">Clear search</Link></div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Primary Role</TableHead>
                <TableHead>Organization / School</TableHead>
                <TableHead>Session Check-ins</TableHead>
                <TableHead>Form Responses</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directory.length === 0 ? <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">{searchValue ? 'No participants match this search' : 'No participants registered yet'}</p>
                    <p className="text-[11px] text-slate-400">{searchValue ? 'Try a name, email address, role, school, or organization.' : 'People appear after a session check-in or a Custom Form response.'}</p>
                  </div>
                </TableCell>
              </TableRow> : directory.map((participant) => <TableRow key={participant.email}>
                <TableCell><span className="block font-medium text-slate-800">{participant.name}</span><span className="text-xs text-slate-500">{participant.email}</span></TableCell>
                <TableCell>{participant.primaryRole || '—'}</TableCell>
                <TableCell>{participant.organization || '—'}</TableCell>
                <TableCell>{participant.sessionCheckInCount}</TableCell>
                <TableCell>{participant.formResponseCount}</TableCell>
                <TableCell><span className="flex flex-wrap gap-1">{participant.sources.map((source) => <span key={source} className={source === 'SESSION' ? 'rounded-full bg-nice-blue-50 px-2 py-0.5 text-[11px] font-medium text-nice-blue-700' : 'rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700'}>{source === 'SESSION' ? 'Sessions' : 'Custom Forms'}</span>)}</span></TableCell>
                <TableCell>{formatDate(participant.lastActivityAt)}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TourTarget>
  )
}
