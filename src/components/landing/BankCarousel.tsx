'use client'

const BANKS = [
  { name: 'Bank of Georgia',           slug: 'bog', ext: 'png' },
  { name: 'TBC Bank',                  slug: 'tbc', ext: 'png' },
  { name: 'BasisBank',                 slug: 'basis', ext: 'png' },
  { name: 'Silk Road Bank',            slug: 'silk', ext: 'png' },
  { name: 'Cartu Bank',                slug: 'cartu', ext: 'png' },
  { name: 'Halyk Bank',                slug: 'halyk', ext: 'png' },
  { name: 'Terabank',                  slug: 'tera', ext: 'svg' },
  { name: 'Liberty Bank',              slug: 'liberty', ext: 'png' },
  { name: 'ProCredit Bank',            slug: 'pcb', ext: 'png' },
  { name: 'Ziraat Bank',               slug: 'ziraat', ext: 'svg' },
  { name: 'Pasha Bank',                slug: 'pasha', ext: 'svg' },
  { name: 'Isbank Georgia',            slug: 'isbank', ext: 'png' },
  { name: 'Credo Bank',                slug: 'credo', ext: 'svg' },
  { name: 'Paysera',                   slug: 'paysera', ext: 'svg' },
]

export function BankCarousel() {
  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        {[...BANKS, ...BANKS].map((b, i) => (
          <div key={i} className="conn">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/logos/${b.slug}.${b.ext}`}
              alt={b.name}
              className="bank-logo"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
