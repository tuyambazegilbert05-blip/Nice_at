import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '../../../../lib/auth'
import { getCustomFormById } from '../../../../lib/forms/form-service'
import { recordActivity } from '../../../../lib/activity/activity-service'
import { getSessionById } from '../../../../lib/sessions/session-service'
import { hasPermission } from '../../../../lib/permissions/rbac'

const requestSchema = z.object({ pathname: z.string().min(1).max(500) }).strict()
const STATIC_PAGES: Record<string, { action: string; summary: string; permission?: Parameters<typeof hasPermission>[1] }> = {
  '/dashboard': { action: 'page.dashboard_viewed', summary: 'Opened the dashboard' },
  '/sessions': { action: 'page.sessions_viewed', summary: 'Opened the sessions list', permission: 'session:view' },
  '/sessions/new': { action: 'page.session_creation_opened', summary: 'Started creating a session', permission: 'session:create' },
  '/attendance': { action: 'page.attendance_viewed', summary: 'Opened attendance records', permission: 'attendance:view' },
  '/participants': { action: 'page.participants_viewed', summary: 'Opened the participants directory', permission: 'attendance:view' },
  '/analytics': { action: 'page.analytics_viewed', summary: 'Opened platform analytics', permission: 'attendance:view' },
  '/communications': { action: 'page.communications_opened', summary: 'Opened communications', permission: 'communications:send' },
  '/forms': { action: 'page.custom_forms_viewed', summary: 'Opened custom forms', permission: 'session:view' },
  '/forms/new': { action: 'page.custom_form_creation_opened', summary: 'Started creating a custom form', permission: 'session:create' },
  '/forms/email-template': { action: 'page.email_template_opened', summary: 'Opened the confirmation email template', permission: 'settings:manage' },
  '/settings': { action: 'page.settings_opened', summary: 'Opened platform settings' },
  '/settings/team': { action: 'page.team_settings_opened', summary: 'Opened team settings' },
  '/settings/permissions': { action: 'page.permissions_viewed', summary: 'Viewed role permissions' },
  '/settings/organization': { action: 'page.organization_settings_viewed', summary: 'Viewed organization settings' },
  '/settings/activity': { action: 'page.activity_log_viewed', summary: 'Reviewed the staff activity history', permission: 'activity:view' },
  '/resources': { action: 'page.resources_viewed', summary: 'Opened platform resources' },
  '/account': { action: 'page.account_viewed', summary: 'Opened account settings' },
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 })
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !parsed.data.pathname.startsWith('/') || parsed.data.pathname.startsWith('//')) {
    return NextResponse.json({ success: false, error: 'Choose a valid platform page.' }, { status: 400 })
  }

  const pathname = parsed.data.pathname.replace(/\/+$/, '') || '/'
  const page = STATIC_PAGES[pathname]
  if (page) {
    if (page.permission && !hasPermission(user.role, page.permission)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    await recordActivity({ actor: user, action: page.action, targetType: 'platform_page', summary: page.summary })
    return NextResponse.json({ success: true })
  }

  const segments = pathname.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment))
  if (segments[0] === 'sessions' && segments[1] && segments[1] !== 'new') {
    if (!hasPermission(user.role, segments[2] === 'attendees' || segments[2] === 'analytics' ? 'attendance:view' : 'session:view')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const session = await getSessionById(segments[1])
    if (!session) return NextResponse.json({ success: false, error: 'Session not found.' }, { status: 404 })
    const suffix = segments[2]
    const action = suffix === 'attendees' ? ['page.session_attendance_viewed', `Viewed attendance for “${session.title}”`]
      : suffix === 'analytics' ? ['page.session_analytics_viewed', `Opened analytics for “${session.title}”`]
      : suffix === 'edit' ? ['page.session_editor_opened', `Opened the editor for “${session.title}”`]
        : suffix === 'qr' ? ['page.session_qr_tools_opened', `Opened QR tools for “${session.title}”`]
          : ['page.session_viewed', `Opened session “${session.title}”`]
    await recordActivity({ actor: user, action: action[0], targetType: 'session', targetId: session.id, targetLabel: session.title, summary: action[1] })
    return NextResponse.json({ success: true })
  }

  if (segments[0] === 'forms' && segments[1] && !['new', 'email-template'].includes(segments[1])) {
    if (!hasPermission(user.role, segments[2] === 'responses' || segments[2] === 'analytics' ? 'attendance:view' : 'session:view')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const form = await getCustomFormById(segments[1])
    if (!form) return NextResponse.json({ success: false, error: 'Form not found.' }, { status: 404 })
    const suffix = segments[2]
    const action = suffix === 'responses' ? ['page.custom_form_responses_viewed', `Viewed responses for “${form.title}”`]
      : suffix === 'analytics' ? ['page.custom_form_analytics_viewed', `Opened analytics for “${form.title}”`]
        : suffix === 'share' ? ['page.custom_form_sharing_opened', `Opened sharing tools for “${form.title}”`]
          : suffix === 'edit' ? ['page.custom_form_editor_opened', `Opened the builder for “${form.title}”`]
            : ['page.custom_form_overview_viewed', `Opened “${form.title}”`]
    await recordActivity({ actor: user, action: action[0], targetType: 'custom_form', targetId: form.id, targetLabel: form.title, summary: action[1] })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: 'This page is not included in the activity history.' }, { status: 400 })
}
