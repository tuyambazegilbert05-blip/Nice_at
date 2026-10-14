import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { FormRevisionConflictError, publishCustomForm } from '../../../../../lib/forms/form-service'

export async function POST(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:edit')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({})) as { revision?: unknown }
    if (!Number.isInteger(body.revision) || Number(body.revision) < 1) return NextResponse.json({ success: false, error: 'Save the latest draft before publishing.' }, { status: 400 })
    const { formId } = await params
    const form = await publishCustomForm(formId, Number(body.revision), user.id)
    return NextResponse.json({ success: true, data: form })
  } catch (error) {
    if (error instanceof FormRevisionConflictError) return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    if (error instanceof Error && error.message === 'FORM_NOT_FOUND') return NextResponse.json({ success: false, error: 'Form not found.' }, { status: 404 })
    if (error instanceof Error && error.message === 'FORM_ARCHIVED') return NextResponse.json({ success: false, error: 'Restore this archived form before publishing.' }, { status: 409 })
    if (error instanceof Error && error.message === 'FORM_CLOSED') return NextResponse.json({ success: false, error: 'A closed form cannot be published.' }, { status: 409 })
    if (error instanceof Error && 'issues' in error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    console.error('Could not publish custom form:', error)
    return NextResponse.json({ success: false, error: 'Could not publish this form.' }, { status: 500 })
  }
}
