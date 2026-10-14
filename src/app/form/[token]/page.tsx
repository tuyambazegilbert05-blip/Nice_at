'use client'

import { use, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CalendarDays, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { AttendanceFormFieldControl } from '../../../components/forms/AttendanceFormFieldControl'
import { CustomFormBrand } from '../../../components/forms/CustomFormBrand'
import { ScientificFormBackground } from '../../../components/forms/ScientificFormBackground'
import { getAttendanceFormFieldGroups, getVisibleAttendanceFields, parseAttendanceFormConfig, validateAttendanceResponses, type AttendanceFormConfig, type AttendanceResponseValue } from '../../../lib/forms/attendance-form'
import { formatDateTime } from '../../../utils/date'
import { FormFieldsMotion, FormSectionReveal } from '../../../motion/gsap/FormMotion'

type PublicForm = { title: string; eventDate: string; startTime: string; endTime: string; location: string; config: AttendanceFormConfig; version: number; status: 'PUBLISHED' | 'CLOSED'; responseOpensAt: string | null; responseClosesAt: string | null; acceptanceState: 'DRAFT' | 'CLOSED' | 'SCHEDULED' | 'ACCEPTING' | 'ENDED' }
type Draft = { expiresAt: number; responses: Record<string, AttendanceResponseValue>; idempotencyKey: string }

function createKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16)
    return (char === 'x' ? value : (value & 0x3) | 0x8).toString(16)
  })
}

function restoredValues(raw: unknown, config: AttendanceFormConfig): Record<string, AttendanceResponseValue> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const input = raw as Record<string, unknown>
  const output: Record<string, AttendanceResponseValue> = {}
  for (const field of config.fields.filter((item) => item.visible)) {
    const value = input[field.id]
    if (field.type === 'CONSENT' && typeof value === 'boolean') output[field.id] = value
    else if (field.type === 'CHECKBOX' && Array.isArray(value)) output[field.id] = value.filter((item): item is string => typeof item === 'string' && !!field.options?.includes(item))
    else if (field.type === 'NUMBER' && (typeof value === 'number' || typeof value === 'string') && String(value).length <= 100) output[field.id] = value
    else if (typeof value === 'string' && value.length <= 6000) {
      if (['SELECT', 'RADIO'].includes(field.type) && value && !field.options?.includes(value)) continue
      output[field.id] = value
    }
  }
  const visibleIds = new Set(getVisibleAttendanceFields(config, output).map((field) => field.id))
  return Object.fromEntries(Object.entries(output).filter(([fieldId]) => visibleIds.has(fieldId)))
}

export default function PublicCustomFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const storageKey = `nice-custom-form-response:${token}:v1`
  const [form, setForm] = useState<PublicForm | null>(null)
  const [liveAcceptanceState, setLiveAcceptanceState] = useState<PublicForm['acceptanceState'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [responses, setResponses] = useState<Record<string, AttendanceResponseValue>>({})
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [draftReady, setDraftReady] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [localStorageAvailable, setLocalStorageAvailable] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch(`/api/forms/public/${encodeURIComponent(token)}`, { cache: 'no-store' }).then(async (response) => {
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'This form is unavailable.')
      const config = parseAttendanceFormConfig(result.data.config)
      if (active) {
        setForm({ ...result.data, config })
        setLiveAcceptanceState(result.data.acceptanceState)
      }
    }).catch((cause) => { if (active) setLoadError(cause instanceof Error ? cause.message : 'This form is unavailable.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const loadedFormVersion = form?.version
  useEffect(() => {
    if (loadedFormVersion === undefined) return
    let active = true
    const refreshAvailability = async () => {
      try {
        const response = await fetch(`/api/forms/public/${encodeURIComponent(token)}`, { cache: 'no-store' })
        const result = await response.json()
        if (active && response.ok && result.success) setLiveAcceptanceState(result.data.acceptanceState)
      } catch { /* keep the last server-confirmed availability when temporarily offline */ }
    }
    const timer = window.setInterval(() => { void refreshAvailability() }, 30_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [loadedFormVersion, token])

  useEffect(() => {
    if (!form) return
    const timer = window.setTimeout(() => {
      let savedKey = ''
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) {
          const saved = JSON.parse(raw) as Partial<Draft>
          if (typeof saved.expiresAt === 'number' && saved.expiresAt > Date.now()) {
            const values = restoredValues(saved.responses, form.config)
            setResponses(values)
            savedKey = typeof saved.idempotencyKey === 'string' && /^[\da-f-]{36}$/i.test(saved.idempotencyKey) ? saved.idempotencyKey : ''
            setDraftRestored(Object.keys(values).length > 0)
          } else localStorage.removeItem(storageKey)
        }
      } catch { setLocalStorageAvailable(false) }
      setIdempotencyKey(savedKey || createKey())
      setDraftReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [form, storageKey])

  useEffect(() => {
    if (!draftReady || !form) return
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, responses, idempotencyKey } satisfies Draft))
      } catch { setLocalStorageAvailable(false) }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [draftReady, form, idempotencyKey, responses, storageKey])

  const visibleFields = useMemo(() => form ? getVisibleAttendanceFields(form.config, responses) : [], [form, responses])
  const fieldGroups = useMemo(() => form ? getAttendanceFormFieldGroups(form.config, responses) : [], [form, responses])

  function updateResponse(id: string, response: AttendanceResponseValue) {
    if (!form) return
    setResponses((current) => {
      const next = { ...current, [id]: response }
      const visibleIds = new Set(getVisibleAttendanceFields(form.config, next).map((field) => field.id))
      return Object.fromEntries(Object.entries(next).filter(([fieldId]) => visibleIds.has(fieldId)))
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form || !idempotencyKey) return
    setSubmitting(true)
    setError('')
    try {
      const validated = validateAttendanceResponses(form.config, responses)
      const response = await fetch(`/api/forms/public/${encodeURIComponent(token)}/submissions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: validated, idempotencyKey }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not save your attendance response.')
      try {
        sessionStorage.setItem(`nice-custom-form-success:${token}`, JSON.stringify({ title: form.title, eventDate: form.eventDate, fullName: result.data.fullName, emailStatus: result.data.emailStatus }))
        localStorage.removeItem(storageKey)
      } catch { /* success continues without browser storage */ }
      router.push(`/form/${encodeURIComponent(token)}/success`)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not save your attendance response.'
      setError(message)
      const field = visibleFields.find((item) => message.startsWith(item.label))
      if (field) requestAnimationFrame(() => {
        const target = document.getElementById(field.id)
        target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
        target?.focus({ preventScroll: true })
      })
    } finally { setSubmitting(false) }
  }

  function clearDraft() {
    setResponses({})
    setIdempotencyKey(createKey())
    setDraftRestored(false)
    setError('')
    try { localStorage.removeItem(storageKey) } catch { setLocalStorageAvailable(false) }
  }

  if (loading) return <ScientificFormBackground className="flex flex-col items-center justify-center p-4"><div className="space-y-4 text-center"><div className="flex justify-center"><CustomFormBrand /></div><p role="status" className="text-sm text-slate-600">Loading the published form…</p></div></ScientificFormBackground>
  if (!form) return <ScientificFormBackground className="flex items-center justify-center p-4"><Card className="w-full max-w-md border-nice-blue-100 shadow-elevated"><CardContent className="p-7 text-center"><div className="mb-5 flex justify-center"><CustomFormBrand /></div><AlertCircle className="mx-auto h-8 w-8 text-rose-600" /><h1 className="mt-3 text-lg font-bold text-slate-900">Form unavailable</h1><p role="alert" className="mt-2 text-sm text-slate-600">{loadError || 'This public form is not available.'}</p></CardContent></Card></ScientificFormBackground>

  const eventDate = new Intl.DateTimeFormat('en-RW', { dateStyle: 'long', timeZone: 'Africa/Kigali' }).format(new Date(`${form.eventDate}T12:00:00+02:00`))
  const acceptanceState = liveAcceptanceState ?? form.acceptanceState
  const responseStatus = {
    ACCEPTING: { label: 'Accepting responses', variant: 'success' as const },
    SCHEDULED: { label: 'Response window scheduled', variant: 'default' as const },
    ENDED: { label: 'Response window ended', variant: 'neutral' as const },
    CLOSED: { label: 'Form closed', variant: 'neutral' as const },
    DRAFT: { label: 'Not published', variant: 'warning' as const },
  }[acceptanceState]

  return <ScientificFormBackground className="px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-col items-center space-y-2.5 text-center">
        <CustomFormBrand className="flex-col gap-2" logoClassName="h-16 w-16 sm:h-20 sm:w-20" showName={false} showTagline={false} />
        <div className="inline-flex items-center gap-2 rounded-full border border-nice-blue-100 bg-nice-blue-50 px-3.5 py-1 text-xs font-bold text-nice-blue-700"><Sparkles className="h-3.5 w-3.5 text-nice-blue-600" /><span>NiCE Club Rwanda</span></div>
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Nuclear is Clean Energy</p>
      </div>

      <FormSectionReveal>
        <Card className="overflow-hidden border-nice-blue-100 bg-white shadow-elevated">
          <div className="h-1.5 w-full bg-gradient-to-r from-nice-blue-500 via-emerald-500 to-cyan-500" />
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2"><Badge variant="default" size="sm">CUSTOM_FORM</Badge><Badge variant={responseStatus.variant} size="sm" dot>{responseStatus.label}</Badge></div>
            <div><h1 className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{form.title}</h1><p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{acceptanceState === 'ACCEPTING' ? 'Please complete this form to register and submit your response.' : 'Review the form and response window details below.'}</p></div>
            <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:grid-cols-2">
              <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-nice-blue-600" /><span>{eventDate}</span></div>
              <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 shrink-0 text-nice-blue-600" /><span>{form.startTime} — {form.endTime} CAT</span></div>
              <div className="flex items-start gap-1.5 sm:col-span-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /><span>{form.location}</span></div>
              {(form.responseOpensAt || form.responseClosesAt) && <div className="flex items-start gap-1.5 sm:col-span-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /><span><strong className="font-semibold text-slate-700">Response window:</strong> {form.responseOpensAt ? formatDateTime(form.responseOpensAt) : 'Open now'}{form.responseClosesAt ? ` – ${formatDateTime(form.responseClosesAt)}` : ''}</span></div>}
            </div>
          </CardContent>
        </Card>
      </FormSectionReveal>

      {acceptanceState !== 'ACCEPTING' && <FormSectionReveal><Card className="border-amber-200 bg-white shadow-elevated"><CardContent className="space-y-3 p-6 text-center sm:p-8"><Badge variant={responseStatus.variant} dot>{responseStatus.label}</Badge><h2 className="text-lg font-bold text-slate-900">Form responses are not accepting submissions</h2><p className="text-sm text-slate-600">{form.status === 'CLOSED' || acceptanceState === 'CLOSED' ? 'The organizer has closed responses for this form.' : acceptanceState === 'SCHEDULED' && form.responseOpensAt ? `Responses open ${formatDateTime(form.responseOpensAt)}.` : acceptanceState === 'ENDED' && form.responseClosesAt ? `The response window ended ${formatDateTime(form.responseClosesAt)}.` : 'This form is not accepting responses right now.'}</p>{form.responseClosesAt && acceptanceState === 'SCHEDULED' && <p className="text-xs text-slate-500">Responses close {formatDateTime(form.responseClosesAt)}.</p>}</CardContent></Card></FormSectionReveal>}

      {acceptanceState === 'ACCEPTING' && draftRestored && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-900"><span>Your saved answers were restored.</span><button type="button" onClick={clearDraft} className="font-semibold underline underline-offset-2">Clear saved answers</button></div>}
      {acceptanceState === 'ACCEPTING' && !localStorageAvailable && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">This browser cannot save a recovery draft. Keep the page open until your response is recorded.</p>}

      {acceptanceState === 'ACCEPTING' && <FormSectionReveal><Card className="border-slate-200 bg-white shadow-elevated"><CardContent className="p-5 sm:p-7"><FormFieldsMotion><form onSubmit={submit} className="space-y-6" noValidate>
        <p className="text-xs text-slate-500"><span className="text-rose-600">*</span> Required fields</p>
        {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {fieldGroups.map((group, index) => <FormSectionReveal key={group.id} className="space-y-4 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-nice-blue-50 text-xs font-bold text-nice-blue-600">{index + 1}</span><h2 className="text-sm font-bold text-slate-800">{group.label || (fieldGroups.length === 1 ? 'Registration Information' : 'Additional Questions')}</h2></div>
          {group.description && <p className="text-xs leading-relaxed text-slate-500">{group.description}</p>}
          {group.fields.map((field) => <div key={field.id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0"><AttendanceFormFieldControl field={field} value={responses[field.id]} onChange={(next) => updateResponse(field.id, next)} /></div>)}
        </FormSectionReveal>)}
        <div className="border-t border-slate-100 pt-4"><Button type="submit" variant="primary" size="lg" className="w-full py-3 text-base" isLoading={submitting || !draftReady} leftIcon={<CheckCircle2 className="h-5 w-5" />}>{submitting ? 'Saving response…' : !draftReady ? 'Preparing form…' : 'Submit My Response'}</Button><p className="mt-3 text-center text-[11px] text-slate-400">Your information is securely handled and will not be shared publicly.</p></div>
      </form></FormFieldsMotion></CardContent></Card></FormSectionReveal>}
    </div>
  </ScientificFormBackground>
}
