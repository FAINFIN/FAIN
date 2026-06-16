import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins'

// ── Upstash KV adapter ────────────────────────────────────────────────────
// better-auth needs a minimal database for storing magic-link tokens (15-min TTL).
// We use Upstash Redis directly — zero SQL, no user table, no persistent PII.
function upstashKV() {
  const url   = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!

  async function cmd<T>(...args: (string | number)[]): Promise<T> {
    const res = await fetch(`${url}/${args.map(encodeURIComponent).join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json() as { result: T }
    return json.result
  }

  return {
    // better-auth KV interface: get / set / delete
    async get(key: string) {
      return cmd<string | null>('GET', key)
    },
    async set(key: string, value: string, ttlSeconds?: number) {
      if (ttlSeconds) {
        await cmd('SET', key, value, 'EX', ttlSeconds)
      } else {
        await cmd('SET', key, value)
      }
    },
    async delete(key: string) {
      await cmd('DEL', key)
    },
  }
}

// ── Resend magic-link email ───────────────────────────────────────────────
async function sendMagicLinkEmail(email: string, url: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL ?? 'hello@fain.ge',
    to:      email,
    subject: 'Sign in to Fain',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#29261b">
        <div style="font-size:26px;font-weight:700;letter-spacing:-0.03em;margin-bottom:28px">
          fain<span style="color:#FD5400">.</span>
        </div>
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:700">Your sign-in link</h2>
        <p style="color:#6b6457;line-height:1.6;margin:0 0 28px">
          Click below to sign in to Fain. This link expires in 15 minutes and can only be used once.
        </p>
        <a href="${url}" style="display:inline-block;padding:14px 28px;background:#FD5400;color:#fff;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px">
          Sign in to Fain
        </a>
        <p style="margin-top:28px;color:#8a8377;font-size:13px">
          If you didn't request this, you can safely ignore it.
        </p>
      </div>
    `,
  })
}

// ── Auth instance ─────────────────────────────────────────────────────────
export const auth = betterAuth({
  // No database adapter — sessions live in HTTP-only signed cookies only.
  // Magic link tokens live in Upstash Redis (15-min TTL).
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,

  session: {
    cookieCache: { enabled: true, maxAge: 30 * 24 * 60 * 60 }, // 30 days
  },

  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => sendMagicLinkEmail(email, url),
      expiresIn: 15 * 60, // 15 minutes
    }),
  ],

  // Upstash KV for token storage (if env vars present; falls back to in-memory for local dev)
  ...(process.env.UPSTASH_REDIS_REST_URL
    ? { database: upstashKV() as any }
    : {}),
})
