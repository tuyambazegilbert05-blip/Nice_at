import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { recordActivity } from '../../../../../lib/activity/activity-service'
import { restoreCustomForm } from '../../../../../lib/forms/form-service'

export async function POST(_: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:delete')) return NextResponse.json({ success: false, error: 'Only administrators can restore archived forms.' }, { status: 403 })
  try {
    const { formId } = await params
    const form = await restoreCustomForm(formId, user.id)
    if (!form) return NextResponse.json({ success: false, error: 'Archived form not found.' }, { status: 404 })
    await recordActivity({ actor: user, action: 'custom_form.restored', targetType: 'custom_form', targetId: form.id, targetLabel: form.title,
      summary: `Restored custom form “${form.title}”`, details: { title: form.title } })
    return NextResponse.json({ success: true, data: form })
  } catch (error) {
    console.error('Could not restore custom form:', error)
    return NextResponse.json({ success: false, error: 'Could not restore this form.' }, { status: 500 })
  }
}
