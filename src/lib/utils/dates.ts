import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns'
import { ka } from 'date-fns/locale'

export type DateRange = { from: Date; to: Date }
export type YearMonth = { year: number; month: number }

// ── Month labels ──────────────────────────────────────────

const KA_MONTHS_SHORT = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ']
const KA_MONTHS_LONG  = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
                          'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი']

/** "Jan 2024" in the current locale */
export function monthLabel(date: Date, locale: 'en' | 'ka' = 'en'): string {
  if (locale === 'ka') {
    return `${KA_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
  }
  return format(date, 'MMM yyyy')
}

/** Full Georgian month name, e.g. "იანვარი" */
export function kaMonthName(month: number): string {
  return KA_MONTHS_LONG[month - 1] ?? ''
}

// ── Ranges ────────────────────────────────────────────────

export function last6MonthsRange(): DateRange {
  return { from: startOfMonth(subMonths(new Date(), 5)), to: endOfMonth(new Date()) }
}

export function last12MonthsRange(): DateRange {
  return { from: startOfMonth(subMonths(new Date(), 11)), to: endOfMonth(new Date()) }
}

/** Generate { year, month }[] from a DateRange */
export function rangeToMonths({ from, to }: DateRange): YearMonth[] {
  return eachMonthOfInterval({ start: from, end: to }).map(d => ({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
  }))
}

/** Reconstruct a Date from a YearMonth */
export function yearMonthToDate({ year, month }: YearMonth): Date {
  return new Date(year, month - 1, 1)
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function monthsInRange(from: Date, to: Date): Date[] {
  return eachMonthOfInterval({ start: from, end: to })
}
