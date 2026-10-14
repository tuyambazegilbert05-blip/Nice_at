import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { updateCustomFormResponseWindow } from '../../../../../lib/forms/form-service'

const bodySchema = z.object({
  opensAt: z.string().datetime({ offset: true }),
  closesAt: z.string().datetime({ offset: true }),
}).strict()

export async function PATCH(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:edit')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Enter both response dates and times.' }, { status: 400 })
    const { formId } = await params
    const data = await updateCustomFormResponseWindow(formId, parsed.data.opensAt, parsed.data.closesAt, user.id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof Error && error.message.includes('closing time')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'FORM_NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Form not found.' }, { status: 404 })
    }
    console.error('Could not update custom form response window:', error)
    return NextResponse.json({ success: false, error: 'Could not update the response window.' }, { status: 500 })
  }
}
