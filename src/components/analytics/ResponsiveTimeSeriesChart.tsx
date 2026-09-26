'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../motion/gsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'
import { useGSAP } from '../../motion/gsap/useGsap'

const number = (value: number) => new Intl.NumberFormat('en').format(value)

/** Measure the card so SVG labels retain their size on narrow screens. */
export function ResponsiveTimeSeriesChart({ data, label = 'Check-ins' }: {
  data: { label: string; value: number }[]
  label?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<SVGPathElement>(null)
  const areaRef = useRef<SVGPathElement>(null)
  const pointsRef = useRef<SVGGElement>(null)
  const [width, setWidth] = useState(720)
  const dataKey = data.map((point) => `${point.label}:${point.value}`).join('|')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const measure = () => {
      const nextWidth = Math.max(320, Math.round(container.getBoundingClientRect().width))
      setWidth((current) => current === nextWidth ? current : nextWidth)
    }
    const initialFrame = window.requestAnimationFrame(measure)
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => {
        window.cancelAnimationFrame(initialFrame)
        window.removeEventListener('resize', measure)
      }
    }
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => {
      window.cancelAnimationFrame(initialFrame)
      observer.disconnect()
    }
  }, [])

  const hasData = data.length > 0 && !data.every((point) => point.value === 0)

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
  const area = `${line} L ${points.at(-1)?.x ?? left} ${top + plotHeight} L ${points[0]?.x ?? left} ${top + plotHeight} Z`
  const tickValues = [max, Math.round(max * 0.66), Math.round(max * 0.33), 0]
  const labelIndexes = [...new Set([0, Math.round((data.length - 1) / 3), Math.round(((data.length - 1) * 2) / 3), data.length - 1])]

  useGSAP(() => {
    const lineElement = lineRef.current
    const areaElement = areaRef.current
    const dots = pointsRef.current ? Array.from(pointsRef.current.children) : []
    if (!lineElement || !areaElement) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const length = lineElement.getTotalLength()
      gsap.set(lineElement, { strokeDasharray: length, strokeDashoffset: length })
      gsap.set(areaElement, { autoAlpha: 0 })
      gsap.set(dots, { autoAlpha: 0, scale: 0, transformOrigin: 'center center' })
      const timeline = gsap.timeline()
      timeline.to(lineElement, { strokeDashoffset: 0, duration: MOTION_DURATION.long, ease: MOTION_EASE.enter })
        .to(areaElement, { autoAlpha: 1, duration: MOTION_DURATION.standard, ease: MOTION_EASE.standard }, 0.16)
        .to(dots, { autoAlpha: 1, scale: 1, duration: MOTION_DURATION.short, stagger: 0.035, ease: 'back.out(1.7)' }, 0.24)
      return () => timeline.kill()
    })
    media.add('(prefers-reduced-motion: reduce)', () => gsap.set([lineElement, areaElement, ...dots], { clearProps: 'all' }))
    return () => media.revert()
  }, { scope: containerRef, dependencies: [dataKey, width], revertOnUpdate: true })

  if (!hasData) {
    return <div className="flex h-52 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500 sm:h-64">No activity in this period</div>
  }

  return (
    <div ref={containerRef} className="w-full min-w-0" role="img" aria-label={`${label} time series chart`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full overflow-visible sm:h-64" preserveAspectRatio="none" aria-describedby="analytics-series-summary">
        <desc id="analytics-series-summary">{data.map((point) => `${point.label}: ${number(point.value)} ${label.toLowerCase()}`).join('; ')}</desc>
        <defs><linearGradient id="responsive-analytics-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1882d2" stopOpacity=".22" /><stop offset="100%" stopColor="#1882d2" stopOpacity="0" /></linearGradient></defs>
        {tickValues.map((tick, index) => {
          const y = top + (plotHeight / 3) * index
          return <g key={`${tick}-${index}`}><line x1={left} x2={width - right} y1={y} y2={y} stroke="#e7edf3" strokeDasharray="4 5" /><text x={left - 9} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize="12">{number(tick)}</text></g>
        })}
        <path ref={areaRef} d={area} fill="url(#responsive-analytics-area)" />
        <path ref={lineRef} d={line} fill="none" stroke="#1674c8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <g ref={pointsRef}>{points.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="3.5" fill="#fff" stroke="#1674c8" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}</g>
        {labelIndexes.map((index) => <text key={`${data[index].label}-${index}`} x={points[index].x} y={height - 9} textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'} className="fill-slate-400" fontSize="12">{data[index].label}</text>)}
      </svg>
      <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500"><span className="h-2 w-2 rounded-full bg-nice-blue-600" />{label}</div>
    </div>
  )
}
