import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
  className?: string
}

const variants: Record<string, string> = {
  default: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-sky-100 text-sky-700',
  muted:   'bg-slate-100 text-slate-600',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant] ?? variants.default,
      className
    )}>
      {children}
    </span>
  )
}

export function QuoteStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    DRAFT:    { label: 'Draft',    variant: 'muted'   },
    SENT:     { label: 'Sent',     variant: 'info'    },
    ACCEPTED: { label: 'Accepted', variant: 'success' },
    DECLINED: { label: 'Declined', variant: 'danger'  },
    ARCHIVED: { label: 'Archived', variant: 'muted'   },
  }
  const cfg = map[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
