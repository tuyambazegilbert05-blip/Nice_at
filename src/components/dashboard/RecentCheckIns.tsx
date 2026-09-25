import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Attendance } from '../../types'
import { formatRelativeTime } from '../../utils/date'
import { formatInitials } from '../../utils/format'

export function RecentCheckIns({ records }: { records: Attendance[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Recent Check-Ins</CardTitle>
        <span className="text-xs text-slate-500 font-medium">Live Activity Feed</span>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No recent check-ins recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.slice(0, 5).map((record) => (
              <div key={record.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-nice-blue-50 border border-nice-blue-100 text-nice-blue-700 text-xs font-bold flex items-center justify-center">
                    {formatInitials(record.fullName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{record.fullName}</p>
                    <p className="text-xs text-slate-500">{record.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="success" size="sm">
                    {record.participantType}
                  </Badge>
                  <span className="text-xs text-slate-400">{formatRelativeTime(record.submittedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
