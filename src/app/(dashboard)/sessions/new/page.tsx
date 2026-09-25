'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card'
import { Input } from '../../../../components/ui/Input'
import { Button } from '../../../../components/ui/Button'
import { SessionType, DuplicatePolicy } from '../../../../types/session'

function getKigaliDate(): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

export default function NewSessionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1: Basic Info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<SessionType>('WORKSHOP')

  // Step 2: Location
  const [venue, setVenue] = useState('')
  const [city, setCity] = useState('Kigali')
  const [country] = useState('Rwanda')

  // Step 3: Date & Time
  const [date, setDate] = useState(getKigaliDate())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [attendanceOpens, setAttendanceOpens] = useState('08:30')
  const [attendanceCloses, setAttendanceCloses] = useState('12:30')

  // Step 4: Duplicate Policy
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('PREVENT_BY_EMAIL')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
    const response = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      title: title || 'NiCE Clean Energy Workshop',
      description,
      type,
      location: `${venue || 'Main Auditorium'}, ${city}, ${country}`,
      date,
      startTime,
      endTime,
      attendanceOpens: new Date(`${date}T${attendanceOpens}:00+02:00`).toISOString(),
      attendanceCloses: new Date(`${date}T${attendanceCloses}:00+02:00`).toISOString(),
      duplicatePolicy,
    }) })
    const result = await response.json()
    if (!response.ok || !result.success) throw new Error(result.error || 'Unable to save session')
    router.push(`/sessions/${result.data.id}/qr`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save session')
      setSubmitting(false)
    }
  }

  const steps = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Location' },
    { num: 3, label: 'Schedule' },
    { num: 4, label: 'Review' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/sessions">
          <button className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Create New Session</h1>
          <p className="text-xs text-slate-500">Configure event details and attendance check-in window.</p>
        </div>
      </div>

      {/* Wizard Step Progress */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`p-3 rounded-xl border text-left transition-all ${
              step === s.num
                ? 'bg-nice-blue-50/80 border-nice-blue-400 text-nice-blue-900 shadow-subtle'
                : step > s.num
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">Step {s.num}</span>
              {step > s.num && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </div>
            <p className="text-xs font-semibold mt-0.5 truncate">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Step Form Cards */}
      <Card className="shadow-elevated border-slate-200">
        <CardContent className="p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <CardTitle className="text-lg">Step 1 — Basic Information</CardTitle>
              <CardDescription>Define the educational topic, scope, and format.</CardDescription>

              <Input
                label="Session Topic / Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rwanda Youth Nuclear Summit 2026"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Session Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as SessionType)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20 focus:border-nice-blue-500"
                >
                  <option value="WORKSHOP">Workshop</option>
                  <option value="LECTURE">Lecture</option>
                  <option value="SEMINAR">Seminar</option>
                  <option value="YOUTH_EVENT">Youth Event</option>
                  <option value="UNIVERSITY_SESSION">University Session</option>
                  <option value="SCHOOL_OUTREACH">School Outreach</option>
                  <option value="CONFERENCE">Conference</option>
                  <option value="WEBINAR">Webinar</option>
                  <option value="TRAINING">Training</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline key learning outcomes, speakers, and focus areas..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20 focus:border-nice-blue-500"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="primary" onClick={() => setStep(2)}>
                  Continue to Location →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <CardTitle className="text-lg">Step 2 — Location & Venue</CardTitle>
              <CardDescription>Where attendees will gather physically or virtually.</CardDescription>

              <Input
                label="Venue / Building / Room"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. University of Rwanda, Science Auditorium B"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Kigali"
                />
                <Input
                  label="Country"
                  value={country}
                  disabled
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Continue to Schedule →
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <CardTitle className="text-lg">Step 3 — Date, Time & Attendance Window</CardTitle>
              <CardDescription>
                Schedule evaluated strictly in Rwanda Standard Time (Africa/Kigali).
              </CardDescription>

              <Input
                label="Event Date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Session Start Time"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <Input
                  label="Session End Time"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              <div className="p-4 rounded-xl bg-nice-blue-50/60 border border-nice-blue-100 space-y-3">
                <span className="text-xs font-bold text-nice-blue-900 block">
                  Check-In Window (When attendees can scan)
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Opens At"
                    type="time"
                    value={attendanceOpens}
                    onChange={(e) => setAttendanceOpens(e.target.value)}
                  />
                  <Input
                    label="Closes At"
                    type="time"
                    value={attendanceCloses}
                    onChange={(e) => setAttendanceCloses(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  ← Back
                </Button>
                <Button variant="primary" onClick={() => setStep(4)}>
                  Review & Publish →
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <CardTitle className="text-lg">Step 4 — Review & Publish</CardTitle>
              <CardDescription>
                Confirm your configuration. Once published, a unique QR code and public attendance link will be generated.
              </CardDescription>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Topic:</span>
                  <span className="font-bold text-slate-900">{title || 'Untitled Session'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Type:</span>
                  <span>{type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Location:</span>
                  <span>{venue || 'Main Venue'}, {city}, Rwanda</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Date & Time:</span>
                  <span>{date} ({startTime} — {endTime} CAT)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Check-in Window:</span>
                  <span className="text-nice-blue-600 font-semibold">{attendanceOpens} — {attendanceCloses} CAT</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Duplicate Attendance Policy
                </label>
                <select
                  value={duplicatePolicy}
                  onChange={(e) => setDuplicatePolicy(e.target.value as DuplicatePolicy)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20 focus:border-nice-blue-500"
                >
                  <option value="PREVENT_BY_EMAIL">Prevent duplicate check-ins by email (Recommended)</option>
                  <option value="PREVENT_BY_EMAIL_AND_PHONE">Prevent by both email and phone number</option>
                  <option value="ALLOW_DUPLICATES">Allow multiple check-ins per person</option>
                </select>
              </div>

              {submitError && <p role="alert" className="text-sm text-rose-700">{submitError}</p>}
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setStep(3)}>
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handlePublish}
                  isLoading={submitting}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Publish Session & Generate QR
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
