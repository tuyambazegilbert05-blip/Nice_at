import React from 'react'
import type { DistributionItem } from '../../types/analytics'
import { AnimatedBar } from './AnimatedBar'

export function DistributionBars({ items, emptyLabel }: { items: DistributionItem[]; emptyLabel: string }) {
  if (!items.length) return <p className="flex min-h-36 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">{emptyLabel}</p>
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate font-medium capitalize text-slate-600">{item.label.replaceAll('_', ' ')}</span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-800">{item.count.toLocaleString()} <span className="ml-1 font-normal text-slate-400">{item.percentage}%</span></span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${item.label}: ${item.count} records, ${item.percentage}%`}>
            <AnimatedBar percentage={item.count ? Math.max(2, item.percentage) : 0} className={index % 3 === 1 ? 'bg-emerald-500' : index % 3 === 2 ? 'bg-cyan-500' : 'bg-gradient-to-r from-nice-blue-600 to-cyan-400'} />
          </div>
        </div>
      ))}
    </div>
  )
}
