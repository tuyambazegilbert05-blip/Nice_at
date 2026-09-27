import { NextResponse } from 'next/server'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { query, withTransaction } from '../../../../lib/database/client'
import { hashPassword } from '../../../../lib/auth/passwords'
import { deliverBrandedEmail } from '../../../../lib/email/brevo'

type UserRow = { id: string; email: string; name: string | null }
const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
const digest = (token: string) => createHash('sha256').update(token).digest('hex')

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { action?: string; email?: string; token?: string; password?: string }
  if (body.action === 'request') {
    const email = body.email?.trim().toLowerCase()
    if (!email) return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 })
    const result = await query<UserRow>('SELECT id,email,name FROM users WHERE lower(email)=lower($1) AND is_active=true LIMIT 1', [email])
    const user = result.rows[0]
    if (user) {
      const rawToken = randomBytes(32).toString('hex')
      await query('UPDATE password_reset_tokens SET used_at=now() WHERE user_id=$1 AND used_at IS NULL', [user.id])
      await query('INSERT INTO password_reset_tokens(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval \'10 minutes\')', [`reset_${randomUUID()}`, user.id, digest(rawToken)])
      const url = `${appUrl()}/reset-password?token=${rawToken}`
      await deliverBrandedEmail({
        to: user.email, name: user.name || undefined, subject: 'Reset your NiCE Club Rwanda password', heading: 'Password reset request',
        paragraphs: [`Hello ${user.name || 'there'},`, 'We received a request to reset your NiCE Club Rwanda staff account password. This secure link expires in 10 minutes and can only be used once.', 'If you did not request this, you can safely ignore this email.'],
        action: { label: 'Reset my password', url }, category: 'COMMUNICATION',
      })
    }
    return NextResponse.json({ success: true, message: 'If an active account matches that email, a reset link has been sent.' })
  }
  if (body.action === 'reset') {
    const token = body.token?.trim(); const password = body.password || ''
    if (!token || password.length < 8) return NextResponse.json({ success: false, error: 'Use a valid reset link and a password of at least 8 characters.' }, { status: 400 })
    const result = await query<{ id: string; user_id: string }>('SELECT id,user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() LIMIT 1', [digest(token)])
    const reset = result.rows[0]
    if (!reset) return NextResponse.json({ success: false, error: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 })
    await withTransaction(async (client) => {
      await client.query('UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2', [hashPassword(password), reset.user_id])
      await client.query('UPDATE password_reset_tokens SET used_at=now() WHERE id=$1', [reset.id])
      await client.query('UPDATE password_reset_tokens SET used_at=now() WHERE user_id=$1 AND used_at IS NULL', [reset.user_id])
    })
    return NextResponse.json({ success: true, message: 'Your password has been updated. You can now sign in.' })
  }
  return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 })
}
