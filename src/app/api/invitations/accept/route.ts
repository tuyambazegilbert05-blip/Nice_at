import { createHash, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '../../../../lib/database/client'
import { hashPassword } from '../../../../lib/auth/passwords'
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../../../../lib/auth/password-policy'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim()
  if (!token) return NextResponse.json({ success: false, error: 'Invitation token is missing.' }, { status: 400 })

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const result = await query<{ email: string; role: string; name: string | null }>(
    `SELECT email,role,name FROM user_invitations
     WHERE token_hash=$1 AND accepted_at IS NULL AND expires_at > now()`, [tokenHash],
  )
  const invitation = result.rows[0]
  if (!invitation) {
    return NextResponse.json({ success: false, error: 'This invitation is invalid, expired, or already used.' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: invitation })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { token?: string; name?: string; password?: string }
    const token = body.token?.trim()
    const name = body.name?.trim()
    const password = body.password || ''
    if (!token || !name || name.length > 120 || !isStrongPassword(password)) {
      return NextResponse.json({ success: false, error: `Enter your name and ${PASSWORD_POLICY_MESSAGE}` }, { status: 400 })
    }
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const outcome = await withTransaction(async (client) => {
      const invitation = await client.query<{ id: string; email: string; role: string; name: string | null }>(
        `SELECT id,email,role,name FROM user_invitations
         WHERE token_hash=$1 AND accepted_at IS NULL AND expires_at > now() FOR UPDATE`, [tokenHash],
      )
      const invite = invitation.rows[0]
      if (!invite) return false
      await client.query(
        `INSERT INTO users(id,name,email,password_hash,role,is_active)
         VALUES($1,$2,$3,$4,$5,true)`,
        [`user_${randomUUID()}`, name || invite.name || invite.email.split('@')[0], invite.email, hashPassword(password), invite.role],
      )
      await client.query('UPDATE user_invitations SET accepted_at=now() WHERE id=$1', [invite.id])
      return true
    })
    if (!outcome) return NextResponse.json({ success: false, error: 'This invitation is invalid, expired, or already used.' }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as { code?: string })?.code === '23505') return NextResponse.json({ success: false, error: 'An account already exists for this invitation email.' }, { status: 409 })
    console.error('Could not accept staff invitation:', error)
    return NextResponse.json({ success: false, error: 'Could not activate this account.' }, { status: 500 })
  }
}
