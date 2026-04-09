import { cn } from '@/lib/utils'

type Variant = 'green' | 'blue' | 'amber' | 'red' | 'grey' | 'purple' | 'indigo'

const variants: Record<Variant, string> = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  grey: 'bg-slate-100 text-slate-600',
  purple: 'bg-purple-100 text-purple-800',
  indigo: 'bg-indigo-100 text-indigo-800',
}

export function Badge({
  label,
  variant = 'grey',
  className,
}: {
  label: string
  variant?: Variant
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  )
}

// ─── Semantic helpers ─────────────────────────────────────────────────────────

export function ProspectStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    NEW: { label: 'New', variant: 'blue' },
    CONTACTED: { label: 'Contacted', variant: 'indigo' },
    MEETING_ARRANGED: { label: 'Meeting Arranged', variant: 'purple' },
    PROPOSAL_SENT: { label: 'Proposal Sent', variant: 'amber' },
    ENGAGED: { label: 'Engaged', variant: 'green' },
    LOST: { label: 'Lost', variant: 'red' },
  }
  const cfg = map[status] ?? { label: status, variant: 'grey' as Variant }
  return <Badge label={cfg.label} variant={cfg.variant} />
}

export function OnboardingStageBadge({ stage }: { stage: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    INITIAL_CONTACT: { label: 'Initial Contact', variant: 'grey' },
    AML: { label: 'AML / KYC', variant: 'amber' },
    ENGAGEMENT_LETTER: { label: 'Engagement Letter', variant: 'blue' },
    HMRC_SETUP: { label: 'HMRC Setup', variant: 'indigo' },
    SOFTWARE_SETUP: { label: 'Software Setup', variant: 'purple' },
    COMPLETED: { label: 'Completed', variant: 'green' },
  }
  const cfg = map[stage] ?? { label: stage, variant: 'grey' as Variant }
  return <Badge label={cfg.label} variant={cfg.variant} />
}

export function HMRCStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    NOT_STARTED: { label: 'Not Started', variant: 'grey' },
    FORM_SENT: { label: '64-8 Sent', variant: 'blue' },
    PENDING_HMRC: { label: 'Pending HMRC', variant: 'amber' },
    AUTHORISED: { label: 'Authorised', variant: 'green' },
    REJECTED: { label: 'Rejected', variant: 'red' },
    EXPIRED: { label: 'Expired', variant: 'red' },
  }
  const cfg = map[status] ?? { label: status, variant: 'grey' as Variant }
  return <Badge label={cfg.label} variant={cfg.variant} />
}

export function TaxReturnStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    NOT_STARTED: { label: 'Not Started', variant: 'grey' },
    INFO_REQUESTED: { label: 'Info Requested', variant: 'amber' },
    INFO_RECEIVED: { label: 'Info Received', variant: 'blue' },
    IN_PROGRESS: { label: 'In Progress', variant: 'indigo' },
    REVIEW: { label: 'In Review', variant: 'purple' },
    SENT_TO_CLIENT: { label: 'Sent to Client', variant: 'amber' },
    CLIENT_APPROVED: { label: 'Client Approved', variant: 'blue' },
    FILED: { label: 'Filed', variant: 'green' },
    OVERDUE: { label: 'Overdue', variant: 'red' },
  }
  const cfg = map[status] ?? { label: status, variant: 'grey' as Variant }
  return <Badge label={cfg.label} variant={cfg.variant} />
}

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    LOW: { label: 'Low', variant: 'grey' },
    MEDIUM: { label: 'Medium', variant: 'blue' },
    HIGH: { label: 'High', variant: 'amber' },
    URGENT: { label: 'Urgent', variant: 'red' },
  }
  const cfg = map[priority] ?? { label: priority, variant: 'grey' as Variant }
  return <Badge label={cfg.label} variant={cfg.variant} />
}

export function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    TODO: { label: 'To Do', variant: 'grey' },
    IN_PROGRESS: { label: 'In Progress', variant: 'blue' },
    DONE: { label: 'Done', variant: 'green' },
    CANCELLED: { label: 'Cancelled', variant: 'red' },
  }
  const cfg = map[status] ?? { label: status, variant: 'grey' as Variant }
  return <Badge label={cfg.label} variant={cfg.variant} />
}

export function ClientTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    INDIVIDUAL: { label: 'Individual', variant: 'grey' },
    SOLE_TRADER: { label: 'Sole Trader', variant: 'blue' },
    PARTNERSHIP: { label: 'Partnership', variant: 'indigo' },
    LIMITED_COMPANY: { label: 'Ltd Company', variant: 'purple' },
    LLP: { label: 'LLP', variant: 'amber' },
    TRUST: { label: 'Trust', variant: 'green' },
  }
  const cfg = map[type] ?? { label: type, variant: 'grey' as Variant }
  return <Badge label={cfg.label} variant={cfg.variant} />
}
