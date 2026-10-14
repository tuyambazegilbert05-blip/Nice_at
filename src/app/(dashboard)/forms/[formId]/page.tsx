import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions/rbac'
import { getCustomFormById, getCustomFormDeliveryHistory, getCustomFormSubmissions } from '../../../../lib/forms/form-service'
import { isResponseOverrideActive } from '../../../../lib/forms/response-window'
import type { FormEmailStatus } from '../../../../lib/forms/form-analytics'
import { CustomFormOverview } from '../../../../components/forms/CustomFormOverview'

export default async function CustomFormOverviewPage({ params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/forms')

  const { formId } = await params
  const form = await getCustomFormById(formId)
  if (!form) notFound()

  const submissions = await getCustomFormSubmissions(formId)
  const deliveryHistory = await getCustomFormDeliveryHistory(submissions.map((submission) => submission.id))
  const attendees = submissions.map((submission) => {
    const status = deliveryHistory.get(submission.id)?.status
    const emailStatus: FormEmailStatus = status === 'ACCEPTED' ? 'ACCEPTED' : status === 'FAILED' ? 'FAILED' : 'PENDING'
    return { ...submission, emailStatus }
  })

  return <CustomFormOverview
    form={form}
    submissions={attendees}
    canEdit={hasPermission(user.role, 'session:edit')}
    canExport={hasPermission(user.role, 'attendance:export')}
    canGenerateQr={hasPermission(user.role, 'qr:generate')}
    canOverride={hasPermission(user.role, 'session:override')}
    canArchive={hasPermission(user.role, 'session:delete')}
    responseOverrideActive={isResponseOverrideActive(form)}
  />
}
