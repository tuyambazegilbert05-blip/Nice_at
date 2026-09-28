import Link from 'next/link'
import { Activity, CalendarDays, ClipboardCheck, Users } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/Card'

const tools = [
  { title: 'Sessions', description: 'View scheduled sessions, open a session, or create a new one.', href: '/sessions', icon: CalendarDays },
  { title: 'Attendance', description: 'Review check-in records saved for your organization.', href: '/attendance', icon: ClipboardCheck },
  { title: 'Participants', description: 'Search participant records collected through session check-in.', href: '/participants', icon: Users },
  { title: 'Analytics', description: 'Explore attendance trends and session summaries from recorded data.', href: '/analytics', icon: Activity },
]

export default function PlatformToolsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Platform Tools</h1>
        <p className="mt-1 text-sm text-slate-500">Open the live NiCE Club attendance and reporting sections.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tools.map(({ title, description, href, icon: Icon }) => (
          <Link key={href} href={href} className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nice-blue-500">
            <Card className="h-full transition-colors group-hover:border-nice-blue-300">
              <CardContent className="flex h-full items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-nice-blue-100 bg-nice-blue-50 text-nice-blue-700"><Icon className="h-5 w-5" /></span>
                <span>
                  <span className="block font-semibold text-slate-900">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-600">{description}</span>
                  <span className="mt-3 inline-block text-xs font-semibold text-nice-blue-700">Open {title} →</span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
