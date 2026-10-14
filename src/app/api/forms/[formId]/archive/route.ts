import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser, verifyCurrentPassword } from '../../../../../lib/auth/session'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { recordActivity } from '../../../../../lib/activity/activity-service'
import { archiveCustomForm } from '../../../../../lib/forms/form-service'

const confirmationSchema = z.object({ password: z.string().min(1).max(256) }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:delete')) return NextResponse.json({ success: false, error: 'Only administrators can archive forms.' }, { status: 403 })

  const confirmation = confirmationSchema.safeParse(await request.json().catch(() => null))
  if (!confirmation.success) return NextResponse.json({ success: false, error: 'Enter your password to confirm form archival.' }, { status: 400 })
  if (!await verifyCurrentPassword(user.id, confirmation.data.password)) {
    return NextResponse.json({ success: false, error: 'Your password is incorrect. Nothing was archived.' }, { status: 403 })
  }

  try {
    const { formId } = await params
    const form = await archiveCustomForm(formId, user.id)
    if (!form) return NextResponse.json({ success: false, error: 'Form not found or already archived.' }, { status: 404 })
    await recordActivity({ actor: user, action: 'custom_form.archived', targetType: 'custom_form', targetId: form.id, targetLabel: form.title,
      summary: `Archived custom form “${form.title}”`, details: { title: form.title, previousStatus: form.status } })
    return NextResponse.json({ success: true, data: form })
  } catch (error) {
    console.error('Could not archive custom form:', error)
    return NextResponse.json({ success: false, error: 'Could not archive this form.' }, { status: 500 })
  }
}
