import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Session } from '../../types'

export function SessionBreakdownChart({ sessions }: { sessions: Session[] }) {
  const typeCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {})

  const total = sessions.length || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(typeCounts).map(([type, count]) => {
          const percent = Math.round((count / total) * 100)
          return (
            <div key={type} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-white capitalize">{type.replace('_', ' ')}</span>
                <span className="text-slate-400">{count} ({percent}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: `${percent}%` }} className="h-full bg-emerald-500 rounded-full" />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
