// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number | null | undefined, decimals = 0): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatCurrencyPrecise(amount: number | null | undefined): string {
  if (amount == null) return '—'
  // Show pence only if not a whole number
  const hasDecimals = amount % 1 !== 0
  return formatCurrency(amount, hasDecimals ? 2 : 0)
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── String helpers ───────────────────────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

// ─── Business type labels ─────────────────────────────────────────────────────

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  SOLE_TRADER:     'Sole Trader',
  PARTNERSHIP:     'Partnership',
  LIMITED_COMPANY: 'Limited Company',
  INDIVIDUAL:      'Individual (SA only)',
}

export const BUSINESS_TYPE_SHORT: Record<string, string> = {
  SOLE_TRADER:     'Sole Trader',
  PARTNERSHIP:     'Partnership',
  LIMITED_COMPANY: 'Ltd Company',
  INDIVIDUAL:      'Individual',
}

// ─── Quote status ─────────────────────────────────────────────────────────────

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT:    'Draft',
  SENT:     'Sent',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  ARCHIVED: 'Archived',
}

export const QUOTE_STATUS_COLOURS: Record<string, string> = {
  DRAFT:    'bg-slate-100 text-slate-700',
  SENT:     'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
  ARCHIVED: 'bg-slate-100 text-slate-500',
}

// ─── Add-on category labels ───────────────────────────────────────────────────

export const ADDON_CATEGORY_LABELS: Record<string, string> = {
  VAT:        'VAT',
  PAYROLL:    'Payroll',
  BOOKKEEPING:'Bookkeeping',
  CIS:        'Construction (CIS)',
  SOFTWARE:   'Software',
  MANAGEMENT: 'Management Accounts & Reporting',
  TAX:        'Tax Returns',
  GENERAL:    'Other Services',
}

export const ONEOFF_CATEGORY_LABELS: Record<string, string> = {
  HMRC:             'HMRC Registrations',
  COMPANIES_HOUSE:  'Companies House',
  ADVISORY:         'Advisory & Planning',
  GENERAL:          'Other',
}
