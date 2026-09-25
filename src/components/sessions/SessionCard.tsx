import React from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Users, QrCode, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Session, SessionStatus } from '../../types/session'
import { formatDate } from '../../utils/date'

interface SessionCardProps {
  session: Session
}

export function SessionCard({ session }: SessionCardProps) {
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
    <Card className="hover:border-nice-blue-300 hover:shadow-elevated transition-all group overflow-hidden">
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
  )
}
