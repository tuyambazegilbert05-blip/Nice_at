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
} from 'lucide-react'
import { getSessionById } from '../../../../lib/sessions/session-service'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card'
import { Badge } from '../../../../components/ui/Badge'
import { Button } from '../../../../components/ui/Button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table'
import { formatDate } from '../../../../utils/date'

const FALLBACK_SESSION = {
  title: 'Rwanda Youth Nuclear Summit 2026',
  description: 'Youth-led conference exploring clean nuclear energy for Rwanda and East Africa sustainable development.',
  type: 'YOUTH_EVENT' as const,
  location: 'Kigali Convention Centre, Kigali, Rwanda',
  date: '2026-08-14T09:00:00.000Z',
  startTime: '09:00',
  endTime: '13:00',
  attendanceOpens: '2026-08-14T08:00:00.000Z',
  attendanceCloses: '2026-08-14T14:00:00.000Z',
  status: 'OPEN' as const,
  publicToken: 'nice-summit-2026-demo-token',
  duplicatePolicy: 'PREVENT_BY_EMAIL' as const,
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z',
  _count: { attendance: 0 },
}

export default function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const session = getSessionById(sessionId) || {
    id: sessionId,
    ...FALLBACK_SESSION,
  }

  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(session.status === 'OPEN')

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
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? 'Close Attendance' : 'Open Attendance'}
              </Button>
            </div>
          </div>
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
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
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
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  No attendees have checked in yet. Share the QR code with participants.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
