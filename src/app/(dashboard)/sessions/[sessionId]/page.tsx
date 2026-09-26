'use client'

import React, { use, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Share2,
  Download,
  Users,
  CheckCircle,
  Copy,
  Check,
  BarChart3,
} from 'lucide-react'
import { Session } from '../../../../types/session'
import { Attendance } from '../../../../types/attendance'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card'
import { Badge } from '../../../../components/ui/Badge'
import { Button } from '../../../../components/ui/Button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table'
import { formatDate } from '../../../../utils/date'

export default function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const [session, setSession] = useState<Session | null>(null)
  const [loadError, setLoadError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [attendees, setAttendees] = useState<Attendance[]>([])
  const [attendeeError, setAttendeeError] = useState('')

  React.useEffect(() => {
    fetch(`/api/sessions/${encodeURIComponent(sessionId)}`).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load session')
      setSession(result.data)
      setIsOpen(result.data.status === 'OPEN')
      try {
        const attendanceResponse = await fetch(`/api/attendance?sessionId=${encodeURIComponent(sessionId)}`)
        const attendanceResult = await attendanceResponse.json()
        if (!attendanceResponse.ok) throw new Error(attendanceResult.error || 'Unable to load attendance records')
        setAttendees(attendanceResult.data)
      } catch (error) {
        setAttendeeError(error instanceof Error ? error.message : 'Unable to load attendance records')
      }
    }).catch((error) => setLoadError(error instanceof Error ? error.message : 'Unable to load session'))
  }, [sessionId])

  if (!session) return <p className="p-6 text-sm text-slate-600">{loadError || 'Loading session…'}</p>

  const attendanceUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/attend/${session.publicToken}`
    : `/attend/${session.publicToken}`

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(attendanceUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleStatus = async () => {
    setStatusError('')
    const status = isOpen ? 'CLOSED' : 'OPEN'
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(session.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to update session status')
      setSession(result.data)
      setIsOpen(result.data.status === 'OPEN')
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Unable to update session status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="border-slate-200">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" size="sm">
                  {session.type.replace('_', ' ')}
                </Badge>
                <Badge variant={isOpen ? 'success' : 'neutral'} dot size="sm">
                  {isOpen ? 'Attendance Open' : 'Attendance Closed'}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {session.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                {session.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-nice-blue-600" />
                  <span>{formatDate(session.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-nice-blue-600" />
                  <span>{session.startTime} — {session.endTime} CAT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{session.location}</span>
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href={`/sessions/${session.id}/analytics`}>
                <Button variant="outline" size="sm" leftIcon={<BarChart3 className="w-4 h-4" />}>
                  Analytics
                </Button>
              </Link>
              <Link href={`/sessions/${session.id}/qr`}>
                <Button variant="primary" size="sm" leftIcon={<QrCode className="w-4 h-4" />}>
                  Display QR
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied' : 'Copy Link'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
              >
                {isOpen ? 'Close Attendance' : 'Open Attendance'}
              </Button>
            </div>
          </div>
          {statusError && <p role="alert" className="mt-3 text-sm text-rose-700">{statusError}</p>}
        </CardContent>
      </Card>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Verified Attendees</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{session._count?.attendance || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-nice-blue-50 text-nice-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Duplicate Prevention</p>
              <p className="text-xs font-bold text-slate-900 mt-2">{session.duplicatePolicy}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Public Token</p>
              <p className="text-xs font-mono text-slate-700 mt-2 truncate max-w-[160px]">
                {session.publicToken}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Roster Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Attendance Roster</CardTitle>
            <CardDescription>Verified participant check-ins captured through the QR link</CardDescription>
          </div>
            <a href={`/api/exports?sessionId=${encodeURIComponent(session.id)}`} download>
              <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export CSV</Button>
            </a>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Participant Type</TableHead>
                <TableHead>Faculty / Program</TableHead>
                <TableHead>Check-In Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendeeError && <TableRow><TableCell colSpan={5} className="text-center py-8 text-rose-700">{attendeeError}</TableCell></TableRow>}
              {!attendeeError && attendees.length === 0 ? <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  No attendees have checked in yet. Share the QR code with participants.
                </TableCell>
              </TableRow> : attendees.map((attendee) => <TableRow key={attendee.id}>
                <TableCell>{attendee.fullName}</TableCell>
                <TableCell>{attendee.email}</TableCell>
                <TableCell>{attendee.participantType}</TableCell>
                <TableCell>{[attendee.faculty, attendee.program].filter(Boolean).join(' · ') || '—'}</TableCell>
                <TableCell>{new Date(attendee.submittedAt).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
