import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { getCustomFormDeliveryHistory, getCustomFormSubmissions } from '../../../../../lib/forms/form-service'

export async function GET(_: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'attendance:view')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const { formId } = await params
    const data = await getCustomFormSubmissions(formId)
    const deliveries = await getCustomFormDeliveryHistory(data.map((item) => item.id))
    return NextResponse.json({ success: true, data: data.map((item) => ({ ...item, emailStatus: deliveries.get(item.id)?.status === 'SENDING' ? 'PENDING' : deliveries.get(item.id)?.status || 'PENDING' })) })
  } catch (error) {
    console.error('Could not load custom form submissions:', error)
    return NextResponse.json({ success: false, error: 'Could not load responses.' }, { status: 500 })
  }
}
