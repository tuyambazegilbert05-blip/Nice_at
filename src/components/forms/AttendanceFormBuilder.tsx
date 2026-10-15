'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { AttendanceFormFieldControl } from './AttendanceFormFieldControl'
import { CustomFormBrand } from './CustomFormBrand'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { gsap } from '../../motion/gsap'
import { createAttendanceFormTemplate, createDefaultAttendanceForm, ATTENDANCE_FIELD_TYPES, ATTENDANCE_FORM_TEMPLATES, attendanceFormConfigSchema, getAttendanceFormFieldGroups, getVisibleAttendanceFields, type AttendanceFieldType, type AttendanceFormConfig, type AttendanceFormField, type AttendanceFormTemplate, type AttendanceResponseValue } from '../../lib/forms/attendance-form'

const fieldTypeNames: Record<AttendanceFieldType, string> = {
  SHORT_TEXT: 'Short text', LONG_TEXT: 'Long text', EMAIL: 'Email', PHONE: 'Phone', NUMBER: 'Number',
  SELECT: 'Dropdown', RADIO: 'Single choice', CHECKBOX: 'Multiple choice', DATE: 'Date', CONSENT: 'Consent checkbox',
}

function cleanConfig(config: AttendanceFormConfig): AttendanceFormConfig {
  return {
    ...config,
    fields: config.fields.map((field, order) => ({ ...field, order })),
    sections: config.sections?.map((section, order) => ({ ...section, order })),
  }
}

function optionsText(field: AttendanceFormField): string {
  return (field.options || []).join('\n')
}

interface BuilderConfirmation {
  title: string
  message: string
  confirmLabel: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
}

export function AttendanceFormBuilder({ value, onChange }: { value: AttendanceFormConfig; onChange: (config: AttendanceFormConfig) => void }) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [previewResponses, setPreviewResponses] = useState<Record<string, AttendanceResponseValue>>({})
  const [template, setTemplate] = useState<AttendanceFormTemplate>('Standard Attendance')
  const [confirmation, setConfirmation] = useState<BuilderConfirmation | null>(null)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const previewContentRef = useRef<HTMLDivElement>(null)
  const previewBorderRef = useRef<SVGSVGElement>(null)
  const previewBorderPathRef = useRef<SVGRectElement>(null)
  const fields = [...value.fields].sort((left, right) => left.order - right.order)
  const sections = [...(value.sections ?? [])].sort((left, right) => left.order - right.order)
  const valid = attendanceFormConfigSchema.safeParse(value)

  const replaceField = (id: string, changes: Partial<AttendanceFormField>) => {
    const updated = fields.map((field) => field.id === id ? { ...field, ...changes } : field)
    const controller = updated.find((field) => field.id === id)
    const canControlQuestions = !!controller?.visible && ['SELECT', 'RADIO', 'CHECKBOX'].includes(controller.type) && !controller.condition
    const next = updated.map((field) => {
      if (field.condition?.fieldId !== id) return field
      const validOperator = field.condition.operator !== 'includes' || controller?.type === 'CHECKBOX'
      return canControlQuestions && validOperator && controller?.options?.includes(field.condition.value) ? field : { ...field, condition: undefined, visible: false }
    })
    onChange(cleanConfig({ ...value, fields: next }))
  }

  const moveField = (id: string, direction: -1 | 1) => {
    const index = fields.findIndex((field) => field.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= fields.length) return
    const next = [...fields]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(cleanConfig({ ...value, fields: next }))
  }

  const dropField = (targetId: string) => {
    if (!dragging || dragging === targetId) return
    const next = [...fields]
    const from = next.findIndex((field) => field.id === dragging)
    const to = next.findIndex((field) => field.id === targetId)
    if (from < 0 || to < 0) return
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(cleanConfig({ ...value, fields: next }))
    setDragging(null)
  }

  const addField = () => {
    const id = `field_${crypto.randomUUID().replaceAll('-', '')}`
    const next: AttendanceFormField = { id, type: 'SHORT_TEXT', label: 'New question', order: fields.length, required: false, visible: true, placeholder: '', sectionId: sections[0]?.id }
    onChange(cleanConfig({ ...value, fields: [...fields, next] }))
  }

  const addSection = () => {
    if (sections.length >= 12) return
    const id = `section_${crypto.randomUUID().replaceAll('-', '')}`
    const nextSections = [...sections, { id, label: 'New section', order: sections.length }]
    const nextFields = fields.map((field) => field.sectionId ? field : { ...field, sectionId: sections[0]?.id ?? id })
    onChange(cleanConfig({ ...value, sections: nextSections, fields: nextFields }))
  }

  const updateSection = (id: string, label: string) => {
    onChange(cleanConfig({ ...value, sections: sections.map((section) => section.id === id ? { ...section, label } : section) }))
  }

  const removeSection = (id: string) => {
    if (sections.length <= 1) return
    setConfirmation({
      title: 'Remove this section?',
      message: 'Its fields will move to the first remaining section.',
      confirmLabel: 'Remove section',
      confirmVariant: 'danger',
      onConfirm: () => {
        const nextSections = sections.filter((section) => section.id !== id)
        const fallbackId = nextSections[0].id
        const nextFields = fields.map((field) => field.sectionId === id ? { ...field, sectionId: fallbackId } : field)
        onChange(cleanConfig({ ...value, sections: nextSections, fields: nextFields }))
      },
    })
  }

  const updatePreviewResponse = (id: string, response: AttendanceResponseValue) => {
    setPreviewResponses((current) => {
      const next = { ...current, [id]: response }
      const visible = new Set(getVisibleAttendanceFields(value, next).map((field) => field.id))
      return Object.fromEntries(Object.entries(next).filter(([fieldId]) => visible.has(fieldId)))
    })
  }

  const restoreDefaults = () => {
    setConfirmation({
      title: 'Restore standard attendance fields?',
      message: 'This will replace the current draft with the standard attendance fields.',
      confirmLabel: 'Restore fields',
      onConfirm: () => onChange(createDefaultAttendanceForm()),
    })
  }

  const applyTemplate = () => {
    setConfirmation({
      title: `Apply “${template}” template?`,
      message: 'The template will replace the fields and sections in the current draft.',
      confirmLabel: 'Apply template',
      onConfirm: () => onChange(createAttendanceFormTemplate(template)),
    })
  }

  const removeField = (field: AttendanceFormField) => {
    if (field.id === 'full_name' || field.id === 'email') return
    setConfirmation({
      title: `Remove “${field.label}” from this form?`,
      message: 'This question will be removed from the form draft.',
      confirmLabel: 'Remove question',
      confirmVariant: 'danger',
      onConfirm: () => onChange(cleanConfig({ ...value, fields: fields.filter((item) => item.id !== field.id).map((item) => item.condition?.fieldId === field.id ? { ...item, condition: undefined, visible: false } : item) })),
    })
  }

  const conditionControllers = fields.filter((candidate) => candidate.id !== 'full_name' && candidate.visible && ['SELECT', 'RADIO', 'CHECKBOX'].includes(candidate.type) && !candidate.condition)
  const previewGroups = getAttendanceFormFieldGroups(value, previewResponses)

  useEffect(() => {
    const viewport = previewScrollRef.current
    const content = previewContentRef.current
    const border = previewBorderRef.current
    const borderPath = previewBorderPathRef.current
    if (!viewport || !content || !border || !borderPath) return

    let updateProgress: (() => void) | undefined
    let updateBorderSize: (() => void) | undefined
    let resizeObserver: ResizeObserver | undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const context = gsap.context(() => {
      const progressState = { value: 0 }
      const animateProgress = gsap.quickTo(progressState, 'value', {
        duration: reducedMotion ? 0 : 0.12,
        ease: 'power2.out',
        onUpdate: () => borderPath.setAttribute('stroke-dasharray', `${progressState.value} 1`),
      })
      updateProgress = () => {
        const scrollRange = viewport.scrollHeight - viewport.clientHeight
        const progress = scrollRange > 0 ? viewport.scrollTop / scrollRange : 0
        animateProgress(Math.min(1, Math.max(0, progress)))
      }
      updateBorderSize = () => {
        const { width, height } = border.getBoundingClientRect()
        const pathWidth = Math.max(0, width - 2)
        const pathHeight = Math.max(0, height - 2)
        border.setAttribute('viewBox', `0 0 ${width} ${height}`)
        borderPath.setAttribute('width', String(pathWidth))
        borderPath.setAttribute('height', String(pathHeight))
        updateProgress?.()
      }
      viewport.addEventListener('scroll', updateProgress, { passive: true })
      resizeObserver = new ResizeObserver(() => updateBorderSize?.())
      resizeObserver.observe(viewport)
      resizeObserver.observe(content)
      updateBorderSize()
    }, viewport)

    return () => {
      if (updateProgress) viewport.removeEventListener('scroll', updateProgress)
      resizeObserver?.disconnect()
      context.revert()
    }
  }, [])

  return <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
    <section className="space-y-4" aria-label="Form fields">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-4">
        <div><h2 className="font-semibold text-slate-900">Form fields</h2><p className="mt-1 text-xs text-slate-600">Name and email stay visible and required. Use the arrows or drag a row to reorder.</p></div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="attendance-form-template">Choose a form template</label><select id="attendance-form-template" value={template} onChange={(event) => setTemplate(event.target.value as AttendanceFormTemplate)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700">{ATTENDANCE_FORM_TEMPLATES.map((item) => <option key={item}>{item}</option>)}</select>
          <button type="button" onClick={applyTemplate} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Apply template</button>
          <button type="button" onClick={restoreDefaults} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" /> Restore standard</button>
          <button type="button" onClick={addField} disabled={fields.length >= 40} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Add field</button>
        </div>
      </div>
      {!valid.success && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{valid.error.issues[0]?.message}</p>}
      <details className="rounded-xl border border-slate-200 bg-white p-4" open={sections.length > 0}>
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Form sections <span className="ml-1 text-xs font-normal text-slate-500">({sections.length || 'not grouped'})</span></summary>
        {sections.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {sections.map((section) => <div key={section.id} className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`section-${section.id}`}>Section title</label>
            <input id={`section-${section.id}`} value={section.label} maxLength={100} onChange={(event) => updateSection(section.id, event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" />
            {sections.length > 1 && <button type="button" onClick={() => removeSection(section.id)} aria-label={`Remove ${section.label} section`} className="rounded-md p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}
          </div>)}
        </div>}
        <button type="button" onClick={addSection} disabled={sections.length >= 12} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Add section</button>
      </details>
      <div className="space-y-3">
        {fields.map((field, index) => {
          const protectedField = field.id === 'full_name' || field.id === 'email'
          const hasOptions = ['SELECT', 'RADIO', 'CHECKBOX'].includes(field.type)
          return <article key={field.id} draggable onDragStart={() => setDragging(field.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropField(field.id)} onDragEnd={() => setDragging(null)} className={`rounded-xl border bg-white p-4 shadow-sm ${dragging === field.id ? 'border-sky-400 opacity-60' : 'border-slate-200'}`}>
            <div className="mb-3 flex items-center gap-2">
              <span className="cursor-grab text-slate-400" aria-label="Drag to reorder"><GripVertical className="h-4 w-4" /></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Field {index + 1}{protectedField ? ' · required system field' : ''}</span>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => moveField(field.id, -1)} disabled={index === 0} aria-label={`Move ${field.label} up`} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveField(field.id, 1)} disabled={index === fields.length - 1} aria-label={`Move ${field.label} down`} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                {!protectedField && <button type="button" onClick={() => removeField(field)} aria-label={`Remove ${field.label}`} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold text-slate-700">Label<input value={field.label} maxLength={120} onChange={(event) => replaceField(field.id, { label: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>
              <label className="space-y-1 text-xs font-semibold text-slate-700">Field type<select value={field.type} disabled={protectedField} onChange={(event) => {
                const type = event.target.value as AttendanceFieldType
                const options = ['SELECT', 'RADIO', 'CHECKBOX'].includes(type) ? (field.options?.length ? field.options : ['Option 1']) : undefined
                replaceField(field.id, { type, options, validation: type === 'SHORT_TEXT' || type === 'LONG_TEXT' || type === 'EMAIL' || type === 'PHONE' ? field.validation : undefined })
              }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100">{ATTENDANCE_FIELD_TYPES.map((type) => <option key={type} value={type}>{fieldTypeNames[type]}</option>)}</select></label>
              {sections.length > 0 && <label className="space-y-1 text-xs font-semibold text-slate-700">Section<select value={field.sectionId || ''} onChange={(event) => replaceField(field.id, { sectionId: event.target.value || undefined })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"><option value="">Additional Questions</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.label || 'Untitled section'}</option>)}</select></label>}
              <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">Helper text<textarea value={field.description || ''} maxLength={500} rows={2} onChange={(event) => replaceField(field.id, { description: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>
              {!['SELECT', 'RADIO', 'CHECKBOX', 'CONSENT'].includes(field.type) && <label className="space-y-1 text-xs font-semibold text-slate-700">Placeholder<input value={field.placeholder || ''} maxLength={200} onChange={(event) => replaceField(field.id, { placeholder: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>}
              {hasOptions && <label className="space-y-1 text-xs font-semibold text-slate-700">Options <span className="font-normal text-slate-500">one per line</span><textarea value={optionsText(field)} rows={3} onChange={(event) => replaceField(field.id, { options: event.target.value.split('\n').map((option) => option.trim()).filter(Boolean) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>}
              {['SHORT_TEXT', 'LONG_TEXT'].includes(field.type) && <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-xs font-semibold text-slate-700">Minimum length<input type="number" min={0} max={6000} value={field.validation?.minLength ?? ''} onChange={(event) => replaceField(field.id, { validation: { ...field.validation, minLength: event.target.value ? Number(event.target.value) : undefined } })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-700">Maximum length<input type="number" min={1} max={6000} value={field.validation?.maxLength ?? ''} onChange={(event) => replaceField(field.id, { validation: { ...field.validation, maxLength: event.target.value ? Number(event.target.value) : undefined } })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
              </div>}
              {field.type === 'NUMBER' && <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-xs font-semibold text-slate-700">Minimum value<input type="number" value={field.validation?.min ?? ''} onChange={(event) => replaceField(field.id, { validation: { ...field.validation, min: event.target.value ? Number(event.target.value) : undefined } })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-700">Maximum value<input type="number" value={field.validation?.max ?? ''} onChange={(event) => replaceField(field.id, { validation: { ...field.validation, max: event.target.value ? Number(event.target.value) : undefined } })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
              </div>}
              {!protectedField && <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:col-span-2">
                <label className="space-y-1 text-xs font-semibold text-slate-700">Conditional visibility<select value={field.condition?.fieldId || ''} onChange={(event) => {
                  const controller = conditionControllers.find((candidate) => candidate.id === event.target.value)
                  const firstOption = controller?.options?.[0]
                  replaceField(field.id, { condition: controller && firstOption ? { fieldId: controller.id, operator: controller.type === 'CHECKBOX' ? 'includes' : 'equals', value: firstOption } : undefined })
                }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"><option value="">Always show this question</option>{conditionControllers.map((controller) => <option key={controller.id} value={controller.id}>{controller.label}</option>)}</select></label>
                {field.condition && (() => {
                  const controller = fields.find((candidate) => candidate.id === field.condition?.fieldId)
                  return controller?.options ? <label className="space-y-1 text-xs font-semibold text-slate-700">Show when the answer<select value={field.condition.value} onChange={(event) => replaceField(field.id, { condition: { ...field.condition!, value: event.target.value } })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100">{controller.options.map((option) => <option key={option}>{option}</option>)}</select></label> : null
                })()}
                <p className="text-[11px] font-normal text-slate-500">Uses one visible choice question. Hidden answers are cleared and are not accepted on submission.</p>
              </div>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={field.required} disabled={protectedField} onChange={(event) => replaceField(field.id, { required: event.target.checked })} className="rounded border-slate-300 text-sky-700 focus:ring-sky-600 disabled:opacity-50" /> Required</label>
              <button type="button" disabled={protectedField} onClick={() => replaceField(field.id, { visible: !field.visible })} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50">{field.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{field.visible ? 'Visible' : 'Hidden'}</button>
            </div>
          </article>
        })}
      </div>
    </section>

    <aside className="xl:sticky xl:top-4 xl:self-start" aria-label="Live form preview">
      <div className="relative max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div
          ref={previewScrollRef}
          role="region"
          aria-label="Live form preview. Scroll to review the complete attendee form."
          tabIndex={0}
          className="nice-hidden-scrollbar max-h-[calc(100dvh-2.125rem)] min-h-0 overflow-y-auto overscroll-contain p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-inset sm:p-5"
        >
          <div ref={previewContentRef} className="space-y-4 pt-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-sky-700">Live preview</p><h2 className="mt-1 text-lg font-bold text-slate-900">Attendee form</h2><p className="mt-1 text-xs text-slate-500">Changes appear here as you edit.</p></div>
            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="border-b border-slate-100 pb-4"><CustomFormBrand logoClassName="h-12 w-12" /><p className="mt-4 text-sm font-semibold text-slate-900">Attendance registration</p></div>
              {previewGroups.map((group) => <section key={group.id} className="space-y-3">
                {group.label && <div className="border-b border-slate-100 pb-2"><h3 className="text-sm font-semibold text-slate-900">{group.label}</h3>{group.description && <p className="mt-1 text-xs text-slate-500">{group.description}</p>}</div>}
                {group.fields.map((field) => <div key={field.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"><AttendanceFormFieldControl field={field} value={previewResponses[field.id]} onChange={(response) => updatePreviewResponse(field.id, response)} /></div>)}
              </section>)}
              <button type="button" disabled className="w-full rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white opacity-70">Submit attendance</button>
            </div>
          </div>
        </div>
        <svg ref={previewBorderRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="nice-preview-border-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="52%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <rect
            ref={previewBorderPathRef}
            x="1"
            y="1"
            width="0"
            height="0"
            rx="15"
            ry="15"
            pathLength="1"
            stroke="url(#nice-preview-border-gradient)"
            strokeWidth="2"
            strokeDasharray="0 1"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </aside>
    <ConfirmDialog
      isOpen={Boolean(confirmation)}
      onClose={() => setConfirmation(null)}
      onConfirm={() => confirmation?.onConfirm()}
      title={confirmation?.title ?? ''}
      message={confirmation?.message ?? ''}
      confirmLabel={confirmation?.confirmLabel ?? 'Confirm'}
      confirmVariant={confirmation?.confirmVariant}
    />
  </div>
}
