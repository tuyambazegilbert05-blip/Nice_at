'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, MapPin, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { ParticipantType } from '../../../types'
import { formatDate, formatDateTime } from '../../../utils/date'
import { LoadingSpinner } from '../../../lottie/loading'
import { ErrorAlertAnimation } from '../../../lottie/errors'

type AttendanceState = 'open' | 'closing_soon' | 'scheduled' | 'not_opened' | 'closed' | 'expired'

const ATTENDANCE_STATE_LABEL: Record<AttendanceState, string> = {
  open: 'Attendance Open',
  closing_soon: 'Closing Soon',
  scheduled: 'Check-in Scheduled',
  not_opened: 'Awaiting Organizer',
  closed: 'Attendance Closed',
  expired: 'Check-in Window Ended',
}

const ATTENDANCE_STATE_MESSAGE: Record<AttendanceState, string> = {
  open: 'Check-in is accepting submissions now.',
  closing_soon: 'Check-in is open, but the submission window is nearly over.',
  scheduled: 'Check-in has not opened yet. The opening time is shown above.',
  not_opened: 'The event team has not opened check-in yet.',
  closed: 'The event team has closed attendance for this session.',
  expired: 'The scheduled check-in window has ended.',
}

type PublicSession = {
  title: string
  description: string
  type: string
  location: string
  date: string
  startTime: string
  endTime: string
  attendanceOpens: string
  attendanceCloses: string
  status: string
  isOpen: boolean
  attendanceState: AttendanceState
}

export default function AttendTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Session metadata loaded from verification
  const [session, setSession] = useState<PublicSession | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)

  // Form Fields per Master Spec (Section 13 & 14)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [faculty, setFaculty] = useState('')
  const [program, setProgram] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [participantType, setParticipantType] = useState<ParticipantType>('Student')
  const [keyTakeaway, setKeyTakeaway] = useState('')
  const [feedback, setFeedback] = useState('')
  const [emailUpdatesOptIn, setEmailUpdatesOptIn] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  useEffect(() => {
    let active = true
    const verifyToken = async (initial = false) => {
      try {
        const res = await fetch(`/api/qr?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !data.session) throw new Error(data.error || 'This attendance link is invalid.')
        if (active) {
          setSession(data.session as PublicSession)
          setLinkError(null)
        }
      } catch {
        if (active) setLinkError('This attendance link is invalid or the server could not be reached.')
      } finally {
        if (active && initial) setLoading(false)
      }
    }

    void verifyToken(true)
    const interval = window.setInterval(() => { void verifyToken() }, 30_000)
    const refreshOnFocus = () => { void verifyToken() }
    window.addEventListener('focus', refreshOnFocus)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshOnFocus)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (honeypot) return // Bot protection

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          fullName,
          email,
          phone,
          faculty,
          program,
          yearOfStudy,
          participantType,
          keyTakeaway,
          feedback,
          emailUpdatesOptIn,
          honeypot,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        router.push(`/attend/${token}/success`)
      } else {
        setError(data.error || 'Attendance submission could not be completed.')
      }
    } catch {
      setError('Unable to reach the server. Your attendance was not saved; please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <LoadingSpinner label="Verifying attendance session" className="mb-3 h-16 w-16" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/NiCE-Logo-Animated.gif" alt="NiCE Club Logo" className="w-20 h-20 object-contain drop-shadow-sm mb-3" />
        <p className="text-xs font-semibold text-slate-500 tracking-wide">
          Verifying session check-in…
        </p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 bg-scientific-grid">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden p-3 sm:p-5 lg:p-8">
        <div className="absolute inset-0">
          <div className="absolute left-[9%] top-[12%] h-14 w-14 rounded-full bg-cover bg-center opacity-12 sm:left-[12%] sm:top-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute left-[20%] top-[26%] h-10 w-10 rounded-full bg-cover bg-center opacity-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute left-[32%] top-[8%] h-8 w-8 rounded-full bg-cover bg-center opacity-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute right-[9%] top-[12%] h-14 w-14 rounded-full bg-cover bg-center opacity-12 sm:right-[12%] sm:top-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute right-[20%] top-[26%] h-10 w-10 rounded-full bg-cover bg-center opacity-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute right-[32%] top-[8%] h-8 w-8 rounded-full bg-cover bg-center opacity-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute bottom-[12%] left-[12%] h-14 w-14 rounded-full bg-cover bg-center opacity-12 sm:left-[14%] sm:bottom-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute bottom-[20%] left-[24%] h-10 w-10 rounded-full bg-cover bg-center opacity-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute bottom-[10%] right-[12%] h-14 w-14 rounded-full bg-cover bg-center opacity-12 sm:right-[14%] sm:bottom-[14%] sm:h-18 sm:w-18 lg:h-20 lg:w-20" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
          <div className="absolute bottom-[20%] right-[24%] h-10 w-10 rounded-full bg-cover bg-center opacity-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16" style={{ backgroundImage: 'url("/images/Atom-Illustration-background.webp")' }} />
        </div>
      </div>
      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        {/* Organization Brand Header */}
        <div className="text-center space-y-2.5 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/NiCE-Logo-Animated.gif"
            alt="NiCE Club Rwanda"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm rounded-xl"
          />
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-nice-blue-50 border border-nice-blue-100 text-nice-blue-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-nice-blue-600" />
            <span>NiCE Club Rwanda</span>
          </div>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-extrabold">
            Nuclear is Clean Energy
          </p>
        </div>

        {/* Session Overview Card */}
        {session && (
          <Card className="border-nice-blue-100 bg-white shadow-elevated overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-nice-blue-500 via-emerald-500 to-cyan-500" />
            <CardContent className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="default" size="sm">
                  {session.type}
                </Badge>
                <Badge
                  variant={session.attendanceState === 'open' ? 'success' : session.attendanceState === 'closing_soon' ? 'warning' : 'neutral'}
                  size="sm"
                  dot
                >
                  {ATTENDANCE_STATE_LABEL[session.attendanceState]}
                </Badge>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {session.title}
              </h1>

              {session.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {session.description}
                </p>
              )}

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-nice-blue-600 shrink-0" />
                  <span>{formatDate(session.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-nice-blue-600 shrink-0" />
                  <span>{session.startTime} — {session.endTime} CAT</span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{session.location}</span>
                </div>
                <div className="flex items-start gap-1.5 sm:col-span-2">
                  <Clock className="mt-0.5 w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong className="font-semibold text-slate-700">Check-in window:</strong> {formatDateTime(session.attendanceOpens)} – {formatDateTime(session.attendanceCloses)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {session?.isOpen ? (
        <Card className="border-slate-200 bg-white shadow-elevated">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Bot Honeypot */}
              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Section 1: Personal Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-nice-blue-50 text-nice-blue-600 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">Personal Information</h3>
                </div>

                <Input
                  label="Full Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Marie Claire Uwase"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="uwase@example.rw"
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250 788 000 000"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                  <input type="checkbox" checked={emailUpdatesOptIn} onChange={(event) => setEmailUpdatesOptIn(event.target.checked)} className="mt-0.5 rounded border-slate-300 text-sky-700 focus:ring-sky-600" />
                  <span>I agree to receive occasional NiCE Club updates about future clean energy learning events. This is optional and does not affect my attendance registration.</span>
                </label>
              </div>

              {/* Section 2: Academic & Participation */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-nice-blue-50 text-nice-blue-600 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">Academic & Role Details</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Participant Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={participantType}
                    onChange={(e) => setParticipantType(e.target.value as ParticipantType)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20 focus:border-nice-blue-500"
                  >
                    <option value="Student">Student</option>
                    <option value="Researcher">Researcher</option>
                    <option value="Lecturer">Lecturer / Academic</option>
                    <option value="Professional">Energy Professional</option>
                    <option value="School Student">High School Student</option>
                    <option value="Guest">Guest / Community Member</option>
                    <option value="Partner">Partner / Organization</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Faculty / Department"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    placeholder="e.g. School of Science & Tech"
                  />

                  <Input
                    label="Program / Major"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="e.g. Physics / Electrical Eng"
                  />
                </div>

                <Input
                  label="Year of Study (If student)"
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  placeholder="e.g. Year 3 / Masters"
                />
              </div>

              {/* Section 3: Reflection & Feedback */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-nice-blue-50 text-nice-blue-600 font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">Reflection & Insights</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    What is your key takeaway or question today?
                  </label>
                  <textarea
                    rows={3}
                    value={keyTakeaway}
                    onChange={(e) => setKeyTakeaway(e.target.value)}
                    placeholder="Share what stood out to you about nuclear energy, safety, or application in Rwanda..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20 focus:border-nice-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Suggestions or feedback for NiCE Club?
                  </label>
                  <textarea
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Optional recommendations for future workshops or discussions..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20 focus:border-nice-blue-500"
                  />
                </div>
              </div>

              {/* Sticky / Accessible Submit Action */}
              <div className="pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full text-base py-3"
                  isLoading={submitting}
                  leftIcon={<CheckCircle2 className="w-5 h-5" />}
                >
                  Submit My Attendance
                </Button>
                <p className="text-center text-[11px] text-slate-400 mt-3">
                  Your information is securely handled and will not be shared publicly.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        ) : session ? (
          <Card className="border-amber-200 bg-white shadow-elevated">
            <CardContent className="p-6 sm:p-8 text-center space-y-3">
              <Badge variant={session.attendanceState === 'closed' || session.attendanceState === 'expired' ? 'neutral' : 'warning'} dot>
                {ATTENDANCE_STATE_LABEL[session.attendanceState]}
              </Badge>
              <h2 className="text-lg font-bold text-slate-900">Attendance is not accepting submissions</h2>
              <p className="text-sm text-slate-600">{ATTENDANCE_STATE_MESSAGE[session.attendanceState]}</p>
              <p className="text-xs text-slate-500">Check-in window: {formatDateTime(session.attendanceOpens)} – {formatDateTime(session.attendanceCloses)}</p>
            </CardContent>
          </Card>
        ) : linkError ? (
          <Card className="border-rose-200 bg-white shadow-elevated">
            <CardContent className="flex items-center gap-3 p-5 text-sm text-rose-700" role="alert"><ErrorAlertAnimation label="Attendance link error" className="h-10 w-10 shrink-0" /><span>{linkError}</span></CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
