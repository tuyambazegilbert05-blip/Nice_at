import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../lib/auth/session'
import { hashPassword, verifyPassword } from '../../../lib/auth/passwords'
import { query } from '../../../lib/database/client'

const profileUrl = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const body = await request.json() as { name?: unknown; email?: unknown; avatarUrl?: unknown }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const avatarUrl = profileUrl(body.avatarUrl)
  if (name.length < 2 || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Enter a valid name and email address.' }, { status: 400 })
  if (avatarUrl && (!avatarUrl.startsWith('https://') || avatarUrl.length > 500)) return NextResponse.json({ error: 'Profile image URL must be a secure HTTPS link.' }, { status: 400 })
  try {
    const result = await query<{ id: string; name: string; email: string; role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER'; avatarUrl: string | null }>('UPDATE users SET name=$1, email=$2, avatar_url=$3, updated_at=now() WHERE id=$4 RETURNING id,name,email,role,avatar_url AS "avatarUrl"', [name, email, avatarUrl, user.id])
    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') return NextResponse.json({ error: 'That email address is already in use.' }, { status: 409 })
    return NextResponse.json({ error: 'Unable to update your profile.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const body = await request.json() as { currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown }
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
  if (newPassword.length < 8 || newPassword !== body.confirmPassword) return NextResponse.json({ error: 'New passwords must match and be at least 8 characters.' }, { status: 400 })
  const result = await query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id=$1', [user.id])
  if (!result.rows[0] || !verifyPassword(currentPassword, result.rows[0].password_hash)) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
  await query('UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2', [hashPassword(newPassword), user.id])
  return NextResponse.json({ success: true })
}
