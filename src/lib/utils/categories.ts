/**
 * Transaction category normalisation.
 *
 * Salt Edge v5 returns raw machine-readable category strings
 * (e.g. "food_and_drinks", "salary", "transport"). This module
 * maps those to clean human-readable display names used across
 * the Transactions UI, AI context, and charts.
 *
 * Normalisation happens ONCE at storage time (callback/page.tsx),
 * so all downstream readers see clean names — no mapping in the UI.
 */

// Salt Edge raw key → clean display name (English)
const SE_MAP: Record<string, string> = {
  // ── Income ────────────────────────────────────────
  salary:             'Payroll',
  employment:         'Payroll',
  wages:              'Payroll',
  payroll:            'Payroll',
  pension:            'Pension',
  income:             'Income',
  rental_income:      'Rental Income',
  dividend:           'Dividends',
  interest:           'Interest',
  refund:             'Refunds',
  cashback:           'Refunds',
  // ── Business income ───────────────────────────────
  services:           'Services',
  b2b_services:       'Services',
  consulting:         'Services',
  freelance:          'Services',
  // ── Transfers ─────────────────────────────────────
  transfer:           'Transfers',
  internal_transfer:  'Transfers',
  // ── Food ──────────────────────────────────────────
  food_and_drinks:    'Food & Dining',
  food_and_dining:    'Food & Dining',
  restaurants:        'Food & Dining',
  cafe:               'Food & Dining',
  groceries:          'Groceries',
  supermarkets:       'Groceries',
  // ── Transport ─────────────────────────────────────
  transport:          'Transportation',
  transportation:     'Transportation',
  fuel:               'Transportation',
  taxi:               'Transportation',
  public_transport:   'Transportation',
  // ── Shopping ──────────────────────────────────────
  shopping:           'Shopping',
  clothing:           'Shopping',
  electronics:        'Shopping',
  // ── Utilities ─────────────────────────────────────
  utilities:          'Utilities',
  phone:              'Utilities',
  mobile:             'Utilities',
  internet:           'Utilities',
  electricity:        'Utilities',
  gas:                'Utilities',
  water:              'Utilities',
  // ── Business expenses ─────────────────────────────
  marketing:          'Marketing',
  advertising:        'Marketing',
  software:           'Software & SaaS',
  saas:               'Software & SaaS',
  subscriptions:      'Subscriptions',
  equipment:          'Equipment',
  hardware:           'Equipment',
  office:             'Office',
  office_supplies:    'Office',
  rent:               'Rent',
  real_estate:        'Real Estate',
  legal:              'Legal',
  accounting:         'Accounting',
  business_services:  'Business',
  professional:       'Business',
  // ── Wellbeing ─────────────────────────────────────
  entertainment:      'Entertainment',
  healthcare:         'Healthcare',
  medical:            'Healthcare',
  pharmacy:           'Healthcare',
  education:          'Education',
  training:           'Education',
  travel:             'Travel',
  hotels:             'Travel',
  flights:            'Travel',
  accommodation:      'Travel',
  personal_care:      'Personal Care',
  beauty:             'Personal Care',
  sport:              'Personal Care',
  // ── Finance ───────────────────────────────────────
  taxes:              'Taxes',
  tax:                'Taxes',
  insurance:          'Insurance',
  investments:        'Investments',
  savings:            'Savings',
  loan:               'Loan Payment',
  loan_payment:       'Loan Payment',
  credit_card:        'Credit Card',
  bank_fees:          'Bank Fees',
  fees:               'Bank Fees',
  // ── Cash ──────────────────────────────────────────
  cash:               'Cash & ATM',
  atm:                'Cash & ATM',
  // ── Fallback ──────────────────────────────────────
  payments:           'Payments',
  other:              'Other',
  uncategorized:      'Other',
  uncategorised:      'Other',
  unknown:            'Other',
}

/**
 * Convert a Salt Edge raw category string to a clean display name.
 * Falls back to title-casing the raw value for unmapped categories.
 */
export function normalizeCategory(raw: string | undefined | null): string {
  if (!raw) return 'Other'
  const key = raw.toLowerCase().replace(/[\s\-]/g, '_')
  if (SE_MAP[key]) return SE_MAP[key]
  // Title-case fallback for unmapped keys (e.g. "some_new_cat" → "Some New Cat")
  return raw.split(/[_\s-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

// ── Category colour palette ───────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  // Income
  'Payroll':         '#66BB6A',
  'Income':          '#66BB6A',
  'Services':        '#42A5F5',
  'Rental Income':   '#26C6DA',
  'Dividends':       '#26C6DA',
  'Interest':        '#26C6DA',
  'Refunds':         '#78909C',
  'Transfers':       '#90A4AE',
  // Food
  'Food & Dining':   '#FF8A65',
  'Groceries':       '#FFAB40',
  // Transport
  'Transportation':  '#4DB6AC',
  // Shopping
  'Shopping':        '#BA68C8',
  // Utilities
  'Utilities':       '#FFD54F',
  // Business
  'Marketing':       '#EF5350',
  'Software & SaaS': '#5C6BC0',
  'Subscriptions':   '#7E57C2',
  'Equipment':       '#8D6E63',
  'Office':          '#A1887F',
  'Rent':            '#FF7043',
  'Real Estate':     '#FF7043',
  'Legal':           '#EC407A',
  'Accounting':      '#26A69A',
  'Business':        '#4FC3F7',
  'Pension':         '#81C784',
  // Wellbeing
  'Entertainment':   '#F06292',
  'Healthcare':      '#81C784',
  'Education':       '#7986CB',
  'Travel':          '#4DD0E1',
  'Personal Care':   '#F48FB1',
  // Finance
  'Taxes':           '#B0BEC5',
  'Insurance':       '#CFD8DC',
  'Investments':     '#AED581',
  'Savings':         '#C5E1A5',
  'Loan Payment':    '#FFCC02',
  'Credit Card':     '#FFA726',
  'Bank Fees':       '#BDBDBD',
  'Payments':        '#90A4AE',
  // Cash / fallback
  'Cash & ATM':      '#A5D6A7',
  'Other':           '#B0BEC5',
}

export function catColor(category: string): string {
  return CAT_COLORS[category] ?? '#B0BEC5'
}

export { CAT_COLORS }
