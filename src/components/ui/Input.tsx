import React from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, required, id, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="group/input w-full space-y-1.5" data-form-field>
        {label && (
          <label htmlFor={inputId} className={`block text-xs font-semibold tracking-wide transition-colors ${error ? 'text-rose-700' : 'text-slate-700 group-focus-within/input:text-nice-blue-700'}`}>
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          required={required}
          aria-invalid={error ? true : ariaInvalid}
          className={cn(
            'w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-nice-blue-500/20 focus:border-nice-blue-500',
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
