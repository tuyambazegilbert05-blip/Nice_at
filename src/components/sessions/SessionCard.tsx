'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Users, QrCode, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Session, SessionStatus } from '../../types/session'
import { formatDate } from '../../utils/date'
import { gsap } from '../../motion/gsap'
import { MOTION_DURATION, MOTION_EASE } from '../../motion/gsap/config'
import { useGSAP } from '../../motion/gsap/useGsap'

interface SessionCardProps {
  session: Session
}

export function SessionCard({ session }: SessionCardProps) {
  const card = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const element = card.current
    if (!element) return
    const media = gsap.matchMedia()
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      gsap.set(element, { transformPerspective: 900, transformOrigin: 'center' })
      const rotateX = gsap.quickTo(element, 'rotationX', { duration: MOTION_DURATION.standard, ease: MOTION_EASE.smooth })
      const rotateY = gsap.quickTo(element, 'rotationY', { duration: MOTION_DURATION.standard, ease: MOTION_EASE.smooth })
      const moveY = gsap.quickTo(element, 'y', { duration: MOTION_DURATION.standard, ease: MOTION_EASE.smooth })
      const onMove = (event: PointerEvent) => {
        const rect = element.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        rotateX(-y * 2.4)
        rotateY(x * 2.4)
        moveY(-2)
      }
      const onLeave = () => { rotateX(0); rotateY(0); moveY(0) }
      element.addEventListener('pointermove', onMove)
      element.addEventListener('pointerleave', onLeave)
      return () => {
        element.removeEventListener('pointermove', onMove)
        element.removeEventListener('pointerleave', onLeave)
      }
    })
    return () => media.revert()
  }, { scope: card, dependencies: [], revertOnUpdate: true })

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="success" dot size="sm">Open</Badge>
      case 'UPCOMING':
        return <Badge variant="info" dot size="sm">Upcoming</Badge>
      case 'CLOSING_SOON':
        return <Badge variant="warning" dot size="sm">Closing Soon</Badge>
      case 'CLOSED':
        return <Badge variant="neutral" dot size="sm">Closed</Badge>
      case 'DRAFT':
      default:
        return <Badge variant="neutral" dot size="sm">Draft</Badge>
    }
  }

  const attendanceCount = session._count?.attendance ?? 0

  return (
    <div ref={card} data-session-flip data-motion-item className="h-full [transform-style:preserve-3d]">
    <Card className="h-full hover:border-nice-blue-300 hover:shadow-elevated transition-[border-color,box-shadow] duration-200 group overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header row: Type and Status */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="default" size="sm">
            {session.type.replace('_', ' ')}
          </Badge>
          {getStatusBadge(session.status)}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-nice-blue-600 transition-colors line-clamp-1">
            {session.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {session.description}
          </p>
        </div>

        {/* Meta details */}
        <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-nice-blue-600 shrink-0" />
            <span>{formatDate(session.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-nice-blue-600 shrink-0" />
            <span>{session.startTime} — {session.endTime} CAT</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{session.location}</span>
          </div>
        </div>

        {/* Footer: Attendees & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Users className="w-4 h-4 text-nice-blue-600" />
            <span>{attendanceCount} attendees</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/sessions/${session.id}/qr`}>
              <button
                title="View QR Code"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-nice-blue-600 hover:border-nice-blue-300 transition-colors"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </Link>

            <Link href={`/sessions/${session.id}`}>
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
