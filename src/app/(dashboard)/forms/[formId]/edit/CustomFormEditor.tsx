'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, Check, Mail, RefreshCw, Save, Share2, Users } from 'lucide-react'
import type { CustomForm } from '../../../../../lib/forms/form-service'
import { attendanceFormConfigSchema, type AttendanceFormConfig } from '../../../../../lib/forms/attendance-form'
import { AttendanceFormBuilder } from '../../../../../components/forms/AttendanceFormBuilder'
import { CustomFormBrand } from '../../../../../components/forms/CustomFormBrand'
import { Button } from '../../../../../components/ui/Button'

type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict'
type LocalDraft = { revision: number; config: AttendanceFormConfig; savedAt: number }
export default function CustomFormEditor({ initialForm, canManageTemplate }: {
  initialForm: CustomForm
  canManageTemplate: boolean
}) {
  const router = useRouter()
  const [config, setConfig] = useState(initialForm.draftConfig)
  const [status, setStatus] = useState<SaveStatus>('saved')
  const statusRef = useRef<SaveStatus>('saved')
  const [revision, setRevision] = useState(initialForm.draftRevision)
  const [publishedVersion, setPublishedVersion] = useState(initialForm.publishedVersion)
  const [formStatus, setFormStatus] = useState(initialForm.status)
  const [error, setError] = useState('')
  const [localConflict, setLocalConflict] = useState<LocalDraft | null>(null)
  const timer = useRef<number | null>(null)
  const pendingRef = useRef<{ config: AttendanceFormConfig; json: string } | null>(null)
  const runnerRef = useRef<Promise<void> | null>(null)
  const configRef = useRef(config)
  const revisionRef = useRef(revision)
  const savedJsonRef = useRef(JSON.stringify(initialForm.draftConfig))
  const formId = initialForm.id
  const localDraftKey = `nice-form-builder-draft:${formId}:v1`

  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { revisionRef.current = revision }, [revision])
  useEffect(() => { statusRef.current = status }, [status])
  const isValid = attendanceFormConfigSchema.safeParse(config).success
  const fieldsCount = config.fields.filter((field) => field.visible).length
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(localDraftKey)
        if (raw) {
          const local = JSON.parse(raw) as LocalDraft
          const age = Date.now() - local.savedAt
          if (age > 30 * 24 * 60 * 60 * 1000) localStorage.removeItem(localDraftKey)
          else if (attendanceFormConfigSchema.safeParse(local.config).success && JSON.stringify(local.config) !== savedJsonRef.current) {
            if (local.revision === initialForm.draftRevision) {
              setConfig(local.config)
              setStatus('dirty')
            } else setLocalConflict(local)
          }
        }
      } catch { setError('This browser could not read its local recovery copy. Server-saved drafts remain available.') }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [initialForm.draftRevision, localDraftKey])

  const saveLoop = useCallback(() => {
    if (runnerRef.current) return runnerRef.current
    const run = async () => {
      while (pendingRef.current) {
        const pending = pendingRef.current
        pendingRef.current = null
        setStatus('saving')
        setError('')
        let response: Response
        try {
          response = await fetch(`/api/forms/${encodeURIComponent(formId)}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: pending.config, revision: revisionRef.current }),
          })
        } catch {
          pendingRef.current = pendingRef.current || pending
          setStatus('error')
          setError('Could not reach the server. This browser has a recovery copy; retry when you are back online.')
          return
        }
        const result = await response.json()
        if (response.status === 409) {
          setStatus('conflict')
          setError(result.error || 'A newer server draft exists. Resolve the draft conflict before saving.')
          return
        }
        if (!response.ok || !result.success) {
          pendingRef.current = pendingRef.current || pending
          setStatus('error')
          setError(result.error || 'Could not save this draft.')
          return
        }
        revisionRef.current = result.data.draftRevision
        setRevision(result.data.draftRevision)
        savedJsonRef.current = JSON.stringify(result.data.draftConfig)
        try { localStorage.setItem(localDraftKey, JSON.stringify({ revision: result.data.draftRevision, config: configRef.current, savedAt: Date.now() } satisfies LocalDraft)) } catch { /* server save succeeded */ }
      }
      if (JSON.stringify(configRef.current) === savedJsonRef.current) setStatus('saved')
      else setStatus('dirty')
    }
    const promise = run().finally(() => { runnerRef.current = null })
    runnerRef.current = promise
    return promise
  }, [formId, localDraftKey])

  const queueSave = useCallback((next: AttendanceFormConfig) => {
    const json = JSON.stringify(next)
    configRef.current = next
    setConfig(next)
    pendingRef.current = { config: next, json }
    setStatus('dirty')
    try { localStorage.setItem(localDraftKey, JSON.stringify({ revision: revisionRef.current, config: next, savedAt: Date.now() } satisfies LocalDraft)) }
    catch { setError('Local recovery is unavailable; the form will still save to the server when online.') }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { void saveLoop() }, 700)
  }, [localDraftKey, saveLoop])

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (status === 'dirty' || status === 'saving' || status === 'error' || status === 'conflict') {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [status])

  async function retrySave() {
    if (timer.current) window.clearTimeout(timer.current)
    pendingRef.current = { config, json: JSON.stringify(config) }
    setStatus('dirty')
    await saveLoop()
  }

  async function resolveLocal(useLocal: boolean) {
    const selected = useLocal && localConflict ? localConflict.config : initialForm.draftConfig
    setLocalConflict(null)
    if (useLocal) {
      setConfig(selected)
      pendingRef.current = { config: selected, json: JSON.stringify(selected) }
      setStatus('dirty')
      await saveLoop()
    } else {
      setConfig(selected)
      savedJsonRef.current = JSON.stringify(selected)
      setStatus('saved')
      try { localStorage.setItem(localDraftKey, JSON.stringify({ revision: revisionRef.current, config: selected, savedAt: Date.now() } satisfies LocalDraft)) } catch { /* the server copy is authoritative */ }
    }
  }

  async function publish() {
    if (!isValid) return
    if (status === 'dirty' || status === 'error') await retrySave()
    if (statusRef.current === 'conflict') return
    if (pendingRef.current || status === 'saving') await saveLoop()
    if (pendingRef.current || status === 'error' || status === 'conflict') return
    setError('')
    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(formId)}/publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: revisionRef.current }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not publish this form.')
      setPublishedVersion(result.data.publishedVersion)
      setFormStatus(result.data.status)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not publish this form.') }
  }

  const configValid = attendanceFormConfigSchema.safeParse(config)
  const statusText: Record<SaveStatus, string> = { saved: 'Saved', dirty: 'Unsaved changes', saving: 'Saving…', error: 'Unable to save', conflict: 'Draft conflict' }
  const date = new Intl.DateTimeFormat('en-RW', { dateStyle: 'long', timeZone: 'Africa/Kigali' }).format(new Date(`${initialForm.eventDate}T12:00:00+02:00`))

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
      <div className="flex items-start gap-3"><Link href="/forms" aria-label="Back to forms" className="mt-1 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></Link><CustomFormBrand logoClassName="h-11 w-11" showTagline={false} /><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-sky-700">Custom Forms · Independent form</p><h1 className="mt-1 break-words text-2xl font-bold text-slate-900">{initialForm.title}</h1><p className="mt-1 text-sm text-slate-600">{date} · {initialForm.startTime}–{initialForm.endTime} CAT · {initialForm.location}</p></div></div>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/forms/${encodeURIComponent(formId)}`}><Button variant="outline" size="sm" leftIcon={<BarChart3 className="h-4 w-4" />}>Attendees & analytics</Button></Link>
        <Link href={`/forms/${encodeURIComponent(formId)}/responses`}><Button variant="outline" size="sm" leftIcon={<Users className="h-4 w-4" />}>Responses</Button></Link>
        <Link href={`/forms/${encodeURIComponent(formId)}/share`}><Button variant="outline" size="sm" leftIcon={<Share2 className="h-4 w-4" />}>Share & downloads</Button></Link>
        {canManageTemplate && <Link href="/forms/email-template"><Button variant="outline" size="sm" leftIcon={<Mail className="h-4 w-4" />}>Email message</Button></Link>}
        <Button variant="outline" size="sm" disabled={status === 'saving' || status === 'conflict'} onClick={() => retrySave()} leftIcon={<Save className="h-4 w-4" />}>{status === 'saving' ? 'Saving draft…' : 'Save draft'}</Button>
        <Button size="sm" disabled={!isValid || status === 'saving' || status === 'conflict' || formStatus === 'CLOSED'} onClick={() => publish()} leftIcon={<Check className="h-4 w-4" />}>{status === 'saving' ? 'Publishing…' : formStatus === 'PUBLISHED' ? 'Publish updates' : 'Publish form'}</Button>
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${status === 'saved' ? 'bg-emerald-500' : status === 'error' || status === 'conflict' ? 'bg-rose-500' : 'bg-amber-500'}`} /><span role="status" className="text-sm font-semibold text-slate-800">{statusText[status]}</span><span className="text-xs text-slate-500">· revision {revision} · {fieldsCount} visible fields</span></div>
      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${formStatus === 'PUBLISHED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : formStatus === 'CLOSED' ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{formStatus === 'PUBLISHED' ? `Published · version ${publishedVersion}` : formStatus}</span>
    </div>

    {localConflict && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4"><p className="font-semibold text-amber-950">This browser has a form draft based on an older server revision.</p><p className="mt-1 text-sm text-amber-900">Choose which copy to continue with. Restoring the browser copy will save it as a new server revision.</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => resolveLocal(true)}>Restore browser draft</Button><Button variant="outline" size="sm" onClick={() => resolveLocal(false)}>Use server draft</Button></div></div>}
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><span>{error}</span>{status === 'error' && <Button variant="outline" size="sm" onClick={() => retrySave()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Retry</Button>}{status === 'conflict' && <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Reload latest version</Button>}</div>}

    {formStatus === 'PUBLISHED' && <p className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-900">You are customizing a draft of this published form. Version {publishedVersion} remains live until you select “Publish updates.” Existing responses stay connected to the version each attendee submitted.</p>}
    {formStatus === 'CLOSED' && <p className="rounded-lg border border-slate-200 bg-slate-100 p-3 text-sm text-slate-700">This form is closed and cannot be republished. Its published form and attendee records remain available for review.</p>}
    <div id="customize-form" className="scroll-mt-4"><h2 className="mb-3 text-lg font-bold text-slate-900">{formStatus === 'PUBLISHED' ? 'Customize published form' : formStatus === 'CLOSED' ? 'Published form fields' : 'Customize form'}</h2><AttendanceFormBuilder value={config} onChange={queueSave} /></div>

    <div className="flex justify-start"><Button type="button" variant="ghost" data-navigation-action="true" onClick={() => router.push('/forms')}>Back to forms</Button></div>
  </div>
}
