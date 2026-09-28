import React from 'react'
import type { DistributionItem } from '../../types/analytics'

const palette = ['#1674c8', '#10a879', '#f2a93b', '#8b6bd6', '#ed7181', '#20aabe']
const number = (value: number) => new Intl.NumberFormat('en').format(value)

export function TimeSeriesChart({ data, label = 'Check-ins' }: {
  data: { label: string; value: number }[]
  label?: string
}) {
  if (!data.length || data.every((point) => point.value === 0)) {
    return <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">No activity in this period</div>
  }

  const width = 720
  const height = 260
  const left = 42
  const right = 14
  const top = 14
  const bottom = 38
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const max = Math.max(1, ...data.map((point) => point.value))
  const step = data.length > 1 ? plotWidth / (data.length - 1) : 0
  const points = data.map((point, index) => ({
    ...point,
    x: left + step * index,
    y: top + plotHeight - (point.value / max) * plotHeight,
  }))
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const area = `${line} L ${points.at(-1)?.x ?? left} ${top + plotHeight} L ${points[0].x} ${top + plotHeight} Z`
  const tickValues = [max, Math.round(max * 0.66), Math.round(max * 0.33), 0]
  const labelIndexes = [...new Set([0, Math.round((data.length - 1) / 3), Math.round(((data.length - 1) * 2) / 3), data.length - 1])]

  return (
    <div className="w-full" role="img" aria-label={`${label} time series chart`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="analytics-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1882d2" stopOpacity=".22" /><stop offset="100%" stopColor="#1882d2" stopOpacity="0" /></linearGradient>
        </defs>
        {tickValues.map((tick, index) => {
          const y = top + (plotHeight / 3) * index
          return <g key={`${tick}-${index}`}><line x1={left} x2={width - right} y1={y} y2={y} stroke="#e7edf3" strokeDasharray="4 5" /><text x={left - 9} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize="11">{number(tick)}</text></g>
        })}
        <path d={area} fill="url(#analytics-area)" />
        <path d={line} fill="none" stroke="#1674c8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="3.5" fill="#fff" stroke="#1674c8" strokeWidth="2" vectorEffect="non-scaling-stroke"><title>{`${point.label}: ${number(point.value)} ${label.toLowerCase()}`}</title></circle></g>)}
        {labelIndexes.map((index) => <text key={data[index].label} x={points[index].x} y={height - 9} textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'} className="fill-slate-400" fontSize="11">{data[index].label}</text>)}
      </svg>
      <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500"><span className="h-2 w-2 rounded-full bg-nice-blue-600" />{label}</div>
    </div>
  )
}

export function DonutChart({ items, emptyLabel = 'No data' }: { items: DistributionItem[]; emptyLabel?: string }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  if (!total) return <div className="flex min-h-56 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">{emptyLabel}</div>

  const radius = 43
  const circumference = 2 * Math.PI * radius
  const segments = items.filter((item) => item.count > 0).reduce<(DistributionItem & { color: string; length: number; offset: number })[]>((list, item) => {
    const length = (item.count / total) * circumference
    const previous = list.at(-1)
    return [...list, { ...item, color: palette[list.length % palette.length], length, offset: previous ? previous.offset + previous.length : 0 }]
  }, [])

  return (
    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center gap-4 sm:gap-6">
      <div className="relative mx-auto aspect-square w-full max-w-44">
        <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90" role="img" aria-label={`Distribution of ${number(total)} attendance records`}>
          <circle cx="56" cy="56" r={radius} fill="none" stroke="#edf2f7" strokeWidth="13" />
          {segments.map((segment) => <circle key={segment.label} cx="56" cy="56" r={radius} fill="none" stroke={segment.color} strokeWidth="13" strokeDasharray={`${segment.length} ${circumference - segment.length}`} strokeDashoffset={-segment.offset} strokeLinecap="butt"><title>{`${segment.label}: ${number(segment.count)}, ${Math.round((segment.count / total) * 100)}%`}</title></circle>)}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold tracking-tight text-slate-900">{number(total)}</span><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</span></div>
      </div>
      <ul className="min-w-0 space-y-3">
        {segments.slice(0, 6).map((segment) => <li key={segment.label} className="flex min-w-0 items-center gap-2 text-xs"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: segment.color }} /><span className="min-w-0 flex-1 truncate text-slate-600">{segment.label}</span><span className="shrink-0 font-semibold tabular-nums text-slate-800">{Math.round((segment.count / total) * 100)}%</span></li>)}
        {segments.length > 6 && <li className="text-xs text-slate-400">+{segments.length - 6} more</li>}
      </ul>
    </div>
  )
}

export function PercentageRing({ value, label }: { value: number; label: string }) {
  const percentage = Math.max(0, Math.min(100, Math.round(value)))
  const radius = 24
  const circumference = 2 * Math.PI * radius
  return (
    <div className="flex shrink-0 items-center" role="img" aria-label={`${label}: ${percentage}%`}>
      <div className="relative h-12 w-12 shrink-0">
        <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="30" cy="30" r={radius} fill="none" stroke="#e8eef4" strokeWidth="5" /><circle cx="30" cy="30" r={radius} fill="none" stroke="#10a879" strokeWidth="5" strokeDasharray={`${circumference * percentage / 100} ${circumference}`} strokeLinecap="round" /></svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-slate-800">{percentage}%</span>
      </div>
    </div>
  )
}
