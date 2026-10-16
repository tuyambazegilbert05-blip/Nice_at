import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions/rbac'
import { getFormEmailTemplate, saveFormEmailTemplate } from '../../../../lib/forms/email-service'
import { recordActivity } from '../../../../lib/activity/activity-service'

const templateSchema = z.object({
  subject: z.string().trim().min(3).max(180),
  heading: z.string().trim().min(3).max(180),
  body: z.string().trim().min(10).max(6000),
}).strict()

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'settings:manage')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try { return NextResponse.json({ success: true, data: await getFormEmailTemplate() }) }
  catch { return NextResponse.json({ success: false, error: 'Could not load the email template.' }, { status: 500 }) }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'settings:manage')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  const parsed = templateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Check the email template.' }, { status: 400 })
  try {
    await saveFormEmailTemplate(parsed.data, user.id)
    await recordActivity({ actor: user, action: 'custom_form.email_template_updated', targetType: 'email_template', targetLabel: parsed.data.subject, summary: 'Updated custom form confirmation email template' })
    return NextResponse.json({ success: true, data: parsed.data })
  } catch (error) {
    console.error('Could not save the form email template:', error)
    return NextResponse.json({ success: false, error: 'Could not save the email template.' }, { status: 500 })
  }
}
