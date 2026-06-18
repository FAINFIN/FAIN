'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/lib/i18n/LocaleContext'

// ─── Option card ──────────────────────────────────────────────────────────────

function OptionCard({
  label, desc, selected, onClick,
}: {
  label: string; desc: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', background: 'none',
        border: `2px solid ${selected ? 'var(--tan-9)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--r-control, 13px)',
        padding: '14px 18px',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'border-color .15s, background .15s',
        backgroundColor: selected ? 'var(--tan-soft)' : 'transparent',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-high)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 2 }}>{desc}</div>
      </div>
      {selected && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tan-9)', flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </button>
  )
}

// ─── Step progress dots ───────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 6, height: 6,
          borderRadius: 999,
          background: i <= current ? 'var(--tan-9)' : 'var(--border-subtle)',
          transition: 'width .2s, background .2s',
        }} />
      ))}
    </div>
  )
}

// ─── Root wizard ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4

export function OnboardingWizard() {
  const router = useRouter()
  const { t } = useLocale()
  const o = t.onboarding

  const ROLES = [
    { value: 'founder',    ...o.roles.founder    },
    { value: 'cfo',        ...o.roles.cfo        },
    { value: 'accountant', ...o.roles.accountant },
    { value: 'investor',   ...o.roles.investor   },
    { value: 'consultant', ...o.roles.consultant },
    { value: 'other',      ...o.roles.other      },
  ]

  const COMPANY_SIZES = [
    { value: 'solo',   ...o.sizes.solo    },
    { value: '2-10',   ...o.sizes.s2_10   },
    { value: '11-50',  ...o.sizes.s11_50  },
    { value: '51-200', ...o.sizes.s51_200 },
    { value: '200+',   ...o.sizes.s200p   },
  ]

  const GOALS = [
    { value: 'cash_flow',   ...o.goals.cash_flow   },
    { value: 'budgeting',   ...o.goals.budgeting   },
    { value: 'forecasting', ...o.goals.forecasting },
    { value: 'reporting',   ...o.goals.reporting   },
    { value: 'ai',          ...o.goals.ai          },
  ]

  const [step,         setStep]         = useState(0)
  const [role,         setRole]         = useState('')
  const [companySize,  setCompanySize]  = useState('')
  const [goal,         setGoal]         = useState('')
  const [workspace,    setWorkspace]    = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const canAdvance = [
    role !== '',
    companySize !== '',
    goal !== '',
    workspace.trim().length >= 2,
  ][step]

  async function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobRole:      role,
          companySize,
          primaryGoal:  goal,
          organisation: workspace.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to save profile')
      }

      router.push('/ask')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      background: 'var(--surface-base)',
    }}>
      {/* Brand */}
      <a href="/" style={{ textDecoration: 'none', marginBottom: 40 }}>
        <span className="word" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-high)', fontFamily: 'var(--font-logo, var(--font-ui))' }}>
          fain<span style={{ color: 'var(--tan-9)' }}>.</span>
        </span>
      </a>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 460,
        background: 'var(--surface-primary)',
        borderRadius: 'var(--r-panel, 28px)',
        padding: '32px 28px 28px',
        boxShadow: 'var(--sh-card)',
      }}>
        <StepDots total={TOTAL_STEPS} current={step} />

        {/* Step 0 — Role */}
        {step === 0 && (
          <div>
            <h2 className="serif" style={{ margin: '0 0 8px', fontSize: 28 }}>
              {o.roleTitle.split(' ').map((w, i, arr) => {
                const isLast = i === arr.length - 1
                return isLast
                  ? <span key={i}><span className="em">{w}</span></span>
                  : <span key={i}>{w} </span>
              })}
            </h2>
            <p className="lead" style={{ margin: '0 0 24px', fontSize: 15 }}>{o.roleLead}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROLES.map(r => (
                <OptionCard key={r.value} label={r.label} desc={r.desc} selected={role === r.value} onClick={() => setRole(r.value)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Company size */}
        {step === 1 && (
          <div>
            <h2 className="serif" style={{ margin: '0 0 8px', fontSize: 28 }}>
              {o.sizeTitle}
            </h2>
            <p className="lead" style={{ margin: '0 0 24px', fontSize: 15 }}>{o.sizeLead}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COMPANY_SIZES.map(s => (
                <OptionCard key={s.value} label={s.label} desc={s.desc} selected={companySize === s.value} onClick={() => setCompanySize(s.value)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Goal */}
        {step === 2 && (
          <div>
            <h2 className="serif" style={{ margin: '0 0 8px', fontSize: 28 }}>
              {o.goalTitle}
            </h2>
            <p className="lead" style={{ margin: '0 0 24px', fontSize: 15 }}>{o.goalLead}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GOALS.map(g => (
                <OptionCard key={g.value} label={g.label} desc={g.desc} selected={goal === g.value} onClick={() => setGoal(g.value)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Workspace */}
        {step === 3 && (
          <div>
            <h2 className="serif" style={{ margin: '0 0 8px', fontSize: 28 }}>
              {o.wsTitle}
            </h2>
            <p className="lead" style={{ margin: '0 0 24px', fontSize: 15 }}>{o.wsLead}</p>
            <input
              type="text"
              value={workspace}
              onChange={e => setWorkspace(e.target.value)}
              placeholder={o.wsPlaceholder}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '14px 16px',
                fontSize: 15,
                border: '2px solid var(--border-loud)',
                borderRadius: 'var(--r-control, 13px)',
                outline: 'none',
                background: 'var(--surface-primary)',
                color: 'var(--text-high)',
                fontFamily: 'var(--font-ui)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--tan-9)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-loud)' }}
            />
            <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-low)' }}>
              {o.wsHint}
            </p>
          </div>
        )}

        {error && <p style={{ color: 'var(--neg)', fontSize: 13, margin: '16px 0 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24, alignItems: 'center' }}>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontSize: 13, padding: '0 4px', flexShrink: 0 }}
            >
              {o.back}
            </button>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            loading={loading}
            disabled={!canAdvance}
            style={{ flex: 1 }}
            type="button"
          >
            {step === TOTAL_STEPS - 1 ? o.launch : o.continue}
          </Button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-low)', margin: '14px 0 0' }}>
          {o.stepOf(step + 1, TOTAL_STEPS)}
        </p>
      </div>
    </div>
  )
}
