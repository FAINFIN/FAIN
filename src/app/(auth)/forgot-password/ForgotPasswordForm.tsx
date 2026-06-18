'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// ─── Password strength rules ──────────────────────────────────────────────────

const rules = [
  { label: '8+ characters',      test: (p: string) => p.length >= 8 },
  { label: 'Number',             test: (p: string) => /\d/.test(p) },
  { label: 'Uppercase letter',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Special character',  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

function CheckIcon({ ok }: { ok: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: ok ? 'var(--pos)' : 'var(--text-low)', flexShrink: 0, transition: 'color .15s' }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

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
        label="Work email"
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
        Send reset link
      </Button>
    </form>
  )
}

// ─── Step 2: Link sent ────────────────────────────────────────────────────────

function StepSent({ email, onResend }: { email: string; onResend: () => void }) {
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
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>Check your inbox</p>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-low)', lineHeight: 1.6 }}>
          If <strong>{email}</strong> has an account, we've sent a password reset link.
          Check your spam folder if it doesn't arrive within a few minutes.
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-low)' }}>
          The link expires in 1 hour.
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
          {resent ? '✓ Link resent' : 'Resend reset link'}
        </Button>
        <button
          type="button"
          onClick={onResend}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontSize: 13, padding: '4px 0' }}
        >
          ← Try a different email
        </button>
      </div>
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const [step,  setStep]  = useState<'email' | 'sent'>('email')
  const [email, setEmail] = useState('')
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
