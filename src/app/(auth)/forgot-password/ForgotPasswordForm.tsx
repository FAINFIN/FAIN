'use client'

import { useState, FormEvent } from 'react'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLocale } from '@/lib/i18n/LocaleContext'

// ─── Step 1: Enter email ──────────────────────────────────────────────────────

function StepEmail({
  onSent,
  loading,
  setLoading,
}: {
  onSent: (email: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const { t } = useLocale()
  const a = t.auth
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    // Always succeeds (avoids email enumeration)
    await authClient.requestPasswordReset({ email, redirectTo: '/forgot-password/reset' })
    setLoading(false)
    onSent(email)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 26 }}>
      <Input
        label={a.workEmail}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@yourcompany.ge"
        autoComplete="email"
        autoFocus
        required
      />
      {error && <p style={{ color: 'var(--neg)', fontSize: 13, margin: 0 }}>{error}</p>}
      <Button variant="primary" size="lg" type="submit" loading={loading} style={{ width: '100%' }}>
        {a.sendResetLink}
      </Button>
    </form>
  )
}

// ─── Step 2: Link sent ────────────────────────────────────────────────────────

function StepSent({ email, onResend }: { email: string; onResend: () => void }) {
  const { t } = useLocale()
  const a = t.auth
  const [resent,  setResent]  = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleResend() {
    setLoading(true)
    await authClient.requestPasswordReset({ email, redirectTo: '/forgot-password/reset' })
    setLoading(false)
    setResent(true)
    setTimeout(() => setResent(false), 30_000)
  }

  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ textAlign: 'center', padding: '12px 0 24px' }}>
        <div style={{ fontSize: 42, marginBottom: 14 }}>📧</div>
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>{a.checkInbox}</p>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-low)', lineHeight: 1.6 }}>
          {a.resetSentHint(email)}
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-low)' }}>
          {a.resetExpiry}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          variant="outline"
          size="lg"
          onClick={handleResend}
          loading={loading}
          disabled={resent}
          style={{ width: '100%' }}
          type="button"
        >
          {resent ? a.resent : a.resendReset}
        </Button>
        <button
          type="button"
          onClick={onResend}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontSize: 13, padding: '4px 0' }}
        >
          {a.tryDifferentEmail}
        </button>
      </div>
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const [step,    setStep]    = useState<'email' | 'sent'>('email')
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)

  if (step === 'sent') {
    return <StepSent email={email} onResend={() => { setStep('email'); setEmail('') }} />
  }

  return (
    <StepEmail
      loading={loading}
      setLoading={setLoading}
      onSent={(e) => { setEmail(e); setStep('sent') }}
    />
  )
}
