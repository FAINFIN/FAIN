/**
 * Minimal type stubs for better-auth subpath imports.
 *
 * better-auth ships .d.mts declaration files via the "exports" field.
 * TypeScript with moduleResolution:"bundler" should resolve them, but in
 * practice TS 5.x sometimes resolves to the .mjs runtime file instead,
 * producing TS7016 "implicitly has any type" errors.  These hand-written
 * stubs satisfy the type-checker without changing runtime behaviour.
 *
 * When better-auth fixes its exports map (or TS resolves this), delete this
 * file — the real declarations are richer.
 */

// ── Server-side auth instance ─────────────────────────────────────────────

interface BetterAuthSession {
  user: {
    id:    string
    email: string
    name?: string | null
    image?: string | null
  }
}

interface BetterAuthApi {
  getSession(opts: { headers: Headers | HeadersInit }): Promise<BetterAuthSession | null>
}

interface BetterAuthInstance {
  handler: (req: Request) => Promise<Response>
  api: BetterAuthApi
}

declare module 'better-auth' {
  export function betterAuth(config: Record<string, unknown>): BetterAuthInstance
}

declare module 'better-auth/next-js' {
  export function toNextJsHandler(
    auth: BetterAuthInstance
  ): {
    GET:  (req: import('next/server').NextRequest) => Promise<import('next/server').NextResponse>
    POST: (req: import('next/server').NextRequest) => Promise<import('next/server').NextResponse>
  }
}

// ── Plugin declarations ───────────────────────────────────────────────────

declare module 'better-auth/plugins' {
  interface MagicLinkSendParams {
    email: string
    url:   string
    token?: string
  }
  export function magicLink(config: {
    sendMagicLink: (params: MagicLinkSendParams) => Promise<void>
    expiresIn?: number
  }): Record<string, unknown>

  export function google(config: {
    clientId:     string
    clientSecret: string
  }): Record<string, unknown>
}

// ── Client (browser) ─────────────────────────────────────────────────────

interface AuthClientSignIn {
  magicLink(opts: { email: string; callbackURL?: string }): Promise<{ error?: { message?: string } | null }>
  social(opts: { provider: string; callbackURL?: string }): Promise<void>
}

interface AuthClient {
  signIn:  AuthClientSignIn
  signOut(): Promise<void>
  getSession(): Promise<BetterAuthSession | null>
  useSession(): { data: BetterAuthSession | null; isPending: boolean }
}

declare module 'better-auth/react' {
  export function createAuthClient(config?: Record<string, unknown>): AuthClient
}

declare module 'better-auth/client/plugins' {
  export function magicLinkClient(): Record<string, unknown>
  export function googleClient(): Record<string, unknown>
}
