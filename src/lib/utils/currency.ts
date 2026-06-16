import type { Currency } from '@/types'
import type { Locale } from '@/lib/i18n/strings'

const SYMBOLS: Record<Currency, string> = {
  GEL: '₾',
  USD: '$',
  EUR: '€',
}

interface FormatOptions {
  currency?:  Currency
  compact?:   boolean
  showSign?:  boolean
  decimals?:  number
  locale?:    Locale
}

/**
 * Format a number as a currency string.
 * Georgian convention: symbol before the number.
 * e.g. formatCurrency(12500, { currency: 'GEL' }) → "₾12,500"
 *      formatCurrency(12500, { currency: 'GEL', locale: 'ka' }) → "₾12 500"
 */
export function formatCurrency(
  amount: number,
  { currency = 'GEL', compact = false, showSign = false, decimals, locale = 'en' }: FormatOptions = {}
): string {
  const symbol = SYMBOLS[currency]
  const abs    = Math.abs(amount)

  let formatted: string
  if (compact && abs >= 1_000_000) {
    formatted = (abs / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  } else if (compact && abs >= 1_000) {
    formatted = (abs / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  } else {
    // Georgian uses narrow no-break space as thousands separator
    const numberLocale = locale === 'ka' ? 'ka-GE' : 'en-US'
    formatted = abs.toLocaleString(numberLocale, {
      minimumFractionDigits: decimals ?? (abs % 1 === 0 ? 0 : 2),
      maximumFractionDigits: decimals ?? 2,
    })
  }

  const sign = showSign ? (amount >= 0 ? '+' : '−') : amount < 0 ? '−' : ''
  return `${sign}${symbol}${formatted}`
}

export function convertCurrency(
  amount:  number,
  from:    Currency,
  to:      Currency,
  rates:   Partial<Record<Currency, number>> = {}
): number {
  if (from === to) return amount
  const defaults: Record<Currency, number> = { GEL: 1, USD: 2.73, EUR: 2.96 }
  const r = { ...defaults, ...rates }
  return (amount / r[from]) * r[to]
}
