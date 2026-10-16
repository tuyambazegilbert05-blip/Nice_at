import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions/rbac'
import { getCustomFormById, getCustomFormSubmissions, getCustomFormDeliveryHistory, saveCustomFormDraft, FormRevisionConflictError } from '../../../../lib/forms/form-service'
import { recordActivity } from '../../../../lib/activity/activity-service'

export async function GET(_: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:edit')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const { formId } = await params
    const form = await getCustomFormById(formId)
    if (!form) return NextResponse.json({ success: false, error: 'Form not found.' }, { status: 404 })
    return NextResponse.json({ success: true, data: form })
  } catch (error) {
    console.error('Could not load custom form:', error)
    return NextResponse.json({ success: false, error: 'Could not load this form.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:edit')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json() as { config?: unknown; revision?: unknown }
    if (!Number.isInteger(body.revision) || Number(body.revision) < 1) return NextResponse.json({ success: false, error: 'Reload the form and try saving again.' }, { status: 400 })
    const { formId } = await params
    const form = await saveCustomFormDraft(formId, body.config, Number(body.revision), user.id)
    await recordActivity({ actor: user, action: 'custom_form.draft_updated', targetType: 'custom_form', targetId: form.id, targetLabel: form.title, summary: `Updated draft for “${form.title}”`, details: { revision: form.draftRevision } })
    return NextResponse.json({ success: true, data: form })
  } catch (error) {
    if (error instanceof FormRevisionConflictError) return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    if (error instanceof Error && error.message === 'FORM_NOT_FOUND') return NextResponse.json({ success: false, error: 'Form not found.' }, { status: 404 })
    if (error instanceof Error && error.message === 'FORM_ARCHIVED') return NextResponse.json({ success: false, error: 'Restore this archived form before editing it.' }, { status: 409 })
    if (error instanceof Error && 'issues' in error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    console.error('Could not save custom form draft:', error)
    return NextResponse.json({ success: false, error: 'Could not save this draft.' }, { status: 500 })
  }
}
