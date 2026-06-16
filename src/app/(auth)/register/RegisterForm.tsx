'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLocale } from '@/lib/i18n/LocaleContext'

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

export function RegisterForm() {
  const router = useRouter()
  const { t, locale } = useLocale()
  const [email,   setEmail]   = useState('')
  const [name,    setName]    = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleGoogle() {
    setLoading(true)
    await authClient.signIn.social({ provider: 'google', callbackURL: '/connect-bank' })
  }

  async function handleEmail(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await authClient.signIn.magicLink({ email, callbackURL: '/connect-bank' })
    setLoading(false)
    if (res.error) {
      setError(res.error.message ?? (locale === 'ka' ? 'შეცდომა' : 'Something went wrong'))
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="form" style={{ marginTop: 26, textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
        <p className="lead" style={{ margin: 0 }}>
          {locale === 'ka' ? 'შეამოწმე ელ-ფოსტა.' : 'Check your email.'}
        </p>
        <p className="hint" style={{ marginTop: 8 }}>
          {locale === 'ka'
            ? <>გამოგიგზავნეთ ბმული <strong>{email}</strong>-ზე. 15 წუთში ვადა გასდის.</>
            : <>We sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes.</>
          }
        </p>
      </div>
    )
  }

  return (
    <div className="form" style={{ marginTop: 26 }}>
      <Button
        variant="outline"
        onClick={handleGoogle}
        loading={loading}
        style={{ width: '100%', padding: '12px 18px', gap: 10 }}
        type="button"
      >
        <GoogleIcon />
        {t.auth.continueGoogle}
      </Button>

      <div className="or">{t.auth.orWithEmail}</div>

      <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label={t.auth.fullName}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={locale === 'ka' ? 'ნინო ბერიძე' : 'Nino Beridze'}
          autoComplete="name"
        />
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
        <Button variant="primary" size="lg" type="submit" loading={loading} style={{ width: '100%' }}>
          {t.auth.continue}
        </Button>
        <p className="legal">
          {t.auth.termsPrefix}
          <a href="#">{t.auth.terms}</a>
          {t.auth.and}
          <a href="#">{t.auth.privacy}</a>.
        </p>
      </form>
    </div>
  )
}
