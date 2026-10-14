import type { AttendanceFieldType, AttendanceFormField, AttendanceResponseValue } from '../../lib/forms/attendance-form'

const controlClass = 'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-nice-blue-500 focus:ring-2 focus:ring-nice-blue-500/15 disabled:bg-slate-50'

export function AttendanceFormFieldControl({
  field,
  value,
  onChange,
  disabled = false,
  error,
}: {
  field: AttendanceFormField
  value?: AttendanceResponseValue
  onChange?: (value: AttendanceResponseValue) => void
  disabled?: boolean
  error?: string
}) {
  const helpId = `${field.id}-help`
  const errorId = `${field.id}-error`
  const describedBy = [field.description ? helpId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined
  const requiredMark = field.required ? <span aria-hidden="true" className="ml-1 text-rose-600">*</span> : null
  const label = <span>{field.label}{requiredMark}</span>
  const common = {
    id: field.id,
    name: field.id,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    required: field.required && field.type !== 'CONSENT' && field.type !== 'CHECKBOX',
    placeholder: field.placeholder,
    minLength: field.validation?.minLength,
    maxLength: field.validation?.maxLength,
    min: field.validation?.min,
    max: field.validation?.max,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange?.(event.currentTarget.value),
  }

  let control: React.ReactNode
  if (field.type === 'LONG_TEXT') {
    control = <textarea {...common} rows={4} value={typeof value === 'string' ? value : ''} className={controlClass} />
  } else if (field.type === 'SELECT') {
    control = <select {...common} value={typeof value === 'string' ? value : ''} className={controlClass}>
      <option value="">Choose an option</option>
      {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  } else if (field.type === 'RADIO') {
    control = <fieldset className="space-y-2" aria-describedby={describedBy}>
      <legend className="mb-2 text-sm font-semibold text-slate-800">{label}</legend>
      {(field.options || []).map((option) => <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
        <input type="radio" name={field.id} value={option} checked={value === option} disabled={disabled} required={field.required && !value} onChange={() => onChange?.(option)} className="text-sky-700 focus:ring-sky-600" />
        <span>{option}</span>
      </label>)}
    </fieldset>
  } else if (field.type === 'CHECKBOX') {
    const selected = Array.isArray(value) ? value : []
    control = <fieldset className="space-y-2" aria-describedby={describedBy}>
      <legend className="mb-2 text-sm font-semibold text-slate-800">{label}</legend>
      {(field.options || []).map((option) => <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name={`${field.id}[]`} value={option} checked={selected.includes(option)} disabled={disabled} onChange={(event) => {
          const next = event.target.checked ? [...selected, option] : selected.filter((item) => item !== option)
          onChange?.(next)
        }} className="rounded border-slate-300 text-sky-700 focus:ring-sky-600" />
        <span>{option}</span>
      </label>)}
      {field.required && selected.length === 0 && <input aria-label={`${field.label} required`} tabIndex={-1} className="sr-only" required value="" readOnly />}
    </fieldset>
  } else if (field.type === 'CONSENT') {
    control = <label htmlFor={field.id} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
      <input {...common} type="checkbox" checked={value === true} onChange={(event) => onChange?.(event.target.checked)} className="mt-1 rounded border-slate-300 text-sky-700 focus:ring-sky-600" />
      <span>{label}</span>
    </label>
  } else {
    const inputType: Record<Exclude<AttendanceFieldType, 'LONG_TEXT' | 'SELECT' | 'RADIO' | 'CHECKBOX' | 'CONSENT'>, string> = {
      SHORT_TEXT: 'text', EMAIL: 'email', PHONE: 'tel', NUMBER: 'number', DATE: 'date',
    }
    control = <input
      {...common}
      type={inputType[field.type as keyof typeof inputType]}
      step={field.type === 'NUMBER' ? 'any' : undefined}
      value={typeof value === 'number' || typeof value === 'string' ? value : ''}
      className={controlClass}
    />
  }

  return <div className="space-y-1.5">
    {field.type !== 'RADIO' && field.type !== 'CHECKBOX' && field.type !== 'CONSENT' && <label htmlFor={field.id} className="block text-sm font-semibold text-slate-800">{label}</label>}
    {field.description && <p id={helpId} className="text-xs leading-relaxed text-slate-500">{field.description}</p>}
    {control}
    {error && <p id={errorId} role="alert" className="text-xs text-rose-700">{error}</p>}
  </div>
}
