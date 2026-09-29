'use client'

import { useId, useState } from 'react'
import { Check, Circle, Eye, EyeOff } from 'lucide-react'
import { getPasswordChecks, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../lib/auth/password-policy'

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  showRequirements?: boolean
  confirmValue?: string
  error?: string
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'new-password',
  placeholder,
  required = true,
  disabled = false,
  showRequirements = false,
  confirmValue,
  error,
}: PasswordFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const checks = getPasswordChecks(value)
  const strong = checks.every((check) => check.valid)
  const qualityChecks = checks.slice(0, 5)
  const passedChecks = qualityChecks.filter((check) => check.valid).length
  const isConfirmation = confirmValue !== undefined
  const matches = isConfirmation && value.length > 0 && value === confirmValue
  const describedBy = error || showRequirements || (isConfirmation && value.length > 0) ? `${id}-status` : undefined
  const invalid = Boolean(error) || (showRequirements && value.length > 0 && !strong) || (isConfirmation && value.length > 0 && !matches)

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={showRequirements || isConfirmation ? PASSWORD_MIN_LENGTH : undefined}
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 aria-invalid:border-rose-300 aria-invalid:focus:border-rose-400 aria-invalid:focus:ring-rose-100 disabled:bg-slate-50 disabled:text-slate-500"
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error && <p id={`${id}-status`} role="alert" className="mt-1.5 text-xs text-rose-700">{error}</p>}
      {!error && showRequirements && <div id={`${id}-status`} className="mt-2" aria-live="polite" aria-atomic="true">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs font-semibold ${!value ? 'text-slate-500' : strong ? 'text-emerald-700' : 'text-rose-700'}`}>
            {!value ? 'Enter a password to validate' : strong ? 'Strong password' : `Password needs work · ${passedChecks}/5 checks passed`}
          </p>
          {!!value && <span className="text-[10px] font-medium text-slate-500">{passedChecks} / 5</span>}
        </div>
        <div className="mt-1.5 flex gap-1" aria-hidden="true">
          {qualityChecks.map((check, index) => <span key={check.label} className={`h-1 flex-1 rounded-full ${index < passedChecks ? (strong ? 'bg-emerald-500' : 'bg-rose-400') : 'bg-slate-200'}`} />)}
        </div>
        <ul className="mt-1 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
          {checks.map((check) => <li key={check.label} className={`flex items-center gap-1.5 ${check.valid ? 'text-emerald-700' : 'text-slate-500'}`}>
            {check.valid ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <Circle className="h-3 w-3 shrink-0" aria-hidden="true" />}
            <span>{check.label}</span>
          </li>)}
        </ul>
      </div>}
      {!error && isConfirmation && value.length > 0 && <p id={`${id}-status`} className={`mt-1.5 text-xs ${matches ? 'text-emerald-700' : 'text-rose-700'}`} aria-live="polite">
        {matches ? 'Passwords match.' : 'Passwords do not match yet.'}
      </p>}
    </div>
  )
}
