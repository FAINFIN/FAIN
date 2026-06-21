import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'

/**
 * Route protection middleware.
 *
 * Rules:
 * 1. Public routes (/, /login, /register, /forgot-password/**, /api/**, etc.) — always allowed
 * 2. /onboarding — only for authenticated users; redirects unauthenticated → /login
 * 3. App routes (/ask, /dashboard, /accounts, /transactions, /cash-flow, /settings) —
 *    require authentication; if onboarding not completed → /onboarding
 * 4. Auth routes (/login, /register) — redirect already-authenticated users →
 *    - to /ask if onboarding complete
 *    - to /onboarding if not
 */

// Routes that always require a session
const APP_ROUTES = [
  '/ask',
  '/dashboard',
  '/accounts',
  '/transactions',
  '/cash-flow',
  '/cashflow',
  '/settings',
]

// Auth routes where authenticated users should be sent elsewhere
const AUTH_ROUTES = ['/', '/login', '/register']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Short-circuit for API, static assets, auth callbacks ─────────────────
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // ── Check session ─────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null)
  const isAuthed = !!session?.user

  const isAppRoute  = APP_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuthRoute = AUTH_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isOnboarding = pathname === '/onboarding'

  // ── Unauthenticated → redirect to /login ─────────────────────────────────
  if (!isAuthed && (isAppRoute || isOnboarding)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // ── Authenticated on auth routes → redirect away ──────────────────────────
  if (isAuthed && isAuthRoute) {
    // Check if onboarding is complete
    const onboardingDone = await isOnboardingComplete(request, session.user.id)
    const url = request.nextUrl.clone()
    url.pathname = onboardingDone ? '/ask' : '/onboarding'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // ── Authenticated on app routes → check onboarding ───────────────────────
  if (isAuthed && isAppRoute) {
    const onboardingDone = await isOnboardingComplete(request, session.user.id)
    if (!onboardingDone) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

/**
 * Check if onboarding is complete for a user by calling our own API.
 * We call GET /api/onboarding and check for onboardingCompletedAt.
 */
async function isOnboardingComplete(request: NextRequest, _userId: string): Promise<boolean> {
  try {
    const url = new URL('/api/onboarding', request.nextUrl.origin)
    const res = await fetch(url.toString(), {
      headers: request.headers, // Forward cookies for auth
      method: 'GET',
    })
    if (!res.ok) return false
    const data = await res.json()
    return !!data?.profile?.onboarding_completed_at || !!data?.profile?.onboardingCompletedAt
  } catch {
    // If the check fails (cold boot, DB error), allow through rather than loop
    return true
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
