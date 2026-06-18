'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

// ─── Welcome back (remembered user) ──────────────────────────────────────────

function StepWelcomeBack({
  email,
  onContinue,
  onSwitch,
  loading,
  setLoading,
}: {
  email: string
  onContinue: () => void
  onSwitch: () => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')

  // Derive initials from email
  const initials = (email.split('@')[0] ?? email).slice(0, 2).toUpperCase()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await authClient.signIn.email({ email, password, callbackURL: '/ask' })
    setLoading(false)
    if (res?.error) {
      setError(res.error.message ?? 'Incorrect password. Please try again.')
    } else {
      router.push('/ask')
    }
  }

  return (
    <div className="form" style={{ marginTop: 26 }}>
      {/* Avatar + email */}
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
        <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Welcome back</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-low)' }}>{email}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            autoFocus
            required
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{ marginTop: 6, fontSize: 12, color: 'var(--text-low)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && <p style={{ color: 'var(--neg)', fontSize: 13, margin: 0 }}>{error}</p>}

        <Button variant="primary" size="lg" type="submit" loading={loading} style={{ width: '100%' }}>
          Continue
        </Button>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <button
            type="button"
            onClick={onSwitch}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', padding: 0 }}
          >
            Use another account
          </button>
          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tan-11)', padding: 0, fontWeight: 500 }}
          >
            Forgot password?
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main sign-in form ────────────────────────────────────────────────────────

function StepSignIn({
  onTwoFactor,
  loading,
  setLoading,
}: {
  onTwoFactor: (method: '2fa' | 'sms') => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const router = useRouter()
  const [provider, setProvider] = useState<string | null>(null)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')

  async function handleSocial(p: 'google' | 'microsoft') {
    setLoading(true)
    setProvider(p)
    setError('')
    await authClient.signIn.social({ provider: p, callbackURL: '/ask' })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setProvider('email')
    setError('')

    const res = await authClient.signIn.email({ email, password, callbackURL: '/ask' })
    setLoading(false)

    if (res?.error) {
      const msg = res.error.message ?? ''
      if (msg.toLowerCase().includes('two') || msg.toLowerCase().includes('2fa')) {
        onTwoFactor('2fa')
      } else {
        setError(msg || 'Incorrect email or password.')
      }
      return
    }

    // Remember email for next visit
    try { localStorage.setItem('fain_last_email', email) } catch {}
    router.push('/ask')
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
          Continue with Google
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
          Continue with Microsoft
        </Button>
      </div>

      <div className="or">or with email</div>

      {/* ── Email + password ── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@yourcompany.ge"
          autoComplete="email"
          required
        />
        <div>
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', padding: 0 }}
            >
              {showPw ? 'Hide password' : 'Show password'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tan-11)', padding: 0, fontWeight: 500 }}
            >
              Forgot password?
            </button>
          </div>
        </div>

        {error && <p style={{ color: 'var(--neg)', fontSize: 13, margin: 0 }}>{error}</p>}

        <Button
          variant="primary"
          size="lg"
          type="submit"
          loading={loading && provider === 'email'}
          disabled={loading && provider !== 'email'}
          style={{ width: '100%' }}
        >
          Sign in
        </Button>
      </form>

      {/* ── Trust line ── */}
      <div className="auth-trust">
        <LockIcon />
        <span>Protected with 2FA and end-to-end encryption. We never store bank credentials.</span>
      </div>

      {/* ── Create account ── */}
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-low)', margin: '4px 0 0' }}>
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/register')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tan-11)', fontWeight: 600, padding: 0, fontSize: 'inherit' }}
        >
          Create account
        </button>
      </p>
    </div>
  )
}

// ─── 2FA verification step ────────────────────────────────────────────────────

function StepTwoFactor({
  method,
  onBack,
  loading,
  setLoading,
}: {
  method: '2fa' | 'sms'
  onBack: () => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const router = useRouter()
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
      setError('Invalid code — check your authenticator app and try again.')
    } else {
      router.push('/ask')
    }
  }

  return (
    <div className="form" style={{ marginTop: 26 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="lead" style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>
          Two-factor verification
        </p>
        <p className="hint" style={{ margin: 0 }}>
          {method === 'sms'
            ? 'Enter the 6-digit code sent to your phone.'
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

// ─── Root component ───────────────────────────────────────────────────────────

type Step = 'welcome-back' | 'signin' | '2fa' | 'sms'

export function LoginForm() {
  const [step,          setStep]          = useState<Step>('signin')
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [twoFaMethod,   setTwoFaMethod]   = useState<'2fa' | 'sms'>('2fa')

  // Check for remembered email on mount
  useEffect(() => {
    try {
      const last = localStorage.getItem('fain_last_email')
      if (last) {
        setRememberedEmail(last)
        setStep('welcome-back')
      }
    } catch {}
  }, [])

  if (step === 'welcome-back' && rememberedEmail) {
    return (
      <StepWelcomeBack
        email={rememberedEmail}
        onContinue={() => {}}
        onSwitch={() => { setRememberedEmail(null); setStep('signin') }}
        loading={loading}
        setLoading={setLoading}
      />
    )
  }

  if (step === '2fa' || step === 'sms') {
    return (
      <StepTwoFactor
        method={twoFaMethod}
        onBack={() => setStep('signin')}
        loading={loading}
        setLoading={setLoading}
      />
    )
  }

  return (
    <StepSignIn
      onTwoFactor={(method) => { setTwoFaMethod(method); setStep(method) }}
      loading={loading}
      setLoading={setLoading}
    />
  )
}
