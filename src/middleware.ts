import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from './lib/auth/constants'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/sessions',
  '/attendance',
  '/participants',
  '/analytics',
  '/resources',
  '/settings',
  '/account',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
  const hasToken = !!sessionCookie?.value

  // 1. Check if user is accessing a protected route
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isProtected) {
    if (!hasToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /* Match protected routes */
    '/dashboard/:path*',
    '/sessions/:path*',
    '/attendance/:path*',
    '/participants/:path*',
    '/analytics/:path*',
    '/resources/:path*',
    '/settings/:path*',
    '/account/:path*',
  ],
}
