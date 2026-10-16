import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { getCustomFormById, getCustomFormSubmissions } from '../../../../../lib/forms/form-service'
import { CustomFormAnalytics } from '../../../../../components/forms/CustomFormAnalytics'

export default async function CustomFormAnalyticsPage({ params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/forms')

  const { formId } = await params
  const form = await getCustomFormById(formId)
  if (!form) notFound()
  const submissions = await getCustomFormSubmissions(formId)

  return <CustomFormAnalytics form={form} submissions={submissions} />
}
