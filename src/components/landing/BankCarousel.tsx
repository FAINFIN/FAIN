'use client'

const BANKS = [
  { name: 'Bank of Georgia',      short: 'BOG',     color: '#fc6803' },
  { name: 'BasisBank',            short: 'Basis',   color: '#0284c7' },
  { name: 'Silk Bank',            short: 'Silk',    color: '#7c3aed' },
  { name: 'Cartu Bank',           short: 'Cartu',   color: '#059669' },
  { name: 'Halyk Bank Georgia',   short: 'Halyk',   color: '#15803d' },
  { name: 'Terabank',             short: 'Tera',    color: '#9333ea' },
  { name: 'Liberty Bank',         short: 'Liberty', color: '#16a34a' },
  { name: 'ProCredit Bank',       short: 'PCB',     color: '#1d4ed8' },
  { name: 'TBC Bank',             short: 'TBC',     color: '#0044b8' },
  { name: 'Ziraat Bank Georgia',  short: 'Ziraat',  color: '#dc2626' },
  { name: 'Pasha Bank Georgia',   short: 'Pasha',   color: '#0369a1' },
  { name: 'Isbank Georgia',       short: 'Isbank',  color: '#1e40af' },
  { name: 'Credo Bank',           short: 'Credo',   color: '#e63946' },
  { name: 'Paysera Bank Georgia', short: 'Paysera', color: '#ea580c' },
]

export function BankCarousel() {
  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        {[...BANKS, ...BANKS].map((b, i) => (
          <div key={i} className="conn">
            <span className="bank-dot" style={{ background: b.color }} />
            <span className="bank-nm">{b.short}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
