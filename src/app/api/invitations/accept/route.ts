import { createHash, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { withTransaction } from '../../../../lib/database/client'
import { hashPassword } from '../../../../lib/auth/passwords'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { token?: string; name?: string; password?: string }
    const token = body.token?.trim()
    const name = body.name?.trim()
    const password = body.password || ''
    if (!token || !name || name.length > 120 || password.length < 14 || password.length > 200) {
      return NextResponse.json({ success: false, error: 'Enter your name and a password of at least 14 characters.' }, { status: 400 })
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
