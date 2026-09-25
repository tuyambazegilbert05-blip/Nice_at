import { NextResponse } from 'next/server'
import {
  authenticate,
  getCurrentUser,
  setSessionCookie,
  clearSessionCookie,
} from '../../../lib/auth'
import { createSessionToken } from '../../../lib/auth/jwt'

export async function GET() {
  try {
    const user = await getCurrentUser()
    return NextResponse.json({
      success: true,
      user,
      isAuthenticated: !!user,
    })
  } catch (error) {
    console.error('Error fetching current session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
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
        { status: 400 }
      )
    }

    const user = await authenticate(email, password)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = createSessionToken(user)
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Error during authentication:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie()
    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    })
  } catch (error) {
    console.error('Error during sign out:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sign out' },
      { status: 500 }
    )
  }
}
