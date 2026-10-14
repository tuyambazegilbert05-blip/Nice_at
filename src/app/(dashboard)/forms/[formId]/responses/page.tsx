import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { getCustomFormById, getCustomFormDeliveryHistory, getCustomFormSubmissions } from '../../../../../lib/forms/form-service'
import { CustomFormResponses } from '../../../../../components/forms/CustomFormResponses'

export default async function CustomFormResponsesPage({ params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/forms')
  const { formId } = await params
  const form = await getCustomFormById(formId)
  if (!form) notFound()
  const submissions = await getCustomFormSubmissions(formId)
  const deliveryHistory = await getCustomFormDeliveryHistory(submissions.map((submission) => submission.id))
  const records = submissions.map((submission) => {
    const status = deliveryHistory.get(submission.id)?.status
    return { ...submission, emailStatus: status === 'ACCEPTED' ? 'ACCEPTED' as const : status === 'FAILED' ? 'FAILED' as const : 'PENDING' as const }
  })
  return <CustomFormResponses
    form={form}
    submissions={records}
    canRetryEmail={hasPermission(user.role, 'communications:send')}
    canExport={hasPermission(user.role, 'attendance:export')}
  />
}
