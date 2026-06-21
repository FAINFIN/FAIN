/**
 * Better Auth configuration
 *
 * Auth methods (priority order):
 *  1. Google OAuth / Microsoft OAuth  — 1-click, highest conversion
 *  2. Email + Password + OTP verify   — standard SaaS path
 *  3. Magic link                      — fallback / internal tooling
 *
 * Security plugins: twoFactor (TOTP), phoneNumber (SMS/Twilio)
 */
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink } from 'better-auth/plugins/magic-link'
import { twoFactor } from 'better-auth/plugins/two-factor'
import { phoneNumber } from 'better-auth/plugins/phone-number'
import { db } from '@/lib/db/client.server'
import * as schema from '@/lib/db/schema.server'

// ── Shared Resend sender ──────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Fain <hello@fain.ge>',
    to,
    subject,
    html,
  })
}

function emailShell(body: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#29261b">
      <div style="font-size:26px;font-weight:700;letter-spacing:-0.03em;margin-bottom:28px">
        fain<span style="color:#FD5400">.</span>
      </div>
      ${body}
      <p style="margin-top:28px;color:#8a8377;font-size:13px">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `
}

// ── Email: OTP verification code (registration) ───────────────────────────
async function sendVerificationEmail(email: string, url: string) {
  // Better Auth sends a verification link by default; we redirect to OTP entry page
  // The URL contains the token — we strip it and send just the link.
  await sendEmail(
    email,
    'Verify your Fain account',
    emailShell(`
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700">Verify your email</h2>
      <p style="color:#6b6457;line-height:1.6;margin:0 0 28px">
        Click below to verify your email address and activate your Fain account.
        This link expires in 1 hour.
      </p>
      <a href="${url}" style="display:inline-block;padding:14px 28px;background:#FD5400;color:#fff;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px">
        Verify email
      </a>
    `)
  )
}

// ── Email: password reset ─────────────────────────────────────────────────
async function sendPasswordResetEmail(email: string, url: string) {
  await sendEmail(
    email,
    'Reset your Fain password',
    emailShell(`
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700">Reset your password</h2>
      <p style="color:#6b6457;line-height:1.6;margin:0 0 28px">
        We received a request to reset the password for your Fain account.
        This link expires in 1 hour and can only be used once.
      </p>
      <a href="${url}" style="display:inline-block;padding:14px 28px;background:#FD5400;color:#fff;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px">
        Reset password
      </a>
    `)
  )
}

// ── Email: magic link (fallback) ──────────────────────────────────────────
async function sendMagicLinkEmail(email: string, url: string) {
  await sendEmail(
    email,
    'Sign in to Fain',
    emailShell(`
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700">Your sign-in link</h2>
      <p style="color:#6b6457;line-height:1.6;margin:0 0 28px">
        Click below to sign in to Fain. This link expires in 15 minutes and can only be used once.
      </p>
      <a href="${url}" style="display:inline-block;padding:14px 28px;background:#FD5400;color:#fff;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px">
        Sign in to Fain
      </a>
    `)
  )
}

// ── SMS via Twilio ────────────────────────────────────────────────────────
async function sendSmsOtp(phone: string, otp: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const from       = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !from) {
    // Dev fallback — log OTP instead of throwing
    console.log(`[DEV] SMS OTP for ${phone}: ${otp}`)
    return
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: from,
        To:   phone,
        Body: `Your Fain verification code: ${otp}. Expires in 10 minutes.`,
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twilio error: ${err}`)
  }
}

// ── Drizzle adapter schema map ────────────────────────────────────────────
// Maps Better Auth's expected table names to our Drizzle schema objects
const schemaMap = {
  user:         schema.user,
  session:      schema.session,
  account:      schema.account,
  verification: schema.verification,
  twoFactor:    schema.twoFactor,
}

// ── Auth instance ─────────────────────────────────────────────────────────
export const auth = betterAuth({
  secret:  process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,

  // Drizzle adapter — enables sessions, accounts, and plugin tables in Postgres
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema:   schemaMap,
  }),

  session: {
    cookieCache: { enabled: true, maxAge: 30 * 24 * 60 * 60 }, // 30 days
  },

  account: {
    accountLinking: {
      enabled: true,
      // Trust Google and Microsoft to link to existing email accounts.
      // This lets users who registered with email/password sign in via OAuth
      // without being blocked by the "account_not_linked" error.
      trustedProviders: ['google', 'microsoft'],
      // Don't require the existing local account to have a verified email.
      // Without this, better-auth blocks linking even for trusted providers
      // when the email/password account was created without email verification.
      requireLocalEmailVerified: false,
    },
  },

  // Email + password — primary email path (OTP email verification on signup)
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }: { user: { email: string }, url: string }) =>
      sendPasswordResetEmail(user.email, url),
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { email: string }, url: string }) =>
      sendVerificationEmail(user.email, url),
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60, // 1 hour
  },

  socialProviders: {
    // Step 1: Google — fastest, most recognised, best UX
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },

    // Step 2: Microsoft Entra ID — covers Exchange / M365 organisations
    // Register at https://portal.azure.com → App Registrations
    // Redirect URI: {APP_URL}/api/auth/callback/microsoft
    microsoft: {
      clientId:     process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      // 'common' accepts any Azure AD tenant + personal accounts;
      // set to a specific tenant ID to restrict to one org
      tenantId:     process.env.MICROSOFT_TENANT_ID ?? 'common',
    },

    // Apple Sign In — skipped for now; add APPLE_CLIENT_ID + APPLE_CLIENT_SECRET to enable
    // apple: { clientId: process.env.APPLE_CLIENT_ID!, clientSecret: process.env.APPLE_CLIENT_SECRET! },
  },

  plugins: [
    // Magic link (email OTP — no password needed)
    magicLink({
      sendMagicLink: async ({ email, url }: { email: string; url: string }) =>
        sendMagicLinkEmail(email, url),
      expiresIn: 15 * 60, // 15 minutes
    }),

    // TOTP two-factor (Google Authenticator / Authy)
    twoFactor({
      issuer: 'Fain',
    }),

    // SMS phone verification (Twilio)
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, code }: { phoneNumber: string; code: string }) =>
        sendSmsOtp(phone, code),
      expiresIn:  10 * 60,  // 10 minutes
      otpLength:  6,
    }),
  ],
})
