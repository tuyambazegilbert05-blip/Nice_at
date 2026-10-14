import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions/rbac'
import FormEmailTemplateEditor from './TemplateEditor'

export default async function FormEmailTemplatePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'settings:manage')) redirect('/forms')
  return <FormEmailTemplateEditor />
}
