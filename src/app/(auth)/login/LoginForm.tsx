'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLocale } from '@/lib/i18n/LocaleContext'

// ─── Social provider icons ────────────────────────────────────────────────────

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

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
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

// ─── 2FA verification step ────────────────────────────────────────────────────

function TwoFactorStep({
  method,
  onVerify,
  onBack,
  loading,
}: {
  method: '2fa' | 'sms'
  onVerify: (code: string) => Promise<void>
  onBack: () => void
  loading: boolean
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setError('')
    try {
      await onVerify(code)
    } catch {
      setError('Invalid code — check your authenticator app and try again.')
    }
  }

  return (
    <div className="form" style={{ marginTop: 26 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="lead" style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>
          {method === 'sms' ? 'Check your phone' : 'Two-factor verification'}
        </p>
        <p className="hint" style={{ margin: 0 }}>
          {method === 'sms'
            ? 'Enter the 6-digit code we just sent via SMS.'
            : 'Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.).'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Verification code"
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
        {error && <p style={{ color: 'var(--neg)', fontSize: 13, margin: 0 }}>{error}</p>}
        <Button variant="primary" size="lg" type="submit" loading={loading} style={{ width: '100%' }}>
          Verify &amp; sign in
        </Button>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontSize: 13, padding: 0 }}
        >
          ← Back
        </button>
      </form>
    </div>
  )
}

// ─── Main login form ──────────────────────────────────────────────────────────

type Step = 'main' | '2fa' | 'sms' | 'sent'

export function LoginForm() {
  const { t, locale } = useLocale()
  const router = useRouter()
  const [step,    setStep]    = useState<Step>('main')
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<string | null>(null)
  const [error,   setError]   = useState('')

  // ── Social sign-in ──────────────────────────────────────────────────────────
  async function handleSocial(p: 'google' | 'microsoft' | 'apple') {
    setLoading(true)
    setProvider(p)
    setError('')
    await authClient.signIn.social({ provider: p, callbackURL: '/ask' })
  }

  // ── Magic link ──────────────────────────────────────────────────────────────
  async function handleMagicLink(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setProvider('magic-link')
    setError('')
    const res = await authClient.signIn.magicLink({ email, callbackURL: '/ask' })
    setLoading(false)
    if (res.error) {
      setError(res.error.message ?? (locale === 'ka' ? 'შეცდომა' : 'Something went wrong'))
    } else {
      setStep('sent')
    }
  }

  // ── 2FA verify ─────────────────────────────────────────────────────────────
  async function handleTwoFactorVerify(code: string) {
    setLoading(true)
    const res = await authClient.twoFactor.verifyTotp({ code })
    setLoading(false)
    if (res?.error) throw new Error(res.error.message)
    router.push('/ask')
  }

  // ─── Sent step ─────────────────────────────────────────────────────────────
  if (step === 'sent') {
    return (
      <div className="form" style={{ marginTop: 26, textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
        <p className="lead" style={{ margin: 0 }}>
          {locale === 'ka' ? 'შეამოწმე ელ-ფოსტა.' : 'Check your email.'}
        </p>
        <p className="hint" style={{ marginTop: 8 }}>
          {locale === 'ka'
            ? <>გამოგიგზავნეთ ბმული <strong>{email}</strong>-ზე.</>
            : <>We sent a sign-in link to <strong>{email}</strong>.</>
          }
        </p>
        <p className="hint" style={{ marginTop: 4, fontSize: 12 }}>
          Link expires in 15 minutes. Check your spam folder if it doesn't arrive.
        </p>
        <button
          onClick={() => setStep('main')}
          style={{ marginTop: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontSize: 13 }}
        >
          ← Try a different address
        </button>
      </div>
    )
  }

  // ─── 2FA / SMS step ────────────────────────────────────────────────────────
  if (step === '2fa' || step === 'sms') {
    return (
      <TwoFactorStep
        method={step}
        onVerify={handleTwoFactorVerify}
        onBack={() => setStep('main')}
        loading={loading}
      />
    )
  }

  // ─── Main step: social → email ─────────────────────────────────────────────
  return (
    <div className="form" style={{ marginTop: 26 }}>

      {/* ── Social providers: ordered Google → Microsoft → Apple ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Google — primary; full-width, most prominent */}
        <Button
          variant="outline"
          onClick={() => handleSocial('google')}
          loading={loading && provider === 'google'}
          disabled={loading && provider !== 'google'}
          style={{ width: '100%', padding: '12px 18px', gap: 10, justifyContent: 'center' }}
          type="button"
        >
          <GoogleIcon />
          {t.auth.continueGoogle}
        </Button>

        {/* Microsoft (Exchange / M365) */}
        <Button
          variant="outline"
          onClick={() => handleSocial('microsoft')}
          loading={loading && provider === 'microsoft'}
          disabled={loading && provider !== 'microsoft'}
          style={{ width: '100%', padding: '12px 18px', gap: 10, justifyContent: 'center' }}
          type="button"
        >
          <MicrosoftIcon />
          Continue with Microsoft
        </Button>

        {/* Apple Sign In */}
        <Button
          variant="outline"
          onClick={() => handleSocial('apple')}
          loading={loading && provider === 'apple'}
          disabled={loading && provider !== 'apple'}
          style={{ width: '100%', padding: '12px 18px', gap: 10, justifyContent: 'center', background: 'var(--stone-12)', color: 'var(--text-inverted)', borderColor: 'var(--stone-12)' }}
          type="button"
        >
          <AppleIcon />
          Continue with Apple
        </Button>
      </div>

      <div className="or">{t.auth.orWithEmail}</div>

      {/* ── Magic link email ── */}
      <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label={t.auth.workEmail}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={locale === 'ka' ? 'nino@თქვენი-კომპანია.ge' : 'nino@yourcompany.ge'}
          autoComplete="email"
          required
        />
        <p className="hint">{t.auth.magicLinkHint}</p>
        {error && <p style={{ color: 'var(--neg)', fontSize: 13, margin: 0 }}>{error}</p>}
        <Button
          variant="primary"
          size="lg"
          type="submit"
          loading={loading && provider === 'magic-link'}
          disabled={loading && provider !== 'magic-link'}
          style={{ width: '100%' }}
        >
          {t.auth.continue}
        </Button>
      </form>

      {/* ── Trust line ── */}
      <div className="auth-trust">
        <LockIcon />
        <span>
          Protected with passkeys, 2FA, and SMS verification.{' '}
          We never store passwords.
        </span>
      </div>
    </div>
  )
}
