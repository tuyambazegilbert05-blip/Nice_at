import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions/rbac'
import { renderBrandedEmail } from '../../../../lib/email/brevo'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !hasPermission(user.role, 'communications:send')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  const formData = await request.formData()
  const subject = String(formData.get('subject') || 'Your NiCE Club Rwanda update').slice(0, 180)
  const paragraphs = String(formData.get('message') || 'Your message will appear here.').slice(0, 6000).split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  const images = formData.getAll('images').filter((item): item is File => item instanceof File && item.size > 0).slice(0, 5)
  let totalBytes = 0
  const bodyImages = []
  for (const file of images) {
    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) continue
    totalBytes += file.size
    if (totalBytes > 10 * 1024 * 1024) break
    bodyImages.push({ url: `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`, alt: file.name.slice(0, 120) })
  }
  return NextResponse.json({ success: true, html: renderBrandedEmail({ heading: subject, paragraphs, bodyImages }) })
}
