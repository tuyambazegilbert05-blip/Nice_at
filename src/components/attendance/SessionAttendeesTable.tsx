'use client'

import type { ReactNode, RefObject } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CalendarClock, Check, ChevronRight, Eye, GraduationCap, Mail, MessageSquareText, Phone, UserRound } from 'lucide-react'
import type { Attendance } from '../../types/attendance'
import type { Question } from '../../types/session'
import { Modal } from '../ui/Modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table'
import { useGSAP } from '../../motion/gsap/useGsap'
import { Flip, gsap, ScrollTrigger, SplitText } from '../../motion/gsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'
import { formatDateTime } from '../../utils/date'
import { EmptyStateAnimation } from '../../lottie/empty/EmptyStateAnimation'
import { LoadingSpinner } from '../../lottie/loading/LoadingSpinner'
import { SuccessCheckmark } from '../../lottie/success/SuccessCheckmark'

interface SessionAttendeesTableProps {
  records: Attendance[]
  questions?: Question[]
  error?: string
  emptyMessage?: string
  loading?: boolean
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
    <div ref={showcase} className="max-h-[calc(100dvh-9rem)] space-y-4 overflow-y-auto overscroll-contain p-1 pr-2 sm:max-h-[calc(100dvh-11rem)] sm:space-y-5">
      <section data-attendee-hero className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50/60 p-4 sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border-[18px] border-sky-100/60" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold text-nice-blue-700 shadow-sm ring-1 ring-sky-100 sm:h-16 sm:w-16">
            {record.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || <UserRound className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-nice-blue-700">Verified check-in</p>
            <h3 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{record.fullName}</h3>
            <p className="mt-1 break-words text-xs text-slate-500">{record.participantType} · {submittedAt(record.submittedAt)}</p>
          </div>
          <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 sm:flex"><SuccessCheckmark label="Verified attendance" className="h-9 w-9" /></span>
        </div>
      </section>

      <section aria-label="Attendee details" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <DetailField label="Email"><span className="inline-flex min-w-0 items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 break-all">{record.email}</span></span></DetailField>
        <DetailField label="Phone"><span className="inline-flex min-w-0 items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 break-words">{record.phone || 'Not provided'}</span></span></DetailField>
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
            <dt className="break-words text-[10px] font-bold uppercase tracking-wider text-slate-400">{key.replaceAll('_', ' ')}</dt>
            <dd className="mt-1 break-words text-sm text-slate-700">{typeof value === 'string' ? value : JSON.stringify(value)}</dd>
          </div>)}
        </dl>
      </details>}
    </div>
  )
}

function useRosterAmbient(root: RefObject<HTMLElement | null>, host: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const target = root.current
    const canvasHost = host.current
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!target || !canvasHost || motionPreference.matches || typeof IntersectionObserver === 'undefined') return

    let active = false
    let disposed = false
    let frame = 0
    let renderer: import('three').WebGLRenderer | null = null
    let scene: import('three').Scene | null = null
    let camera: import('three').OrthographicCamera | null = null
    let points: import('three').Points | null = null
    let geometry: import('three').BufferGeometry | null = null
    let material: import('three').PointsMaterial | null = null
    let resizeObserver: ResizeObserver | null = null
    let idleId: number | ReturnType<typeof setTimeout> | null = null

    const stop = () => {
      active = false
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }
    const dispose = () => {
      disposed = true
      stop()
      resizeObserver?.disconnect()
      geometry?.dispose()
      material?.dispose()
      renderer?.dispose()
      renderer?.domElement.remove()
    }
    const render = () => {
      if (!active || !renderer || !scene || !camera || !points) return
      points.rotation.z += 0.00022
      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)
    }
    const start = async () => {
      if (disposed || renderer) return
      try {
        const [{ createEnergyRenderer }, THREE] = await Promise.all([
          import('../../three/core/renderer'),
          import('three'),
        ])
        if (disposed) return
        renderer = createEnergyRenderer(canvasHost)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1))
        renderer.setSize(Math.max(1, canvasHost.clientWidth), Math.max(1, canvasHost.clientHeight), false)
        scene = new THREE.Scene()
        camera = new THREE.OrthographicCamera(-10, 10, 5, -5, 0.1, 100)
        camera.position.z = 12
        const positions = new Float32Array(27 * 3)
        for (let index = 0; index < 27; index += 1) {
          positions[index * 3] = Math.sin(index * 12.9898) * 9
          positions[index * 3 + 1] = Math.cos(index * 7.233) * 4
          positions[index * 3 + 2] = 0
        }
        geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        material = new THREE.PointsMaterial({ color: 0x0284c7, size: 0.055, transparent: true, opacity: 0.28, depthWrite: false })
        points = new THREE.Points(geometry, material)
        scene.add(points)
        resizeObserver = new ResizeObserver(() => {
          if (!renderer || !camera) return
          const width = Math.max(1, canvasHost.clientWidth)
          const height = Math.max(1, canvasHost.clientHeight)
          const halfHeight = 5
          const halfWidth = halfHeight * width / height
          camera.left = -halfWidth
          camera.right = halfWidth
          camera.top = halfHeight
          camera.bottom = -halfHeight
          camera.updateProjectionMatrix()
          renderer.setSize(width, height, false)
        })
        resizeObserver.observe(canvasHost)
        if (active) render()
      } catch {
        // The roster remains fully usable when WebGL is unavailable.
      }
    }
    const scheduleStart = () => {
      if (renderer || idleId !== null) return
      if (typeof window.requestIdleCallback === 'function') idleId = window.requestIdleCallback(() => { idleId = null; void start() }, { timeout: 1200 })
      else idleId = window.setTimeout(() => { idleId = null; void start() }, 180)
    }
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting && document.visibilityState === 'visible' && !motionPreference.matches
      if (active) {
        if (!renderer) scheduleStart()
        else if (!frame) render()
      } else {
        stop()
      }
    }, { rootMargin: '120px', threshold: 0.01 })
    const handleVisibility = () => {
      active = !motionPreference.matches && !document.hidden && target.getBoundingClientRect().bottom > 0 && target.getBoundingClientRect().top < window.innerHeight
      if (active && !renderer) scheduleStart()
      else if (active && !frame) render()
      else if (!active) stop()
    }
    observer.observe(target)
    document.addEventListener('visibilitychange', handleVisibility)
    motionPreference.addEventListener('change', handleVisibility)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
      motionPreference.removeEventListener('change', handleVisibility)
      if (typeof idleId === 'number' && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId)
      else if (idleId) clearTimeout(idleId as ReturnType<typeof setTimeout>)
      dispose()
    }
  }, [host, root])
}

export function SessionAttendeesTable({
  records,
  questions = [],
  error,
  loading = false,
  emptyMessage = 'No attendance records for this session yet.',
}: SessionAttendeesTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null)
  const roster = useRef<HTMLElement>(null)
  const ambient = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLParagraphElement>(null)
  const modalPanel = useRef<HTMLDivElement>(null)
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null)
  const closeDetails = useCallback(() => setSelectedRecord(null), [])
  const openDetails = useCallback((record: Attendance, source: HTMLElement) => {
    flipState.current = Flip.getState(source)
    setSelectedRecord(record)
  }, [])

  useRosterAmbient(roster, ambient)

  useGSAP(() => {
    if (!roster.current) return
    const scope = roster.current
    const media = gsap.matchMedia(scope)
    media.add('(prefers-reduced-motion: no-preference)', () => {
      let headingSplit: SplitText | null = null
      if (heading.current) {
        headingSplit = new SplitText(heading.current, { type: 'words' })
        gsap.from(headingSplit.words, { autoAlpha: 0, y: 7, duration: 0.28, stagger: 0.025, ease: MOTION_EASE.brand })
      }
      const breakpoints = gsap.matchMedia(scope)
      const reveal = (selector: string) => {
        const rows = Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter((row) => row.getClientRects().length > 0)
        if (!rows.length) return
        ScrollTrigger.batch(rows, {
          start: 'top 94%',
          once: true,
          onEnter: (batch) => gsap.fromTo(batch,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: MOTION_DURATION.medium, stagger: 0.045, ease: MOTION_EASE.brand, clearProps: 'transform,opacity,visibility' },
          ),
        })
      }
      breakpoints.add('(min-width: 1280px)', () => reveal('.attendee-desktop-row'))
      breakpoints.add('(max-width: 1279px)', () => reveal('.attendee-card-row'))
      return () => {
        breakpoints.revert()
        headingSplit?.revert()
      }
    })
    return () => media.revert()
  }, { scope: roster, dependencies: [records.length], revertOnUpdate: true })

  useLayoutEffect(() => {
    const state = flipState.current
    if (!selectedRecord || !state) return
    let timeout = 0
    let frame = 0
    const animate = () => {
      if (!modalPanel.current) {
        frame = requestAnimationFrame(animate)
        return
      }
      Flip.from(state, {
        targets: modalPanel.current,
        duration: 0.42,
        ease: MOTION_EASE.brand,
        scale: true,
        absolute: true,
        simple: true,
        toggleClass: 'attendee-flip-active',
      })
      flipState.current = null
    }
    frame = requestAnimationFrame(animate)
    timeout = window.setTimeout(() => { if (frame) cancelAnimationFrame(frame) }, 500)
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timeout) }
  }, [selectedRecord])

  return (
    <section ref={roster} className="relative isolate min-w-0">
      <div ref={ambient} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_12%_8%,rgba(14,165,233,0.08),transparent_45%),radial-gradient(ellipse_at_88%_86%,rgba(16,185,129,0.06),transparent_42%)]" />
      <p ref={heading} className="mb-3 text-xs text-slate-500">Select an attendee to view the full submitted check-in.</p>
      {loading ? <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 py-5 text-sm text-slate-600" role="status"><LoadingSpinner label="Loading attendance records" className="h-14 w-14" /><span>Loading attendee submissions…</span></div>
        : error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>
        : records.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500"><EmptyStateAnimation label="No attendance records" className="mb-2 h-24 w-24" /><p>{emptyMessage}</p></div>
          : <>
      <div className="grid grid-cols-1 gap-3 xl:hidden">
        {records.map((record) => <button
          key={record.id}
          type="button"
          aria-haspopup="dialog"
          aria-label={`View full attendance submission from ${record.fullName}`}
          onClick={(event) => openDetails(record, event.currentTarget)}
          className="attendee-card-row w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-nice-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nice-blue-500 sm:p-5"
        >
          <span className="flex min-w-0 items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block break-words text-sm font-bold text-slate-900 sm:text-base">{record.fullName}</span>
              <span className="mt-1 block text-xs text-slate-500">{record.participantType}</span>
            </span>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-nice-blue-600" aria-hidden="true" />
          </span>
          <span className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
            <span className="min-w-0 text-xs text-slate-700"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Email</span><span className="mt-0.5 block break-all">{record.email}</span></span>
            <span className="min-w-0 text-xs text-slate-700"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phone</span><span className="mt-0.5 block break-words">{record.phone || 'Not provided'}</span></span>
            <span className="min-w-0 text-xs text-slate-700 sm:col-span-2"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Academic information</span><span className="mt-0.5 block break-words">{[record.faculty, record.program, record.yearOfStudy].filter(Boolean).join(' · ') || 'Not provided'}</span></span>
          </span>
          <span className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
            <span className="min-w-0 text-xs text-slate-600"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Key takeaway</span><span className="mt-0.5 block line-clamp-2 break-words">{record.keyTakeaway || 'No response'}</span></span>
            <span className="min-w-0 text-xs text-slate-600"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Suggestions</span><span className="mt-0.5 block line-clamp-2 break-words">{record.feedback || 'No response'}</span></span>
          </span>
          <span className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <span>Checked in {submittedAt(record.submittedAt)}</span>
            <span className="font-semibold text-nice-blue-700">View full submission</span>
          </span>
        </button>)}
      </div>
      <div className="hidden xl:block">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[14%]">Name</TableHead>
            <TableHead className="w-[17%]">Email / Phone</TableHead>
            <TableHead className="w-[15%]">Academic information</TableHead>
            <TableHead className="w-[9%]">Participant type</TableHead>
            <TableHead className="w-[16%]">Key takeaway</TableHead>
            <TableHead className="w-[16%]">Suggestions / feedback</TableHead>
            <TableHead className="w-[10%]">Checked in</TableHead>
            <TableHead className="w-[3%]"><span className="sr-only">Row details</span><Eye className="h-3.5 w-3.5" aria-hidden="true" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => <TableRow
              key={record.id}
              role="button"
              tabIndex={0}
              aria-label={`View full attendance submission from ${record.fullName}`}
              onClick={(event) => openDetails(record, event.currentTarget)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedRecord(record)
                }
              }}
              className="attendee-desktop-row cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nice-blue-500"
            >
              <TableCell className="whitespace-normal break-words font-semibold text-slate-900">{record.fullName}</TableCell>
              <TableCell className="whitespace-normal"><span className="block break-all">{record.email}</span><span className="break-words text-xs text-slate-500">{record.phone || 'No phone provided'}</span></TableCell>
              <TableCell className="whitespace-normal break-words">{[record.faculty, record.program, record.yearOfStudy].filter(Boolean).join(' · ') || '—'}</TableCell>
              <TableCell className="whitespace-normal break-words">{record.participantType}</TableCell>
              <TableCell className="max-w-[260px] whitespace-normal"><span className="line-clamp-2 text-slate-700">{record.keyTakeaway || <span className="italic text-slate-400">No response</span>}</span></TableCell>
              <TableCell className="max-w-[260px] whitespace-normal"><span className="line-clamp-2 text-slate-700">{record.feedback || <span className="italic text-slate-400">No response</span>}</span></TableCell>
              <TableCell className="whitespace-normal break-words">{submittedAt(record.submittedAt)}</TableCell>
              <TableCell className="text-nice-blue-600"><ChevronRight className="h-4 w-4" aria-hidden="true" /></TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
      </div>
          </>}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={closeDetails}
        title={selectedRecord?.fullName || 'Attendee submission'}
        description="Complete submitted attendance details"
        className="max-w-3xl overflow-hidden p-4 sm:p-6"
        panelRef={modalPanel}
      >
        {selectedRecord && <AttendeeShowcase key={selectedRecord.id} record={selectedRecord} questions={questions} />}
      </Modal>
    </section>
  )
}
