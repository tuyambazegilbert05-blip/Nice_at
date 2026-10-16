import { NextResponse } from 'next/server'
import {
  authenticate,
  getCurrentUser,
  setSessionCookie,
  clearSessionCookie,
} from '../../../lib/auth'
import { createSessionToken } from '../../../lib/auth/jwt'
import { recordActivity } from '../../../lib/activity/activity-service'
import { query } from '../../../lib/database/client'
import type { UserRole } from '../../../types/user'

const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  try {
    const user = await getCurrentUser()
    return NextResponse.json({
      success: true,
      user,
      isAuthenticated: !!user,
    }, { headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error('Error fetching current session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: PRIVATE_HEADERS }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400, headers: PRIVATE_HEADERS }
      )
    }

    const user = await authenticate(email, password)

    if (!user) {
      const account = await query<{ id: string; name: string; role: UserRole }>('SELECT id,name,role FROM users WHERE lower(email)=lower($1) AND is_active=true LIMIT 1', [String(email).trim()])
      if (account.rows[0]) await recordActivity({ actor: account.rows[0], action: 'account.sign_in_failed', targetType: 'staff_account', targetId: account.rows[0].id, targetLabel: account.rows[0].name, summary: 'Unsuccessful sign-in attempt', details: { reason: 'credentials_rejected' } }, { required: true })
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401, headers: PRIVATE_HEADERS }
      )
    }

    await recordActivity({ actor: user, action: 'account.signed_in', targetType: 'staff_account', targetId: user.id, targetLabel: user.name, summary: 'Signed in to the staff platform' }, { required: true })
    const token = createSessionToken(user)
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      user,
    }, { headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error('Error during authentication:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500, headers: PRIVATE_HEADERS }
    )
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (user) await recordActivity({ actor: user, action: 'account.signed_out', targetType: 'staff_account', targetId: user.id, targetLabel: user.name, summary: 'Signed out of the staff platform' }, { required: true })
    await clearSessionCookie()
    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    }, { headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error('Error during sign out:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sign out' },
      { status: 500, headers: PRIVATE_HEADERS }
    )
  }
}
