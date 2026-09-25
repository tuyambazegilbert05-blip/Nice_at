import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { query } from '../../../lib/database/client'
import { deliverBrandedEmail } from '../../../lib/email/brevo'
import { UserRole } from '../../../types/user'

const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    if (!hasPermission(user.role, 'users:manage')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json() as { email?: string; name?: string; role?: UserRole }
    const email = body.email?.trim().toLowerCase()
    const name = body.name?.trim() || ''
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !body.role || !ROLES.includes(body.role)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address and role.' }, { status: 400 })
    }
    if (await query('SELECT 1 FROM users WHERE email=$1', [email]).then((result) => result.rowCount)) {
      return NextResponse.json({ success: false, error: 'An account already exists for this email.' }, { status: 409 })
    }

    const token = randomBytes(32).toString('base64url')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const id = `inv_${randomUUID()}`
    await query('DELETE FROM user_invitations WHERE email=$1 AND accepted_at IS NULL', [email])
    await query(
      `INSERT INTO user_invitations(id,email,name,role,token_hash,invited_by_id,expires_at)
       VALUES($1,$2,$3,$4,$5,$6,now()+interval '7 days')`,
      [id, email, name || null, body.role, tokenHash, user.id],
    )

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/invite/${token}`
    const result = await deliverBrandedEmail({
      to: email, name, subject: 'You are invited to join NiCE Club Rwanda', heading: 'Join the NiCE Club team',
      paragraphs: [`${name || 'Hello'}, you have been invited to join the NiCE Club Rwanda attendance platform as ${body.role}.`, 'Use the secure invitation link below within seven days to set your password and activate your account.'],
      action: { label: 'Accept invitation', url: inviteUrl }, category: 'INVITATION', sentById: user.id,
    })
    if (!result.sent) return NextResponse.json({ success: false, error: 'The invitation was saved, but Brevo could not send the email. Check Brevo settings and invite again.' }, { status: 502 })
    return NextResponse.json({ success: true, message: 'Invitation email accepted by Brevo.' }, { status: 201 })
  } catch (error) {
    console.error('Could not create staff invitation:', error)
    return NextResponse.json({ success: false, error: 'Could not create the invitation.' }, { status: 500 })
  }
}
