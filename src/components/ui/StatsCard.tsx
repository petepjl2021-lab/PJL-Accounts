import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: number | string
  icon: ComponentType<{ className?: string }>
  iconBg?: string
  iconColor?: string
  subtext?: string
  urgent?: boolean
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconBg = 'bg-blue-100',
  iconColor = 'text-blue-600',
  subtext,
  urgent,
}: StatsCardProps) {
  return (
    <div className={cn('card p-5', urgent && 'border-red-200 bg-red-50')}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-sm font-medium', urgent ? 'text-red-600' : 'text-slate-500')}>
            {label}
          </p>
          <p className={cn('text-3xl font-bold mt-1', urgent ? 'text-red-700' : 'text-slate-900')}>
            {value}
          </p>
          {subtext && (
            <p className={cn('text-xs mt-1', urgent ? 'text-red-500' : 'text-slate-400')}>
              {subtext}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', urgent ? 'bg-red-100' : iconBg)}>
          <Icon className={cn('w-6 h-6', urgent ? 'text-red-600' : iconColor)} />
        </div>
      </div>
    </div>
  )
}
