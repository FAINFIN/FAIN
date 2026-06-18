'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLocale } from '@/lib/i18n/LocaleContext'

function CheckIcon({ ok }: { ok: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: ok ? 'var(--pos)' : 'var(--text-low)', flexShrink: 0, transition: 'color .15s' }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

// ─── Inner form (needs useSearchParams — must be inside Suspense) ─────────────

function ResetForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''
  const { t } = useLocale()
  const a = t.auth

  const rules = [
    { label: a.rule8chars,  test: (p: string) => p.length >= 8 },
    { label: a.ruleNumber,  test: (p: string) => /\d/.test(p) },
    { label: a.ruleUpper,   test: (p: string) => /[A-Z]/.test(p) },
    { label: a.ruleSpecial, test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ]

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  const passOk  = rules.every(r => r.test(password))
  const matchOk = password === confirm && confirm.length > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!passOk)  { setError(a.errPasswordReqs); return }
    if (!matchOk) { setError(a.passwordsNoMatch); return }
    if (!token)   { setError('Invalid or expired reset link. Request a new one.'); return }

    setLoading(true)
    setError('')
    const res = await authClient.resetPassword({ newPassword: password, token })
    setLoading(false)

    if (res?.error) {
      setError(res.error.message ?? 'This link has expired. Please request a new one.')
    } else {
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    }
  }

  if (!token) {
    return (
      <div style={{ marginTop: 26, textAlign: 'center' }}>
        <p style={{ color: 'var(--neg)', fontSize: 14 }}>
          {a.tryDifferentEmail.replace('← ', '')}{' '}
          <a href="/forgot-password" style={{ color: 'var(--tan-11)', fontWeight: 600 }}>
            {a.sendResetLink.toLowerCase()}
          </a>.
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div style={{ marginTop: 26, textAlign: 'center', padding: '12px 0 24px' }}>
        <div style={{ fontSize: 42, marginBottom: 14 }}>✓</div>
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>{a.passwordReset}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 26 }}>
      <div>
        <Input
          label={a.newPassword}
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={a.createPassword}
          autoComplete="new-password"
          autoFocus
          required
        />
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
          {showPw ? a.hide : a.show}
        </button>
      </div>

      <Input
        label={a.confirmPassword}
        type={showPw ? 'text' : 'password'}
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        placeholder={a.createPassword}
        autoComplete="new-password"
        required
      />

      {error && <p style={{ color: 'var(--neg)', fontSize: 13, margin: 0 }}>{error}</p>}

      <Button
        variant="primary"
        size="lg"
        type="submit"
        loading={loading}
        disabled={!passOk || !matchOk}
        style={{ width: '100%' }}
      >
        {a.savePassword}
      </Button>
    </form>
  )
}

// ─── Root (Suspense wrapper required for useSearchParams) ─────────────────────

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div style={{ marginTop: 26, color: 'var(--text-low)', fontSize: 14 }}>Loading…</div>}>
      <ResetForm />
    </Suspense>
  )
}
