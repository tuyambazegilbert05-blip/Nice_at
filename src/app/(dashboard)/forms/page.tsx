import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3, CheckCircle2, ClipboardList, FilePlus2, Mail, Plus, Share2, Users } from 'lucide-react'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { getCustomForms } from '../../../lib/forms/form-service'
import { getResponseWindowState } from '../../../lib/forms/response-window'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'

function formatKigaliDate(value: string): string {
  return new Intl.DateTimeFormat('en-RW', { dateStyle: 'medium', timeZone: 'Africa/Kigali' }).format(new Date(`${value.slice(0, 10)}T12:00:00+02:00`))
}

export default async function FormsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'session:view')) redirect('/dashboard')
  const [allForms, canCreate, canManageTemplate] = [
    await getCustomForms(),
    hasPermission(user.role, 'session:create'),
    hasPermission(user.role, 'settings:manage'),
  ]
  const forms = allForms.filter((form) => !form.archivedAt)
  const archivedForms = allForms.filter((form) => Boolean(form.archivedAt))
  const canEdit = hasPermission(user.role, 'session:edit')
  const totalAttendees = allForms.reduce((count, form) => count + form.responseCount, 0)
  const publishedForms = forms.filter((form) => form.status === 'PUBLISHED').length
  const acceptingForms = forms.filter((form) => getResponseWindowState(form) === 'ACCEPTING').length

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700"><ClipboardList className="h-5 w-5" /></span>
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Custom Forms</h1><p className="mt-1 max-w-2xl text-sm text-slate-600">Manage independent attendance forms, published links, attendee records, and form analytics. These forms do not change Scientific Sessions or its check-in flow.</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {canManageTemplate && <Link href="/forms/email-template"><Button variant="outline" size="sm" leftIcon={<Mail className="h-4 w-4" />}>Confirmation email</Button></Link>}
        {canCreate && <Link href="/forms/new"><Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>Create form</Button></Link>}
      </div>
    </header>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <StatCard title="Custom forms" value={forms.length} icon={<ClipboardList className="h-5 w-5" />} />
      <StatCard title="Published forms" value={publishedForms} subtitle={`${acceptingForms} accepting responses now`} icon={<CheckCircle2 className="h-5 w-5" />} />
      <StatCard title="Total attendees" value={totalAttendees} icon={<Users className="h-5 w-5" />} />
    </div>

    {forms.length === 0 ? <Card><CardContent className="flex flex-col items-center py-14 text-center"><ClipboardList className="h-10 w-10 text-sky-700" /><h2 className="mt-4 text-lg font-semibold text-slate-900">No active custom forms</h2><p className="mt-1 max-w-md text-sm text-slate-500">Create a stand-alone attendance form, customize the questions, then publish a shareable link.</p>{canCreate && <Link href="/forms/new" className="mt-5"><Button variant="primary" leftIcon={<FilePlus2 className="h-4 w-4" />}>Create a form</Button></Link>}</CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">
      {forms.map((form) => <Card key={form.id} className="group relative cursor-pointer overflow-hidden transition hover:border-sky-200 hover:shadow-md">
        <Link href={`/forms/${encodeURIComponent(form.id)}`} aria-label={`Open ${form.title} attendees and analytics`} className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600"><span className="sr-only">Open attendees and analytics for {form.title}</span></Link>
        <CardContent className="pointer-events-none relative z-10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><h2 className="break-words text-lg font-semibold text-slate-900">{form.title}</h2><p className="mt-1 text-xs text-slate-500">{formatKigaliDate(form.eventDate)} · {form.startTime}–{form.endTime} CAT</p><p className="mt-1 break-words text-xs text-slate-600">{form.location}</p></div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getResponseWindowState(form) === 'ACCEPTING' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : getResponseWindowState(form) === 'SCHEDULED' ? 'border-sky-200 bg-sky-50 text-sky-800' : form.status === 'DRAFT' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>{form.status === 'DRAFT' ? 'Draft' : getResponseWindowState(form) === 'ACCEPTING' ? `Accepting · v${form.publishedVersion}` : getResponseWindowState(form) === 'SCHEDULED' ? 'Scheduled' : getResponseWindowState(form) === 'ENDED' ? 'Window ended' : 'Closed'}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900"><Users className="h-4 w-4 shrink-0" /><span className="font-semibold">{form.responseCount.toLocaleString()}</span><span>{form.responseCount === 1 ? 'attendee' : 'attendees'}</span></div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">Updated {new Intl.DateTimeFormat('en-RW', { dateStyle: 'medium', timeZone: 'Africa/Kigali' }).format(new Date(form.updatedAt))}</p>
            <div className="pointer-events-auto flex flex-wrap gap-2"><Link href={`/forms/${encodeURIComponent(form.id)}#form-analytics`}><Button variant="outline" size="sm" leftIcon={<BarChart3 className="h-4 w-4" />}>Analytics</Button></Link><Link href={`/forms/${encodeURIComponent(form.id)}/responses`}><Button variant="outline" size="sm" leftIcon={<Users className="h-4 w-4" />}>Responses</Button></Link><Link href={`/forms/${encodeURIComponent(form.id)}/share`}><Button variant="outline" size="sm" leftIcon={<Share2 className="h-4 w-4" />}>Sharing</Button></Link>{canEdit && <Link href={`/forms/${encodeURIComponent(form.id)}/edit#customize-form`}><Button variant="primary" size="sm">Customize form</Button></Link>}</div>
          </div>
        </CardContent>
      </Card>)}
    </div>}

    {archivedForms.length > 0 && <section className="space-y-3 border-t border-slate-200 pt-5">
      <div><h2 className="text-lg font-bold text-slate-900">Archived forms</h2><p className="mt-1 text-sm text-slate-500">Archived forms no longer accept responses. Their records stay available and administrators can restore them.</p></div>
      <div className="grid gap-3 lg:grid-cols-2">{archivedForms.map((form) => <Card key={form.id} className="relative overflow-hidden border-slate-200 bg-slate-50/70">
        <Link href={`/forms/${encodeURIComponent(form.id)}`} aria-label={`Review archived form ${form.title}`} className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600"><span className="sr-only">Review archived form {form.title}</span></Link>
        <CardContent className="pointer-events-none relative z-10 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-semibold text-slate-800">{form.title}</h3><p className="mt-1 text-xs text-slate-500">{formatKigaliDate(form.eventDate)} · {form.startTime}–{form.endTime} CAT</p></div><span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">Archived</span></div><p className="mt-3 text-xs text-slate-600">{form.responseCount.toLocaleString()} saved response{form.responseCount === 1 ? '' : 's'} · restore from the form overview</p></CardContent>
      </Card>)}</div>
    </section>}
  </div>
}
