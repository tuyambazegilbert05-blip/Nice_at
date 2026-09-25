import React from 'react'
import { BarChart3, TrendingUp, Users, Calendar, Award } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/NiCE-Logo-Animated.gif"
          alt="NiCE Club Rwanda"
          className="w-12 h-12 rounded-xl object-contain bg-white shadow-subtle p-0.5 border border-slate-200/80"
        />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Session Intelligence & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Evidence-based participation statistics, academic demographics, and engagement trajectories.
          </p>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value="0"
          subtitle="All sessions"
          icon={<Calendar className="w-5 h-5 text-nice-blue-600" />}
        />
        <StatCard
          title="Verified Attendance"
          value="0"
          subtitle="Cumulative check-ins"
          icon={<Users className="w-5 h-5 text-nice-blue-600" />}
        />
        <StatCard
          title="Avg Participants"
          value="0"
          subtitle="Per session"
          icon={<TrendingUp className="w-5 h-5 text-nice-blue-600" />}
        />
        <StatCard
          title="Top Segment"
          value="Students"
          subtitle="University & Polytechnic"
          icon={<Award className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Demographic Distribution</CardTitle>
            <CardDescription>Attendee breakdown by participant categorization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
              <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">Demographic charts will render dynamically</p>
              <p className="text-slate-400 mt-1 max-w-xs">
                As verified participants check in through live session QR codes, distribution charts populate automatically.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Trajectory</CardTitle>
            <CardDescription>Monthly growth and participation trend across Rwanda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
              <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">Temporal participation timeline</p>
              <p className="text-slate-400 mt-1 max-w-xs">
                Timeline visualization of clean energy educational outreach and attendance over calendar quarters.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
