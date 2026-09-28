'use client'

import React, { use, useCallback, useState } from 'react'
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
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Session } from '../../../../types/session'
import { Attendance } from '../../../../types/attendance'
import { SessionAttendeesTable } from '../../../../components/attendance/SessionAttendeesTable'
import { SessionLoadingState } from '../../../../components/sessions/SessionLoadingState'
import { Modal } from '../../../../components/ui/Modal'
import { Input } from '../../../../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card'
import { Badge } from '../../../../components/ui/Badge'
import { Button } from '../../../../components/ui/Button'
import { formatDate } from '../../../../utils/date'
import { ROLE_PERMISSIONS } from '../../../../lib/permissions/roles'
import type { UserRole } from '../../../../types/user'
import { RestrictedActionButton } from '../../../../components/ui/RestrictedAction'

export default function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loadError, setLoadError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [attendees, setAttendees] = useState<Attendance[]>([])
  const [attendeeError, setAttendeeError] = useState('')
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [accessChecked, setAccessChecked] = useState(false)
  const [authError, setAuthError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [overrideMinutes, setOverrideMinutes] = useState(10)
  const [overrideBusy, setOverrideBusy] = useState(false)
  const [overrideError, setOverrideError] = useState('')
  const [clockNow, setClockNow] = useState(0)
  const closeDeleteConfirm = useCallback(() => {
    if (deleting) return
    setDeleteConfirmOpen(false)
    setDeletePassword('')
    setShowDeletePassword(false)
    setDeleteError('')
  }, [deleting])

  React.useEffect(() => {
    fetch('/api/auth').then(async (response) => {
      const result = await response.json()
      if (!response.ok || !result.user?.role) throw new Error('Unable to verify your role permissions.')
      setCurrentRole(result.user.role as UserRole)
    }).catch(() => setAuthError('Access denied: unable to verify your role permissions. Restricted actions are disabled.'))
      .finally(() => setAccessChecked(true))

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

  React.useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 5_000)
    const refresh = window.setInterval(() => {
      fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) return
          const result = await response.json()
          if (result.data) setSession(result.data as Session)
        })
        .catch(() => undefined)
    }, 30_000)
    return () => { window.clearInterval(timer); window.clearInterval(refresh) }
  }, [sessionId])

  if (!session) {
    if (loadError) return <p role="alert" className="p-6 text-sm text-rose-700">{loadError}</p>
    return <SessionLoadingState />
  }

  const attendanceUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/attend/${session.publicToken}`
    : `/attend/${session.publicToken}`
  const permissions = currentRole ? ROLE_PERMISSIONS[currentRole] ?? [] : []
  const canEdit = permissions.includes('session:edit')
  const canExport = permissions.includes('attendance:export')
  const canDelete = permissions.includes('session:delete')
  const canOverrideAttendance = permissions.includes('session:override')
  const overrideActive = !!session.attendanceOverrideUntil && new Date(session.attendanceOverrideUntil).getTime() > clockNow

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(attendanceUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleStatus = async () => {
    setStatusError('')
    if (!canEdit) {
      setStatusError('Access denied: your role cannot change this session status.')
      return
    }
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

  const handleDeleteSession = async () => {
    setDeleteError('')
    if (!deletePassword) {
      setDeleteError('Enter your password to confirm permanent deletion.')
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(session.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to delete this session.')
      router.push('/sessions')
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Unable to delete this session.')
      setDeleting(false)
    }
  }

  const handleToggleAttendanceOverride = async () => {
    setOverrideError('')
    if (!canOverrideAttendance) {
      setOverrideError('Access denied: only administrators can extend the check-in window.')
      return
    }
    setOverrideBusy(true)
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(session.id)}/attendance-override`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideActive ? { open: false } : { open: true, minutes: overrideMinutes }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not change the extra check-in window.')
      setSession(result.data as Session)
    } catch (error) {
      setOverrideError(error instanceof Error ? error.message : 'Could not change the extra check-in window.')
    } finally {
      setOverrideBusy(false)
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
                <Badge variant={overrideActive || isOpen ? 'success' : 'neutral'} dot size="sm">
                  {overrideActive ? 'Extra Check-in Open' : isOpen ? 'Attendance Open' : 'Attendance Closed'}
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
              {accessChecked && canEdit ? <Link href={`/sessions/${session.id}/edit`}>
                <Button variant="outline" size="sm">Edit Session</Button>
              </Link> : accessChecked ? <RestrictedActionButton message={authError || `Access denied: your ${currentRole} role cannot edit session details.`} variant="outline" size="sm">Edit Session</RestrictedActionButton> : <Button disabled variant="outline" size="sm">Edit Session</Button>}
              <Link href={`/sessions/${session.id}/analytics`}>
                <Button variant="outline" size="sm" leftIcon={<BarChart3 className="w-4 h-4" />}>
                  Analytics
                </Button>
              </Link>
              {accessChecked && permissions.includes('qr:generate') ? <Link href={`/sessions/${session.id}/qr`}>
                <Button variant="primary" size="sm" leftIcon={<QrCode className="w-4 h-4" />}>
                  Display QR
                </Button>
              </Link> : accessChecked ? <RestrictedActionButton message={authError || `Access denied: your ${currentRole} role cannot generate or display attendance QR materials.`} variant="primary" size="sm" leftIcon={<QrCode className="w-4 h-4" />}>Display QR</RestrictedActionButton> : <Button disabled variant="primary" size="sm" leftIcon={<QrCode className="w-4 h-4" />}>Display QR</Button>}

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied' : 'Copy Link'}
              </Button>

              {accessChecked && canEdit ? <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
              >
                {isOpen ? 'Close Attendance' : 'Open Attendance'}
              </Button> : accessChecked ? <RestrictedActionButton message={authError || `Access denied: your ${currentRole} role cannot change this session status.`} variant="outline" size="sm">{isOpen ? 'Close Attendance' : 'Open Attendance'}</RestrictedActionButton> : <Button disabled variant="outline" size="sm">{isOpen ? 'Close Attendance' : 'Open Attendance'}</Button>}
              {accessChecked && canDelete && <Button variant="danger" size="sm" onClick={() => { setDeleteError(''); setDeletePassword(''); setShowDeletePassword(false); setDeleteConfirmOpen(true) }} leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete Session
              </Button>}
            </div>
          </div>
          {accessChecked && canOverrideAttendance && <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            {!overrideActive && <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              Extra check-in duration
              <select value={overrideMinutes} onChange={(event) => setOverrideMinutes(Number(event.target.value))} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800">
                {[5, 10, 15, 30, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
              </select>
            </label>}
            <Button variant={overrideActive ? 'danger' : 'secondary'} size="sm" disabled={overrideBusy} onClick={handleToggleAttendanceOverride}>
              {overrideBusy ? 'Updating check-in…' : overrideActive ? 'Close Extra Check-in' : `Open Check-in for ${overrideMinutes} min`}
            </Button>
            {overrideActive && <p role="status" className="text-xs text-emerald-700">Public check-in is open until {new Date(session.attendanceOverrideUntil!).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' })} CAT. It will close automatically.</p>}
          </div>}
          {statusError && <p role="alert" className="mt-3 text-sm text-rose-700">{statusError}</p>}
          {overrideError && <p role="alert" className="mt-3 text-sm text-rose-700">{overrideError}</p>}
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
            {accessChecked && canExport ? <a href={`/api/exports?sessionId=${encodeURIComponent(session.id)}`} download>
              <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export CSV</Button>
            </a> : accessChecked ? <RestrictedActionButton message={authError || `Access denied: your ${currentRole} role cannot export attendance records. Ask an administrator or manager for access.`} variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export CSV</RestrictedActionButton> : <Button disabled variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export CSV</Button>}
        </CardHeader>
        <CardContent>
          <SessionAttendeesTable
            records={attendees}
            questions={session.questions}
            error={attendeeError}
            emptyMessage="No attendees have checked in yet. Share the QR code with participants."
          />
        </CardContent>
      </Card>
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
        title="Confirm permanent deletion"
        description="Verify your password before deleting this session."
        className="max-w-md"
      >
        <form onSubmit={(event) => { event.preventDefault(); void handleDeleteSession() }} className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <p className="font-semibold">This cannot be undone.</p>
            <p className="mt-1">Deleting “{session.title}” will also permanently remove {session._count?.attendance ?? attendees.length} attendance record(s) and their submitted responses.</p>
          </div>
          <div className="relative">
            <Input
              label="Your account password"
              type={showDeletePassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              disabled={deleting}
              error={deleteError}
              className="pr-11"
            />
            <button
              type="button"
              aria-label={showDeletePassword ? 'Hide password' : 'Show password'}
              aria-pressed={showDeletePassword}
              onClick={() => setShowDeletePassword((visible) => !visible)}
              disabled={deleting}
              className="absolute right-2 top-7 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nice-blue-500 disabled:opacity-50"
            >
              {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={deleting} onClick={closeDeleteConfirm}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={deleting} leftIcon={<Trash2 className="h-4 w-4" />}>
              {deleting ? 'Deleting session…' : 'Verify & Delete Session'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
