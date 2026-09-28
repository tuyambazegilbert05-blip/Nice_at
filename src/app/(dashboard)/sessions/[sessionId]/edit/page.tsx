import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { getSessionById } from '../../../../../lib/sessions/session-service'
import EditSessionForm from './EditSessionForm'

export default async function EditSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { sessionId } = await params
  if (!hasPermission(user.role, 'session:edit')) redirect(`/sessions/${encodeURIComponent(sessionId)}`)

  const session = await getSessionById(sessionId)
  if (!session) notFound()

  return <EditSessionForm session={session} />
}
