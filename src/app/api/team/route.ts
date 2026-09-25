import { NextResponse } from 'next/server'
import { getCurrentUser, getAllUsers } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    if (!hasPermission(user.role, 'users:manage')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ success: true, data: await getAllUsers() })
  } catch (error) {
    console.error('Error loading staff directory:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
