import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth-aware routing middleware.
 *
 * Authenticated users visiting the landing page or auth pages are sent
 * straight to /ask so they never see the marketing site after login.
 *
 * We do a lightweight cookie-presence check here (no DB round-trip).
 * The app layout at (app)/layout.tsx performs the authoritative session
 * verification for protected routes.
 */

// Public routes that should redirect to /ask when the user is already signed in
const AUTH_ROUTES = new Set(['/', '/login', '/register'])

// better-auth session cookie names (covers both dev http and prod https)
function hasSessionCookie(req: NextRequest): boolean {
  return (
    !!req.cookies.get('better-auth.session_token')?.value ||
    !!req.cookies.get('__Secure-better-auth.session_token')?.value
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (AUTH_ROUTES.has(pathname) && hasSessionCookie(request)) {
    return NextResponse.redirect(new URL('/ask', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/register'],
}
