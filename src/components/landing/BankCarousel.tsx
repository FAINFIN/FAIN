'use client'

const BANKS = [
  { name: 'Bank of Georgia',           slug: 'bog', ext: 'svg' },
  { name: 'TBC Bank',                  slug: 'tbc', ext: 'svg' },
  { name: 'BasisBank',                 slug: 'basis', ext: 'svg' },
  { name: 'Silk Bank',                 slug: 'silk', ext: 'svg' },
  { name: 'Cartu Bank',                slug: 'cartu', ext: 'svg' },
  { name: 'Halyk Bank',                slug: 'halyk', ext: 'svg' },
  { name: 'Terabank',                  slug: 'tera', ext: 'svg' },
  { name: 'Liberty Bank',              slug: 'liberty', ext: 'png' },
  { name: 'ProCredit Bank',            slug: 'pcb', ext: 'png' },
  { name: 'Ziraat Bank',               slug: 'ziraat', ext: 'svg' },
  { name: 'Pasha Bank',                slug: 'pasha', ext: 'svg' },
  { name: 'Isbank Georgia',            slug: 'isbank', ext: 'svg' },
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
              width={28}
              height={28}
            />
            <span className="bank-nm">{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
