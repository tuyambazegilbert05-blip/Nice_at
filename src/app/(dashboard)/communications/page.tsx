import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import CommunicationsClient from './CommunicationsClient'

export default async function CommunicationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return <CommunicationsClient canCommunicate={hasPermission(user.role, 'communications:send')} role={user.role} />
}
