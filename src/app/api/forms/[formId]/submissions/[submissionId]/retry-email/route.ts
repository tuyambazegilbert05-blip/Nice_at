import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../../../../lib/auth'
import { hasPermission } from '../../../../../../../lib/permissions/rbac'
import { getCustomFormById, getCustomFormSubmission, getLatestCustomFormEmailStatus } from '../../../../../../../lib/forms/form-service'
import { sendFormConfirmation } from '../../../../../../../lib/forms/email-service'

export async function POST(_: Request, { params }: { params: Promise<{ formId: string; submissionId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'communications:send')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const { formId, submissionId } = await params
    const [form, submission, status] = await Promise.all([
      getCustomFormById(formId), getCustomFormSubmission(formId, submissionId), getLatestCustomFormEmailStatus(submissionId),
    ])
    if (!form || !submission) return NextResponse.json({ success: false, error: 'Response not found.' }, { status: 404 })
    if (status === 'ACCEPTED') return NextResponse.json({ success: false, error: 'The email provider already accepted this confirmation.' }, { status: 409 })
    const emailStatus = await sendFormConfirmation(form, submission)
    return NextResponse.json({ success: true, emailStatus })
  } catch (error) {
    console.error('Could not retry form confirmation:', error)
    return NextResponse.json({ success: false, error: 'Could not retry this confirmation.' }, { status: 500 })
  }
}
