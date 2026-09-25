import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions/rbac'
import { renderBrandedEmail } from '../../../../lib/email/brevo'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !hasPermission(user.role, 'communications:send')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  const body = await request.json() as { subject?: string; message?: string }
  const subject = (body.subject || 'Your NiCE Club Rwanda update').slice(0, 180)
  const paragraphs = (body.message || 'Your message will appear here.').slice(0, 6000).split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  return NextResponse.json({ success: true, html: renderBrandedEmail({ heading: subject, paragraphs }) })
}
