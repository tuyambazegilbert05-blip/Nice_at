'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import type { Session, SessionType, DuplicatePolicy } from '../../../../../types/session'
import { Button } from '../../../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/Card'

const SESSION_TYPES: SessionType[] = ['LECTURE', 'WORKSHOP', 'SEMINAR', 'SCHOOL_OUTREACH', 'UNIVERSITY_SESSION', 'CONFERENCE', 'WEBINAR', 'TRAINING', 'YOUTH_EVENT', 'OTHER']
const DUPLICATE_POLICIES: DuplicatePolicy[] = ['PREVENT_BY_EMAIL', 'PREVENT_BY_EMAIL_AND_PHONE', 'ALLOW_DUPLICATES']

function toKigaliDateTimeInput(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

function kigaliDateTimeToIso(value: string): string {
  return new Date(`${value}:00+02:00`).toISOString()
}

export default function EditSessionForm({ session }: { session: Session }) {
  const router = useRouter()
  const [title, setTitle] = useState(session.title)
  const [description, setDescription] = useState(session.description)
  const [type, setType] = useState<SessionType>(session.type)
  const [location, setLocation] = useState(session.location)
  const [date, setDate] = useState(String(session.date).slice(0, 10))
  const [startTime, setStartTime] = useState(session.startTime)
  const [endTime, setEndTime] = useState(session.endTime)
  const [attendanceOpens, setAttendanceOpens] = useState(toKigaliDateTimeInput(session.attendanceOpens))
  const [attendanceCloses, setAttendanceCloses] = useState(toKigaliDateTimeInput(session.attendanceCloses))
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>(session.duplicatePolicy)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (endTime <= startTime) return setError('Session end time must be after its start time.')
    if (attendanceCloses <= attendanceOpens) return setError('Check-in must close after it opens.')

    setSaving(true)
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(session.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, type, location, date, startTime, endTime,
          attendanceOpens: kigaliDateTimeToIso(attendanceOpens),
          attendanceCloses: kigaliDateTimeToIso(attendanceCloses),
          duplicatePolicy,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not update this session.')
      router.push(`/sessions/${encodeURIComponent(session.id)}`)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this session.')
      setSaving(false)
    }
  }

  const fieldClass = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100'

  return <div className="mx-auto max-w-3xl space-y-5">
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={() => router.push(`/sessions/${encodeURIComponent(session.id)}`)} leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
      <div><h1 className="text-2xl font-bold text-slate-900">Edit Session</h1><p className="mt-1 text-sm text-slate-600">Update the session details, schedule, and attendance window.</p></div>
    </div>

    <Card>
      <CardHeader><CardTitle>Session details</CardTitle><CardDescription>Changes are saved to the live session and its public attendance page.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">Session title<input required minLength={3} maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} /></label>
          <label className="block text-sm font-medium text-slate-700">Session type<select value={type} onChange={(event) => setType(event.target.value as SessionType)} className={fieldClass}>{SESSION_TYPES.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select></label>
          <label className="block text-sm font-medium text-slate-700">Description<textarea rows={5} maxLength={6000} value={description} onChange={(event) => setDescription(event.target.value)} className={fieldClass} /></label>
          <label className="block text-sm font-medium text-slate-700">Venue and location<input required minLength={2} maxLength={500} value={location} onChange={(event) => setLocation(event.target.value)} className={fieldClass} /></label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium text-slate-700">Event date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className={fieldClass} /></label>
            <label className="block text-sm font-medium text-slate-700">Start time (CAT)<input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={fieldClass} /></label>
            <label className="block text-sm font-medium text-slate-700">End time (CAT)<input required type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={fieldClass} /></label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Check-in opens (CAT)<input required type="datetime-local" value={attendanceOpens} onChange={(event) => setAttendanceOpens(event.target.value)} className={fieldClass} /></label>
            <label className="block text-sm font-medium text-slate-700">Check-in closes (CAT)<input required type="datetime-local" value={attendanceCloses} onChange={(event) => setAttendanceCloses(event.target.value)} className={fieldClass} /></label>
          </div>
          <label className="block text-sm font-medium text-slate-700">Duplicate check-in policy<select value={duplicatePolicy} onChange={(event) => setDuplicatePolicy(event.target.value as DuplicatePolicy)} className={fieldClass}>{DUPLICATE_POLICIES.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select></label>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => router.push(`/sessions/${encodeURIComponent(session.id)}`)}>Cancel</Button>
            <Button type="submit" isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>{saving ? 'Saving…' : 'Save session changes'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
}
