'use client'

import type { ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import { CalendarClock, Check, ChevronRight, Eye, GraduationCap, Mail, MessageSquareText, Phone, UserRound } from 'lucide-react'
import type { Attendance } from '../../types/attendance'
import type { Question } from '../../types/session'
import { Modal } from '../ui/Modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table'
import { useGSAP } from '../../motion/gsap/useGsap'
import { gsap } from '../../motion/gsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'
import { formatDateTime } from '../../utils/date'

interface SessionAttendeesTableProps {
  records: Attendance[]
  questions?: Question[]
  error?: string
  emptyMessage?: string
}

function submittedAt(value: Attendance['submittedAt']) {
  return formatDateTime(value)
}

function responseText(value: string | string[] | number | boolean) {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function DetailField({ label, children, className = '' }: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div data-attendee-meta className={`rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-1.5 break-words text-sm font-medium leading-relaxed text-slate-800">{children}</div>
    </div>
  )
}

function ReflectionCard({ title, value, icon }: { title: string; value?: string | null; icon: ReactNode }) {
  return (
    <section data-attendee-response className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2 text-nice-blue-700">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-nice-blue-50">{icon}</span>
        <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {value?.trim() || <span className="italic text-slate-400">No response provided</span>}
      </p>
    </section>
  )
}

function AttendeeShowcase({ record, questions }: { record: Attendance; questions: Question[] }) {
  const showcase = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!showcase.current) return
    const media = gsap.matchMedia(showcase.current)
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline()
      timeline
        .fromTo('[data-attendee-hero]',
          { autoAlpha: 0, y: 18, scale: 0.98 },
          { autoAlpha: 1, y: 0, scale: 1, duration: MOTION_DURATION.medium, ease: MOTION_EASE.enter },
        )
        .fromTo('[data-attendee-meta]',
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: MOTION_DURATION.short, stagger: 0.055, ease: MOTION_EASE.standard },
          '<0.12',
        )
        .fromTo('[data-attendee-response]',
          { autoAlpha: 0, x: 16 },
          { autoAlpha: 1, x: 0, duration: MOTION_DURATION.medium, stagger: 0.08, ease: MOTION_EASE.enter },
          '<0.16',
        )
        .fromTo('[data-attendee-custom]',
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: MOTION_DURATION.short, stagger: 0.045, ease: MOTION_EASE.standard },
          '<0.14',
        )
      return () => timeline.kill()
    })
    return () => media.revert()
  }, { scope: showcase, dependencies: [record.id], revertOnUpdate: true })

  const customEntries = Object.entries(record.customResponses ?? {})
  const questionById = new Map(questions.map((question) => [question.id, question]))
  const orderedCustomEntries = customEntries.sort(([a], [b]) => {
    const orderA = questionById.get(a)?.order ?? Number.MAX_SAFE_INTEGER
    const orderB = questionById.get(b)?.order ?? Number.MAX_SAFE_INTEGER
    return orderA - orderB
  })
  const metadataEntries = Object.entries(record.metadata ?? {})

  return (
    <div ref={showcase} className="max-h-[calc(90vh-6rem)] space-y-4 overflow-y-auto p-1 pr-2 sm:space-y-5">
      <section data-attendee-hero className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50/60 p-4 sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border-[18px] border-sky-100/60" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold text-nice-blue-700 shadow-sm ring-1 ring-sky-100 sm:h-16 sm:w-16">
            {record.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || <UserRound className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-nice-blue-700">Verified check-in</p>
            <h3 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{record.fullName}</h3>
            <p className="mt-1 text-xs text-slate-500">{record.participantType} · {submittedAt(record.submittedAt)}</p>
          </div>
          <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 sm:flex"><Check className="h-5 w-5" /></span>
        </div>
      </section>

      <section aria-label="Attendee details" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <DetailField label="Email"><span className="inline-flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{record.email}</span></DetailField>
        <DetailField label="Phone"><span className="inline-flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{record.phone || 'Not provided'}</span></DetailField>
        <DetailField label="Faculty">{record.faculty || 'Not provided'}</DetailField>
        <DetailField label="Program / major">{record.program || 'Not provided'}</DetailField>
        <DetailField label="Year of study">{record.yearOfStudy || 'Not provided'}</DetailField>
        <DetailField label="Email updates"><span className="inline-flex items-center gap-2"><Check className={`h-4 w-4 ${record.emailUpdatesOptIn ? 'text-emerald-600' : 'text-slate-300'}`} />{record.emailUpdatesOptIn ? 'Opted in' : 'Not opted in'}</span></DetailField>
        <DetailField label="Check-in time" className="sm:col-span-2"><span className="inline-flex items-start gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{submittedAt(record.submittedAt)}</span></DetailField>
      </section>

      <section>
        <div className="mb-2.5 flex items-center gap-2 px-1">
          <MessageSquareText className="h-4 w-4 text-nice-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Reflection & insights</h4>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ReflectionCard title="Key takeaway or question" value={record.keyTakeaway} icon={<GraduationCap className="h-4 w-4" />} />
          <ReflectionCard title="Suggestions or feedback" value={record.feedback} icon={<MessageSquareText className="h-4 w-4" />} />
        </div>
      </section>

      {orderedCustomEntries.length > 0 && <section>
        <h4 className="mb-2.5 px-1 text-xs font-bold uppercase tracking-wider text-slate-700">Additional session responses</h4>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {orderedCustomEntries.map(([id, value]) => <div key={id} data-attendee-custom className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{questionById.get(id)?.label || `Question ${id}`}</p>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{responseText(value)}</p>
          </div>)}
        </div>
      </section>}

      {metadataEntries.length > 0 && <details className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-600">Submission metadata</summary>
        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {metadataEntries.map(([key, value]) => <div key={key} data-attendee-custom className="rounded-lg bg-white p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{key.replaceAll('_', ' ')}</dt>
            <dd className="mt-1 break-words text-sm text-slate-700">{typeof value === 'string' ? value : JSON.stringify(value)}</dd>
          </div>)}
        </dl>
      </details>}
    </div>
  )
}

export function SessionAttendeesTable({
  records,
  questions = [],
  error,
  emptyMessage = 'No attendance records for this session yet.',
}: SessionAttendeesTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null)
  const closeDetails = useCallback(() => setSelectedRecord(null), [])

  return (
    <>
      <p className="mb-3 text-xs text-slate-500">Select an attendee row to view the full submitted check-in.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email / Phone</TableHead>
            <TableHead>Academic information</TableHead>
            <TableHead>Participant type</TableHead>
            <TableHead>Key takeaway</TableHead>
            <TableHead>Suggestions / feedback</TableHead>
            <TableHead>Checked in</TableHead>
            <TableHead><span className="sr-only">Row details</span><Eye className="h-3.5 w-3.5" aria-hidden="true" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {error ? <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-rose-700">{error}</TableCell></TableRow>
            : records.length ? records.map((record) => <TableRow
              key={record.id}
              role="button"
              tabIndex={0}
              aria-label={`View full attendance submission from ${record.fullName}`}
              onClick={() => setSelectedRecord(record)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedRecord(record)
                }
              }}
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nice-blue-500"
            >
              <TableCell className="font-semibold text-slate-900">{record.fullName}</TableCell>
              <TableCell><span className="block">{record.email}</span><span className="text-xs text-slate-500">{record.phone || 'No phone provided'}</span></TableCell>
              <TableCell>{[record.faculty, record.program, record.yearOfStudy].filter(Boolean).join(' · ') || '—'}</TableCell>
              <TableCell>{record.participantType}</TableCell>
              <TableCell className="max-w-[260px] whitespace-normal"><span className="line-clamp-2 text-slate-700">{record.keyTakeaway || <span className="italic text-slate-400">No response</span>}</span></TableCell>
              <TableCell className="max-w-[260px] whitespace-normal"><span className="line-clamp-2 text-slate-700">{record.feedback || <span className="italic text-slate-400">No response</span>}</span></TableCell>
              <TableCell>{submittedAt(record.submittedAt)}</TableCell>
              <TableCell className="text-nice-blue-600"><ChevronRight className="h-4 w-4" aria-hidden="true" /></TableCell>
            </TableRow>)
            : <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">{emptyMessage}</TableCell></TableRow>}
        </TableBody>
      </Table>
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={closeDetails}
        title={selectedRecord?.fullName || 'Attendee submission'}
        description="Complete submitted attendance details"
        className="max-w-3xl overflow-hidden p-4 sm:p-6"
      >
        {selectedRecord && <AttendeeShowcase key={selectedRecord.id} record={selectedRecord} questions={questions} />}
      </Modal>
    </>
  )
}
