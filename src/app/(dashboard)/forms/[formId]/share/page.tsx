import { notFound, redirect } from 'next/navigation'
import { CustomFormShareTools } from '../../../../../components/forms/CustomFormShareTools'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { getCustomFormById } from '../../../../../lib/forms/form-service'

export default async function CustomFormSharePage({ params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'attendance:view')) redirect('/forms')

  const { formId } = await params
  const form = await getCustomFormById(formId)
  if (!form) notFound()

  return <CustomFormShareTools form={form} canExport={hasPermission(user.role, 'attendance:export')} canClose={hasPermission(user.role, 'session:edit')} />
}
