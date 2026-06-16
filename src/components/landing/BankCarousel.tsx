'use client'

import React from 'react'

interface Bank {
  name: string
  short: string
  domain: string
}

export function BankCarousel({ banks }: { banks: Bank[] }) {
  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        {[...banks, ...banks].map((b, i) => (
          <div key={i} className="conn" title={b.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://logo.clearbit.com/${b.domain}`}
              alt={b.name}
              className="bank-logo"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none'
                const fb = e.currentTarget.nextElementSibling as HTMLElement | null
                if (fb) fb.style.display = 'inline'
              }}
            />
            <span className="bank-short" style={{ display: 'none' }}>{b.short}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
