import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { recordActivity } from '../../../../../lib/activity/activity-service'
import { getCustomFormById, setCustomFormResponseOverride } from '../../../../../lib/forms/form-service'

const overrideSchema = z.discriminatedUnion('open', [
  z.object({ open: z.literal(true), minutes: z.number().int().min(1).max(60) }).strict(),
  z.object({ open: z.literal(false) }).strict(),
])

export async function POST(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:override')) {
    return NextResponse.json({ success: false, error: 'Only administrators can temporarily open form responses outside the scheduled window.' }, { status: 403 })
  }

  const parsed = overrideSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Choose to open responses for 1–60 minutes or close the temporary extension.' }, { status: 400 })

  try {
    const { formId } = await params
    const previous = await getCustomFormById(formId)
    if (!previous || previous.archivedAt) return NextResponse.json({ success: false, error: 'Form not found.' }, { status: 404 })
    const form = await setCustomFormResponseOverride(formId, parsed.data.open ? parsed.data.minutes : null, user.id)
    if (parsed.data.open) {
      await recordActivity({ actor: user, action: 'custom_form.response_override_opened', targetType: 'custom_form', targetId: form.id, targetLabel: form.title,
        summary: `Opened extra responses for “${form.title}” for ${parsed.data.minutes} minutes`,
        details: { extensionMinutes: parsed.data.minutes, closesAt: form.responseOverrideUntil } })
    } else {
      await recordActivity({ actor: user, action: 'custom_form.response_override_closed', targetType: 'custom_form', targetId: form.id, targetLabel: form.title,
        summary: `Closed extra responses for “${form.title}”`, details: { previousClosesAt: previous.responseOverrideUntil } })
    }
    return NextResponse.json({ success: true, data: form })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORM_NOT_FOUND_OR_UNPUBLISHED') {
      return NextResponse.json({ success: false, error: 'Publish this form before opening an extra response window.' }, { status: 409 })
    }
    console.error('Could not change temporary custom form response access:', error)
    return NextResponse.json({ success: false, error: 'Could not change the extra response window.' }, { status: 500 })
  }
}
