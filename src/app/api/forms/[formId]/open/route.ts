import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { recordActivity } from '../../../../../lib/activity/activity-service'
import { getCustomFormById, reopenCustomForm } from '../../../../../lib/forms/form-service'

export async function POST(_: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:edit')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const { formId } = await params
    const form = await getCustomFormById(formId)
    if (!form || form.archivedAt) return NextResponse.json({ success: false, error: 'Form not found.' }, { status: 404 })
    await reopenCustomForm(formId, user.id)
    await recordActivity({ actor: user, action: 'custom_form.responses_opened', targetType: 'custom_form', targetId: form.id, targetLabel: form.title,
      summary: `Opened responses for “${form.title}”`, details: { title: form.title, from: form.status, to: 'PUBLISHED' } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'This form could not be opened.' }, { status: 404 })
  }
}
