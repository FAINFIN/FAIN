'use client'

import { useState, useEffect } from 'react'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { isSampleData } from '@/lib/db/sampleData'
import Link from 'next/link'

export function SampleDataBanner() {
  const { locale } = useLocale()
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
        {locale === 'ka'
          ? <>📊 სადემო მონაცემებს ხედავ — <Link href="/connect-bank" style={{ color: 'var(--tan-9)', fontWeight: 600 }}>ბანკის დაკავშირება</Link></>
          : <>📊 You're viewing sample data — <Link href="/connect-bank" style={{ color: 'var(--tan-9)', fontWeight: 600 }}>connect a real bank</Link> to see your own numbers.</>
        }
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
