// ─── Date helpers ──────────────────────────────────────────────────────────────

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── UK Tax year helpers ───────────────────────────────────────────────────────

export function currentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  // UK tax year ends 5 April
  if (month < 4 || (month === 4 && day <= 5)) {
    return `${year - 1}/${String(year).slice(2)}`
  }
  return `${year}/${String(year + 1).slice(2)}`
}

export function taxYearOptions(count = 5): string[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const currentYear = month < 4 || (month === 4 && day <= 5) ? year - 1 : year
  return Array.from({ length: count }, (_, i) => {
    const y = currentYear - i
    return `${y}/${String(y + 1).slice(2)}`
  })
}

// ─── SA100 filing deadline for a tax year ─────────────────────────────────────

export function sa100Deadline(taxYear: string): Date {
  // e.g. "2023/24" → 31 Jan 2025
  const endYear = parseInt('20' + taxYear.split('/')[1])
  return new Date(endYear, 0, 31) // 31 Jan
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── String helpers ───────────────────────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Status labels ────────────────────────────────────────────────────────────

export const PROSPECT_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  MEETING_ARRANGED: 'Meeting Arranged',
  PROPOSAL_SENT: 'Proposal Sent',
  ENGAGED: 'Engaged',
  LOST: 'Lost',
}

export const PROSPECT_SOURCE_LABELS: Record<string, string> = {
  REFERRAL: 'Referral',
  WEBSITE: 'Website',
  SOCIAL_MEDIA: 'Social Media',
  NETWORKING: 'Networking',
  ADVERTISEMENT: 'Advertisement',
  OTHER: 'Other',
}

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  SOLE_TRADER: 'Sole Trader',
  PARTNERSHIP: 'Partnership',
  LIMITED_COMPANY: 'Limited Company',
  LLP: 'LLP',
  TRUST: 'Trust',
}

export const ONBOARDING_STAGE_LABELS: Record<string, string> = {
  INITIAL_CONTACT: 'Initial Contact',
  AML: 'AML / KYC',
  ENGAGEMENT_LETTER: 'Engagement Letter',
  HMRC_SETUP: 'HMRC Setup',
  SOFTWARE_SETUP: 'Software Setup',
  COMPLETED: 'Completed',
}

export const HMRC_TYPE_LABELS: Record<string, string> = {
  SELF_ASSESSMENT: 'Self Assessment',
  PAYE: 'PAYE',
  CORPORATION_TAX: 'Corporation Tax',
  VAT: 'VAT',
  CIS: 'CIS',
  ITSA: 'ITSA (MTD)',
  SA_TRUST: 'SA — Trust',
  SA_PARTNERSHIP: 'SA — Partnership',
}

export const HMRC_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  FORM_SENT: '64-8 Sent',
  PENDING_HMRC: 'Pending HMRC',
  AUTHORISED: 'Authorised',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
}

export const TAX_RETURN_TYPE_LABELS: Record<string, string> = {
  SA100: 'SA100 (Personal)',
  SA800: 'SA800 (Partnership)',
  SA900: 'SA900 (Trust)',
  CT600: 'CT600 (Corporation Tax)',
  VAT_RETURN: 'VAT Return',
  P11D: 'P11D (Benefits)',
  P35: 'P35 (Employer Annual)',
}

export const TAX_RETURN_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  INFO_REQUESTED: 'Info Requested',
  INFO_RECEIVED: 'Info Received',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'In Review',
  SENT_TO_CLIENT: 'Sent to Client',
  CLIENT_APPROVED: 'Client Approved',
  FILED: 'Filed',
  OVERDUE: 'Overdue',
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}
