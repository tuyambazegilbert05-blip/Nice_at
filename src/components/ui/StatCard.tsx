import React from 'react'
import { Card, CardContent } from './Card'
import { cn } from '../../utils/cn'

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden relative hover:border-nice-blue-200 transition-all group', className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-nice-blue-50 text-nice-blue-600 flex items-center justify-center border border-nice-blue-100 group-hover:scale-105 transition-transform">
              {icon}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value}</span>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5',
                trend.positive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              )}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}%
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>}
      </CardContent>
      {/* Subtle bottom energy line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-nice-blue-500/0 via-nice-blue-500/30 to-nice-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  )
}
