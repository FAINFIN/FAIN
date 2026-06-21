'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLocale } from '@/lib/i18n/LocaleContext'

// ─── Security: safe post-login redirect (prevents open redirect) ──────────────

function safeRedirectTo(from?: string | null): string {
  if (!from) return '/ask'
  try {
    const path = decodeURIComponent(from)
    // Only allow relative, internal paths — never allow // or protocol-relative
    if (path.startsWith('/') && !path.startsWith('//') && !path.includes('..')) {
      return path
    }
  } catch {
    // ignore decode errors
  }
  return '/ask'
}

// ─── OAuth error code → human-readable message ────────────────────────────────
// These codes come from better-auth as ?error= query param after a failed OAuth flow.

const OAUTH_ERROR_MAP: Record<string, string> = {
  access_denied:
    'Sign-in was cancelled.',
  invalid_code:
    'Authentication failed — please try again.',
  account_not_linked:
    'This email is already registered with a different sign-in method. Use email and password below.',
  oauth_error:
    'OAuth sign-in failed. Please try again.',
  email_not_verified:
    'Your email is not yet verified. Check your inbox or use email and password to sign in.',
}

function mapOAuthError(code?: string): string | null {
  if (!code) return null
  return OAUTH_ERROR_MAP[code.toLowerCase()] ?? 'Sign-in failed. Please try again.'
}

// ─── Auth error normalization ─────────────────────────────────────────────────
// Prevents user enumeration: wrong password vs. email not found → same message.
// Special cases: unverified email (show resend UI) and rate limiting.

type SignInErrorKind = 'credentials' | 'unverified' | 'ratelimit' | 'generic'

interface MappedError {
  kind: SignInErrorKind
  text: string
}

function mapSignInError(err: { code?: string; message?: string } | null | undefined): MappedError {
  if (!err) return { kind: 'generic', text: 'Something went wrong. Please try again.' }

  const code = (err.code ?? '').toUpperCase()
  const msg  = (err.message ?? '').toLowerCase()

  // Email not verified → show resend UI
  if (
    code === 'EMAIL_NOT_VERIFIED'   ||
    msg.includes('not verified')    ||
    msg.includes('verify your email')
  ) {
    return { kind: 'unverified', text: 'Your email is not yet verified.' }
  }

  // Rate limiting
  if (code === 'TOO_MANY_REQUESTS' || msg.includes('too many')) {
    return {
      kind: 'ratelimit',
      text: 'Too many attempts. Please wait a few minutes and try again.',
    }
  }

  // Generic for INVALID_PASSWORD, USER_NOT_FOUND, etc. — same message on purpose
  // to prevent user enumeration (TC-SEC-07, TC-LOG-EP03/04).
  return { kind: 'credentials', text: 'Incorrect email or password.' }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
      <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-low)', flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tan-9)' }}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
}

// ─── Unverified email step ────────────────────────────────────────────────────
// Shown when better-auth returns EMAIL_NOT_VERIFIED on sign-in attempt.
// Lets the user resend the verification link without leaving the page.

function StepUnverified({
  email,
  onBack,
  loading,
  setLoading,
}: {
  email: string
  onBack: () => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const { t }  = useLocale()
  const a      = t.auth
  const [resent,      setResent]      = useState(false)
  const [resendError, setResendError] = useState('')

  async function handleResend() {
    setLoading(true)
    setResendError('')
    try {
      await authClient.sendVerificationEmail({ email, callbackURL: '/ask' })
      setResent(true)
      // Allow resend again after 30 s
      setTimeout(() => setResent(false), 30_000)
    } catch {
      setResendError('Could not send email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form" style={{ marginTop: 26 }}>
      <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <MailIcon />
        </div>
        <p className="lead" style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>
          Verify your email first
        </p>
        <p className="hint" style={{ margin: '0 0 4px' }}>
          We sent a verification link to
        </p>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-high)', fontFamily: 'var(--font-num)' }}>
          {email}
        </p>
        <p className="hint" style={{ marginTop: 8, fontSize: 12 }}>
          Expires in 1 hour · check your spam folder
        </p>
      </div>

      {resendError && (
        <p role="alert" style={{ color: 'var(--neg)', fontSize: 13, margin: '0 0 10px', textAlign: 'center' }}>
          {resendError}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          variant="outline"
          size="lg"
          onClick={handleResend}
          loading={loading}
          disabled={resent || loading}
          style={{ width: '100%' }}
          type="button"
        >
          {resent ? 'Sent — check your inbox' : 'Resend verification email'}
        </Button>

        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontSize: 13, padding: '4px 0' }}
        >
          {a.useDifferentEmail ?? 'Use a different email'}
        </button>
      </div>
    </div>
  )
}

// ─── Welcome back (remembered user) ──────────────────────────────────────────

function StepWelcomeBack({
  email,
  redirectTo,
  onSwitch,
  onUnverified,
  loading,
  setLoading,
}: {
  email: string
  redirectTo: string
  onSwitch: () => void
  onUnverified: (email: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const router = useRouter()
  const { t }  = useLocale()
  const a      = t.auth
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')

  const initials = (email.split('@')[0] ?? email).slice(0, 2).toUpperCase()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')

    const res = await authClient.signIn.email({ email, password, callbackURL: redirectTo })
    setLoading(false)

    if (res?.error) {
      const mapped = mapSignInError(res.error)
      if (mapped.kind === 'unverified') {
        onUnverified(email)
      } else {
        setError(mapped.text)
      }
      return
    }

    try { localStorage.setItem('fain_last_email', email) } catch {}
    router.push(redirectTo)
  }

  return (
    <div className="form" style={{ marginTop: 26 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--tan-soft)', border: '2px solid var(--tan-9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 10px', fontSize: 20, fontWeight: 700, color: 'var(--tan-11)',
          fontFamily: 'var(--font-ui)',
        }}>
          {initials}
        </div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{a.welcomeBack}</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-low)' }}>{email}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <Input
            label={a.password}
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={a.enterPassword}
            autoComplete="current-password"
            autoFocus
            required
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{ marginTop: 6, fontSize: 12, color: 'var(--text-low)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {showPw ? a.hide : a.show}
          </button>
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--neg)', fontSize: 13, margin: 0 }}>{error}</p>
        )}

        <Button variant="primary" size="lg" type="submit" loading={loading} style={{ width: '100%' }}>
          {a.continue}
        </Button>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <button
            type="button"
            onClick={onSwitch}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', padding: 0 }}
          >
            {a.useAnotherAccount}
          </button>
          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tan-11)', padding: 0, fontWeight: 500 }}
          >
            {a.forgotPassword}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main sign-in form ────────────────────────────────────────────────────────

function StepSignIn({
  redirectTo,
  initialError,
  onTwoFactor,
  onUnverified,
  loading,
  setLoading,
}: {
  redirectTo: string
  initialError?: string | null
  onTwoFactor: (method: '2fa' | 'sms') => void
  onUnverified: (email: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const router  = useRouter()
  const { t }   = useLocale()
  const a       = t.auth
  const [provider, setProvider] = useState<string | null>(null)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState(initialError ?? '')

  // Absolute callbackURL ensures better-auth never rejects it and the `from`
  // destination is honoured through the full OAuth round-trip.
  function getAbsoluteRedirect() {
    if (typeof window === 'undefined') return redirectTo
    return `${window.location.origin}${redirectTo}`
  }

  async function handleSocial(p: 'google' | 'microsoft') {
    setLoading(true)
    setProvider(p)
    setError('')
    // Social sign-in navigates away; the code below only runs on synchronous error.
    await authClient.signIn.social({ provider: p, callbackURL: getAbsoluteRedirect() })
    setLoading(false)
    setProvider(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setProvider('email')
    setError('')

    const res = await authClient.signIn.email({ email, password, callbackURL: redirectTo })
    setLoading(false)
    setProvider(null)

    if (res?.error) {
      const mapped = mapSignInError(res.error)

      if (mapped.kind === 'unverified') {
        onUnverified(email)
        return
      }

      // Check for 2FA challenge (better-auth signals this via a specific message)
      const msg = (res.error.message ?? '').toLowerCase()
      if (msg.includes('two') || msg.includes('2fa') || msg.includes('otp')) {
        onTwoFactor('2fa')
        return
      }

      setError(mapped.text)
      return
    }

    try { localStorage.setItem('fain_last_email', email) } catch {}
    router.push(redirectTo)
  }

  return (
    <div className="form" style={{ marginTop: 26 }}>

      {/* ── Social providers ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          variant="outline"
          onClick={() => handleSocial('google')}
          loading={loading && provider === 'google'}
          disabled={loading && provider !== 'google'}
          style={{ width: '100%', padding: '12px 18px', gap: 10, justifyContent: 'center' }}
          type="button"
        >
          <GoogleIcon />
          {a.continueGoogle}
        </Button>

        <Button
          variant="outline"
          onClick={() => handleSocial('microsoft')}
          loading={loading && provider === 'microsoft'}
          disabled={loading && provider !== 'microsoft'}
          style={{ width: '100%', padding: '12px 18px', gap: 10, justifyContent: 'center' }}
          type="button"
        >
          <MicrosoftIcon />
          {a.continueMs}
        </Button>
      </div>

      <div className="or">{a.orWithEmail}</div>

      {/* ── Email + password ── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label={a.workEmail}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@yourcompany.ge"
          autoComplete="email"
          required
        />
        <div>
          <Input
            label={a.password}
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={a.enterPassword}
            autoComplete="current-password"
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', padding: 0 }}
            >
              {showPw ? a.hidePassword : a.showPassword}
            </button>
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tan-11)', padding: 0, fontWeight: 500 }}
            >
              {a.forgotPassword}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--neg)', fontSize: 13, margin: 0 }}>{error}</p>
        )}

        <Button
          variant="primary"
          size="lg"
          type="submit"
          loading={loading && provider === 'email'}
          disabled={loading && provider !== 'email'}
          style={{ width: '100%' }}
        >
          {a.signinBtn}
        </Button>
      </form>

      {/* ── Trust line ── */}
      <div className="auth-trust">
        <LockIcon />
        <span>{a.trustLine}</span>
      </div>

      {/* ── Create account ── */}
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-low)', margin: '4px 0 0' }}>
        {a.noAccount}{' '}
        <button
          type="button"
          onClick={() => router.push('/register')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tan-11)', fontWeight: 600, padding: 0, fontSize: 'inherit' }}
        >
          {a.createAccountBtn}
        </button>
      </p>
    </div>
  )
}

// ─── 2FA verification step ────────────────────────────────────────────────────

function StepTwoFactor({
  method,
  redirectTo,
  onBack,
  loading,
  setLoading,
}: {
  method: '2fa' | 'sms'
  redirectTo: string
  onBack: () => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const router = useRouter()
  const { t }  = useLocale()
  const a      = t.auth
  const [code,  setCode]  = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setLoading(true)
    setError('')
    const res = await authClient.twoFactor.verifyTotp({ code })
    setLoading(false)
    if (res?.error) {
      setError(a.errInvalidCode)
      setCode('')  // clear so user starts fresh
    } else {
      router.push(redirectTo)
    }
  }

  return (
    <div className="form" style={{ marginTop: 26 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="lead" style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>
          {a.twoFaTitle}
        </p>
        <p className="hint" style={{ margin: 0 }}>
          {method === 'sms' ? a.smsHint : a.twoFaHint}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label={a.verificationCode}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          autoComplete="one-time-code"
          autoFocus
          required
          style={{ letterSpacing: '0.25em', fontSize: 20, fontFamily: 'var(--font-num)', textAlign: 'center' }}
        />
        {error && (
          <p role="alert" style={{ color: 'var(--neg)', fontSize: 13, margin: 0 }}>{error}</p>
        )}
        <Button
          variant="primary"
          size="lg"
          type="submit"
          loading={loading}
          disabled={code.length !== 6}
          style={{ width: '100%' }}
        >
          {a.verifyAndSignIn}
        </Button>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontSize: 13, padding: 0 }}
        >
          {a.back}
        </button>
      </form>
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

type LoginStep = 'welcome-back' | 'signin' | '2fa' | 'sms' | 'unverified'

export function LoginForm({
  oauthError,
  from,
}: {
  /** Error code from ?error= query param set by better-auth on OAuth failure */
  oauthError?: string
  /** Intended destination from ?from= query param set by the proxy middleware */
  from?: string
}) {
  const redirectTo    = safeRedirectTo(from)
  const initialError  = mapOAuthError(oauthError)

  const [step,            setStep]            = useState<LoginStep>('signin')
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [twoFaMethod,     setTwoFaMethod]     = useState<'2fa' | 'sms'>('2fa')

  // Restore the last-used email from localStorage to show the welcome-back step.
  // Runs only on the client so SSR never sees localStorage.
  useEffect(() => {
    try {
      const last = localStorage.getItem('fain_last_email')
      if (last) {
        setRememberedEmail(last)
        setStep('welcome-back')
      }
    } catch {
      // Silently ignore — private browsing, permission error, etc.
    }
  }, [])

  function handleSwitchAccount() {
    try { localStorage.removeItem('fain_last_email') } catch {}
    setRememberedEmail(null)
    setStep('signin')
  }

  function handleUnverified(email: string) {
    setUnverifiedEmail(email)
    setStep('unverified')
  }

  if (step === 'welcome-back' && rememberedEmail) {
    return (
      <StepWelcomeBack
        email={rememberedEmail}
        redirectTo={redirectTo}
        onSwitch={handleSwitchAccount}
        onUnverified={handleUnverified}
        loading={loading}
        setLoading={setLoading}
      />
    )
  }

  if (step === 'unverified') {
    return (
      <StepUnverified
        email={unverifiedEmail}
        onBack={() => setStep('signin')}
        loading={loading}
        setLoading={setLoading}
      />
    )
  }

  if (step === '2fa' || step === 'sms') {
    return (
      <StepTwoFactor
        method={twoFaMethod}
        redirectTo={redirectTo}
        onBack={() => setStep('signin')}
        loading={loading}
        setLoading={setLoading}
      />
    )
  }

  return (
    <StepSignIn
      redirectTo={redirectTo}
      initialError={initialError}
      onTwoFactor={(method) => { setTwoFaMethod(method); setStep(method) }}
      onUnverified={handleUnverified}
      loading={loading}
      setLoading={setLoading}
    />
  )
}
