'use client'

import { useState, useEffect } from 'react'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { isSampleData } from '@/lib/db/sampleData'
import Link from 'next/link'

export function SampleDataBanner() {
  const { t } = useLocale()
  const b = t.sampleBanner
  const [show,      setShow]      = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    isSampleData().then(setShow)
  }, [])

  if (!show || dismissed) return null

  return (
    <div style={{
      background: 'var(--tan-2)',
      borderBottom: '1px solid var(--tan-4)',
      padding: '9px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      fontSize: 13,
      color: 'var(--stone-11)',
    }}>
      <span>
        {b.prefix}{' '}
        <Link href="/connect-bank" style={{ color: 'var(--tan-9)', fontWeight: 600 }}>{b.linkText}</Link>
        {b.suffix && <>{' '}{b.suffix}</>}
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontSize: 16, lineHeight: 1, padding: 4 }}
      >
        ×
      </button>
    </div>
  )
}
