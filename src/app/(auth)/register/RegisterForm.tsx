'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLocale } from '@/lib/i18n/LocaleContext'

// ─── Duplicate email detection ────────────────────────────────────────────────
// better-auth may return various messages for "email already exists" — normalise them.

function isDuplicateEmail(err: { code?: string; message?: string }): boolean {
  const code = (err.code ?? '').toUpperCase()
  const msg  = (err.message ?? '').toLowerCase()
  return (
    code === 'USER_ALREADY_EXISTS'  ||
    code === 'EMAIL_EXISTS'         ||
    msg.includes('already exists')  ||
    msg.includes('already in use')  ||
    msg.includes('email is taken')  ||
    msg.includes('account already')
  )
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

function CheckIcon({ ok }: { ok: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: ok ? 'var(--pos)' : 'var(--text-low)', flexShrink: 0, transition: 'color .15s' }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

/** SVG mail icon — no emoji per Fain design rules */
function MailIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tan-9)' }}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
}

// ─── Step 1: Create account ───────────────────────────────────────────────────

function StepCreate({
  onVerify,
  loading,
  setLoading,
}: {
  onVerify: (email: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const router = useRouter()
  const { t }  = useLocale()
  const a      = t.auth

  const rules = [
    { label: a.rule8chars,  test: (p: string) => p.length >= 8 },
    { label: a.ruleNumber,  test: (p: string) => /\d/.test(p) },
    { label: a.ruleUpper,   test: (p: string) => /[A-Z]/.test(p) },
    { label: a.ruleSpecial, test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ]

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [provider, setProvider] = useState<string | null>(null)
  const [error,    setError]    = useState<React.ReactNode>('')

  const passOk = rules.every(r => r.test(password))

  // Absolute callbackURL so better-auth redirect validation never rejects it.
  function getCallbackURL() {
    if (typeof window === 'undefined') return '/onboarding'
    return `${window.location.origin}/onboarding`
  }

  async function handleSocial(p: 'google' | 'microsoft') {
    setLoading(true)
    setProvider(p)
    setError('')
    // Social sign-in navigates away; code below only runs on synchronous error.
    await authClient.signIn.social({ provider: p, callbackURL: getCallbackURL() })
    setLoading(false)
    setProvider(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!passOk) { setError(a.errPasswordReqs); return }
    setLoading(true)
    setProvider('email')
    setError('')

    const res = await authClient.signUp.email({ name, email, password, callbackURL: '/onboarding' })
    setLoading(false)
    setProvider(null)

    if (res?.error) {
      // Duplicate email: actionable message with a link to sign in
      if (isDuplicateEmail(res.error)) {
        setError(
          <span>
            An account with this email already exists.{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--tan-11)', fontWeight: 600, fontSize: 'inherit', textDecoration: 'underline' }}
            >
              Sign in instead
            </button>
          </span>
        )
      } else {
        setError(res.error.message ?? 'Something went wrong. Please try again.')
      }
      return
    }

    onVerify(email)
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
          label={a.fullName}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nino Beridze"
          autoComplete="name"
          required
        />
        <Input
          label={a.workEmail}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="nino@yourcompany.ge"
          autoComplete="email"
          required
        />
        <div>
          <Input
            label={a.password}
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={a.createPassword}
            autoComplete="new-password"
            required
          />
          {/* Password strength checklist */}
          {password.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {rules.map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-low)' }}>
                  <CheckIcon ok={r.test(password)} />
                  {r.label}
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{ marginTop: 6, fontSize: 12, color: 'var(--text-low)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {showPw ? a.hidePassword : a.showPassword}
          </button>
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
          {a.createAccountBtn}
        </Button>

        <p className="legal">
          {a.legalPrefix}
          <a href="/terms">{a.termsOfService}</a>
          {a.and}
          <a href="/privacy">{a.privacy}</a>.
        </p>
      </form>

      {/* ── Trust line ── */}
      <div className="auth-trust">
        <LockIcon />
        <span>{a.trustLine}</span>
      </div>

      {/* ── Already have an account ── */}
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-low)', margin: '4px 0 0' }}>
        {a.haveAccount}{' '}
        <button
          type="button"
          onClick={() => router.push('/login')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tan-11)', fontWeight: 600, padding: 0, fontSize: 'inherit' }}
        >
          {a.signinBtn}
        </button>
      </p>
    </div>
  )
}

// ─── Step 2: Verify email ─────────────────────────────────────────────────────
// SVG envelope icon (no emoji — design rule: never use emoji).
// Countdown timer prevents rapid resend clicks.

const RESEND_COOLDOWN = 30 // seconds

function StepVerify({ email, onBack }: { email: string; onBack: () => void }) {
  const { t }  = useLocale()
  const a      = t.auth
  const [loading,    setLoading]    = useState(false)
  const [resendError, setResendError] = useState('')
  const [sent,        setSent]        = useState(true)   // email already sent on sign-up
  const [countdown,   setCountdown]   = useState(RESEND_COOLDOWN)

  // Count down from RESEND_COOLDOWN; reset when user successfully resends
  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  const canResend = countdown <= 0 && !loading

  async function handleResend() {
    setLoading(true)
    setResendError('')
    try {
      await authClient.sendVerificationEmail({ email, callbackURL: '/onboarding' })
      setSent(true)
      setCountdown(RESEND_COOLDOWN)
    } catch {
      setResendError('Could not send email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form" style={{ marginTop: 26 }}>
      <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
        {/* SVG mail icon — no emoji per design rules */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <MailIcon />
        </div>
        <p className="lead" style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>
          {a.checkEmail}
        </p>
        <p className="hint" style={{ margin: 0 }}>
          {a.checkEmailHint(email)}
        </p>
        <p className="hint" style={{ marginTop: 6, fontSize: 12 }}>
          {a.checkEmailExpiry}
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
          disabled={!canResend}
          style={{ width: '100%' }}
          type="button"
        >
          {loading
            ? 'Sending…'
            : countdown > 0
              ? `Resend in ${countdown}s`
              : sent
                ? a.resend ?? 'Resend verification email'
                : a.resend ?? 'Resend verification email'}
        </Button>

        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontSize: 13, padding: '4px 0' }}
        >
          {a.useDifferentEmail}
        </button>
      </div>
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export function RegisterForm() {
  const [step,    setStep]    = useState<'create' | 'verify'>('create')
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)

  if (step === 'verify') {
    return <StepVerify email={email} onBack={() => setStep('create')} />
  }

  return (
    <StepCreate
      loading={loading}
      setLoading={setLoading}
      onVerify={(e) => { setEmail(e); setStep('verify') }}
    />
  )
}
