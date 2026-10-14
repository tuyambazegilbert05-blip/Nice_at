import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { getCustomFormById } from '../../../../../lib/forms/form-service'
import CustomFormEditor from './CustomFormEditor'

export default async function EditCustomFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const { formId } = await params
  if (!hasPermission(user.role, 'session:edit')) redirect('/forms')
  const form = await getCustomFormById(formId)
  if (!form) redirect('/forms')
  return <CustomFormEditor initialForm={form} canManageTemplate={hasPermission(user.role, 'settings:manage')} />
}
