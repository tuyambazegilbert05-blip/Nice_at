import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions/rbac'
import NewCustomFormClient from './NewCustomFormClient'

export default async function NewCustomFormPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user.role, 'session:create')) redirect('/forms')
  return <NewCustomFormClient />
}
