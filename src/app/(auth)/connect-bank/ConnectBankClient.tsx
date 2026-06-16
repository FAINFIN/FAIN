'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/lib/i18n/LocaleContext'

type SrcId = 'bog' | 'tbc' | 'nbg' | 'quickbooks' | 'xero'
interface Source { id: SrcId; glyph: string; name: string; desc: string }

const BANKS: Source[] = [
  { id: 'bog',  glyph: 'BoG', name: 'Bank of Georgia',  desc: 'Business accounts · ₾ / $' },
  { id: 'tbc',  glyph: 'TBC', name: 'TBC Bank',         desc: 'Business accounts · ₾ / $' },
  { id: 'nbg',  glyph: 'NBG', name: 'NBG Open Banking', desc: 'Any Georgian bank via the national rails' },
]
const BOOKS: Source[] = [
  { id: 'quickbooks', glyph: 'Qb', name: 'QuickBooks', desc: 'Invoices, bills & categories' },
  { id: 'xero',       glyph: 'X',  name: 'Xero',       desc: 'Invoices, bills & categories' },
]

type Step     = 'pick' | 'done'
type ConnState = 'idle' | 'connecting' | 'connected' | 'error'

export function ConnectBankClient() {
  const router = useRouter()
  const { locale } = useLocale()
  const [step,   setStep]   = useState<Step>('pick')
  const [states, setStates] = useState<Record<SrcId, ConnState>>({
    bog: 'idle', tbc: 'idle', nbg: 'idle', quickbooks: 'idle', xero: 'idle',
  })
  const [skipped, setSkipped] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)

  const connected = (Object.values(states) as ConnState[]).filter(s => s === 'connected').length

  async function connect(src: Source) {
    setStates(s => ({ ...s, [src.id]: 'connecting' }))
    try {
      const res = await fetch('/api/bank/connect', { method: 'POST' })
      if (!res.ok) throw new Error('connect failed')
      const { connect_url } = await res.json()
      sessionStorage.setItem('fain_connecting', src.id)
      window.location.href = connect_url
    } catch {
      setStates(s => ({ ...s, [src.id]: 'error' }))
    }
  }

  function disconnect(src: Source) {
    setStates(s => ({ ...s, [src.id]: 'idle' }))
  }

  async function handleSkip() {
    setSkipped(true)
    setStep('done')
  }

  async function handleLoadSample() {
    setLoadingSample(true)
    try {
      const { loadSampleData } = await import('@/lib/db/sampleData')
      await loadSampleData()
    } catch (e) {
      console.error(e)
    }
    setLoadingSample(false)
    router.push('/dashboard')
  }

  const STARTERS = locale === 'ka'
    ? ['რამდენ ხანს გავუძლებ?', 'რა არის ჩემი მთავარი ხარჯი?', 'მომგებიანი ვარ?']
    : ['How long is my runway?', "What's my biggest expense?", 'Am I profitable yet?']

  if (step === 'done') {
    return (
      <div className="done-main">
        <div className="steps">
          <span className="step done"><span className="n">✓</span><span className="lbl">{locale === 'ka' ? 'ანგარიში' : 'Create account'}</span></span>
          <span className="sline" />
          <span className="step done"><span className="n">✓</span><span className="lbl">{locale === 'ka' ? 'ბანკი' : 'Connect bank'}</span></span>
          <span className="sline" />
          <span className="step active"><span className="n">3</span><span className="lbl">{locale === 'ka' ? 'ჰკითხე' : 'Ask away'}</span></span>
        </div>

        <div className="done-seal">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg>
        </div>

        <h2 className="serif">
          {locale === 'ka' ? <>შიგნით ხარ. დასვი <span className="em">პირველი შეკითხვა</span>.</> : <>You're in. Ask your <span className="em">first question</span>.</>}
        </h2>

        <p className="lead">
          {skipped
            ? (locale === 'ka' ? 'სცადე Fain სადემო მონაცემებით — ბანკი ნებისმიერ დროს შეგიძლია დაუკავშირო.' : 'Try Fain with sample data — connect a real bank anytime from Settings.')
            : (locale === 'ka' ? 'ანგარიშები სინქრონიზდება — პასუხები წუთებში იქნება მზად.' : 'Your accounts are syncing — first answers are ready in about a minute.')
          }
        </p>

        {skipped && (
          <div style={{ marginBottom: 16 }}>
            <Button
              variant="outline"
              size="sm"
              loading={loadingSample}
              onClick={handleLoadSample}
              style={{ fontSize: 13 }}
            >
              {locale === 'ka' ? '📊 სადემო მონაცემების ჩატვირთვა' : '📊 Load sample company data'}
            </Button>
          </div>
        )}

        <div className="done-chips">
          {STARTERS.map(q => (
            <button key={q} className="chip" onClick={() => router.push(`/ask?q=${encodeURIComponent(q)}`)}>
              {q}
            </button>
          ))}
        </div>

        <Button onClick={() => router.push('/dashboard')} style={{ marginTop: 24 }}>
          {locale === 'ka' ? 'დეშბორდზე გადასვლა' : 'Go to dashboard'}
        </Button>
      </div>
    )
  }

  return (
    <div className="connect-main">
      <div className="steps">
        <span className="step done"><span className="n">✓</span><span className="lbl">{locale === 'ka' ? 'ანგარიში' : 'Create account'}</span></span>
        <span className="sline" />
        <span className="step active"><span className="n">2</span><span className="lbl">{locale === 'ka' ? 'ბანკის დაკავშირება' : 'Connect your bank'}</span></span>
        <span className="sline" />
        <span className="step"><span className="n">3</span><span className="lbl">{locale === 'ka' ? 'ჰკითხე' : 'Ask away'}</span></span>
      </div>

      <h2 className="serif">
        {locale === 'ka' ? <>ახლა, დაუკავშირე შენი <span className="em">ციფრები</span>.</> : <>Now, connect your <span className="em">numbers</span>.</>}
      </h2>
      <p className="lead">
        {locale === 'ka' ? 'დააკავშირე მინიმუმ ერთი ანგარიში. კავშირი მხოლოდ წაკითხვისთვისაა — Fain ვერ ახდენს გადარიცხვას.' : 'Link at least one account. Connections are read-only — Fain can see your numbers, never touch them.'}
      </p>

      <SrcGroup label={locale === 'ka' ? 'ბანკები' : 'Banks'} sources={BANKS} states={states} onConnect={connect} onDisconnect={disconnect} locale={locale} />
      <SrcGroup label={locale === 'ka' ? 'ბუღალტერია' : 'Books'} sources={BOOKS} states={states} onConnect={connect} onDisconnect={disconnect} locale={locale} />

      <div className="assure">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
        <span>{locale === 'ka' ? 'Fain კითხულობს ნაშთებს და ოპერაციებს. ვერ ახდენს გადარიცხვას, ვერ ხედავს პაროლს.' : 'Fain reads balances and transactions through audited, bank-grade connections. It can never move money, and it never sees your bank password.'}</span>
      </div>

      <div className="connect-actions">
        <span className="count">
          {connected === 0
            ? (locale === 'ka' ? 'ანგარიში ჯერ არ არის დაკავშირებული' : 'No accounts connected yet')
            : `${connected} ${locale === 'ka' ? 'წყარო' : `source${connected > 1 ? 's' : ''}`} ${locale === 'ka' ? 'დაკავშირებულია' : 'connected'}`
          }
        </span>
        <span className="right">
          <Button variant="ghost" onClick={handleSkip}>
            {locale === 'ka' ? 'გამოტოვება' : 'Skip for now'}
          </Button>
          <Button disabled={connected === 0} onClick={() => setStep('done')}>
            {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
          </Button>
        </span>
      </div>
    </div>
  )
}

function SrcGroup({ label, sources, states, onConnect, onDisconnect, locale }: {
  label: string
  sources: Source[]
  states: Record<SrcId, ConnState>
  onConnect: (s: Source) => void
  onDisconnect: (s: Source) => void
  locale: 'en' | 'ka'
}) {
  return (
    <div className="src-group">
      <p className="gh">{label}</p>
      <div className="src-list">
        {sources.map(src => {
          const state  = states[src.id]
          const isConn = state === 'connected'
          const isErr  = state === 'error'
          return (
            <div key={src.id} className={`src${isConn ? ' connected' : ''}${isErr ? ' error' : ''}`}>
              <span className="glyph">{src.glyph}</span>
              <span className="meta">
                <span className="nm">{src.name}</span>
                <span className="ds">{src.desc}</span>
                {isConn && <span className="status"><span className="dot" />{locale === 'ka' ? 'დაკავშირებულია' : 'Read-only · synced just now'}</span>}
                {isErr  && <span className="status" style={{ color: 'var(--neg)' }}>{locale === 'ka' ? 'კავშირი ვერ მოხერხდა' : 'Connection failed — try again'}</span>}
              </span>
              <span className="act">
                {!isConn && (
                  <Button variant="outline" size="sm" loading={state === 'connecting'} onClick={() => onConnect(src)}>
                    {isErr ? (locale === 'ka' ? 'სცადე' : 'Retry') : (locale === 'ka' ? 'დაკავშირება' : 'Connect')}
                  </Button>
                )}
                {isConn && (
                  <button className="btn-done" type="button" onClick={() => onDisconnect(src)}>
                    {locale === 'ka' ? 'გათიშვა' : 'Disconnect'}
                  </button>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
