import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { createCustomForm, getCustomForms } from '../../../lib/forms/form-service'

const formDetailsSchema = z.object({
  title: z.string().trim().min(3).max(180),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
  }, 'Enter a valid event date.'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  location: z.string().trim().min(2).max(500),
}).strict().refine((form) => form.endTime > form.startTime, { message: 'End time must be after start time.', path: ['endTime'] })

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:view')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    return NextResponse.json({ success: true, data: await getCustomForms() })
  } catch (error) {
    console.error('Could not load custom forms:', error)
    return NextResponse.json({ success: false, error: 'Could not load forms.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'session:create')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const parsed = formDetailsSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Enter valid form details.' }, { status: 400 })
    const form = await createCustomForm(parsed.data, user.id)
    return NextResponse.json({ success: true, data: form }, { status: 201 })
  } catch (error) {
    console.error('Could not create custom form:', error)
    return NextResponse.json({ success: false, error: 'Could not create this form.' }, { status: 500 })
  }
}
