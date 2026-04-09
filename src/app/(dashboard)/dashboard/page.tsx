'use client'

import useSWR from 'swr'
import Link from 'next/link'
import {
  UserGroupIcon,
  UserPlusIcon,
  IdentificationIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { StatsCard } from '@/components/ui/StatsCard'
import { ProspectStatusBadge, TaxReturnStatusBadge } from '@/components/ui/Badge'
import { formatDate, isOverdue } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data, isLoading } = useSWR('/api/dashboard', fetcher, { refreshInterval: 60000 })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const { stats, recentProspects = [], upcomingDeadlines = [] } = data ?? {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your practice workload</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Active Clients"
          value={stats?.activeClients ?? 0}
          icon={UserGroupIcon}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          label="Prospects in Pipeline"
          value={stats?.prospects ?? 0}
          icon={UserPlusIcon}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatsCard
          label="HMRC Auths Pending"
          value={stats?.pendingHMRCAuths ?? 0}
          icon={IdentificationIcon}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatsCard
          label="Onboarding in Progress"
          value={stats?.inProgressOnboarding ?? 0}
          icon={ClipboardDocumentCheckIcon}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <StatsCard
          label="Returns Due (30 days)"
          value={stats?.taxReturnsDueSoon ?? 0}
          icon={DocumentTextIcon}
          iconBg="bg-cyan-100"
          iconColor="text-cyan-600"
        />
        <StatsCard
          label="Overdue Returns"
          value={stats?.overdueReturns ?? 0}
          icon={ExclamationTriangleIcon}
          urgent={stats?.overdueReturns > 0}
        />
        <StatsCard
          label="Open Tasks"
          value={stats?.openTasks ?? 0}
          icon={CheckCircleIcon}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          label="Urgent Tasks"
          value={stats?.urgentTasks ?? 0}
          icon={CheckCircleIcon}
          urgent={stats?.urgentTasks > 0}
        />
      </div>

      {/* Bottom two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Prospects */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Prospects</h2>
            <Link href="/prospects" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentProspects.length === 0 && (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No prospects yet.</p>
            )}
            {recentProspects.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.name}</p>
                  {p.companyName && (
                    <p className="text-xs text-slate-500">{p.companyName}</p>
                  )}
                </div>
                <ProspectStatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Upcoming Deadlines</h2>
            <Link href="/tax-returns" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingDeadlines.length === 0 && (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No upcoming deadlines.</p>
            )}
            {upcomingDeadlines.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {r.client?.companyName ?? r.client?.name} — {r.type} {r.taxYear}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      isOverdue(r.dueDate) ? 'text-red-600 font-medium' : 'text-slate-500'
                    }`}
                  >
                    Due: {formatDate(r.dueDate)}
                    {isOverdue(r.dueDate) && ' · OVERDUE'}
                  </p>
                </div>
                <TaxReturnStatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
