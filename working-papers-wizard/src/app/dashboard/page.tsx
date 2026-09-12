'use client'

import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'
import { Client } from '@/types'
import ClientFormModal from '@/components/ClientFormModal'
import StatusPill from '@/components/StatusPill'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data: clients, mutate, isLoading } = useSWR<Client[]>('/api/clients', fetcher)
  const [showNew, setShowNew] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = (clients || []).filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
  const totalClients = clients?.length || 0
  const jobsInProgress = (clients || []).reduce(
    (sum, c) => sum + (c.jobs || []).filter((j) => j.status === 'IN_PROGRESS').length,
    0
  )
  const jobsCompleted = (clients || []).reduce(
    (sum, c) => sum + (c.jobs || []).filter((j) => j.status === 'COMPLETED').length,
    0
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Your LTD company accounts working papers, all in one place.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          + New Client
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Clients" value={totalClients} />
        <StatCard label="Jobs in progress" value={jobsInProgress} accent="amber" />
        <StatCard label="Jobs completed" value={jobsCompleted} accent="green" />
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <input
            className="input-base max-w-xs"
            placeholder="Search clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No clients yet. Click <span className="font-medium">+ New Client</span> to add your first one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Company No.</th>
                <th className="px-4 py-2 font-medium">Standard</th>
                <th className="px-4 py-2 font-medium">Jobs</th>
                <th className="px-4 py-2 font-medium">Latest Year End</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const latest = c.jobs?.[0]
                return (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.companyNumber || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.accountingStandard}</td>
                    <td className="px-4 py-3 text-slate-600">{c._count?.jobs ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {latest ? new Date(latest.yearEndDate).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {latest ? <StatusPill status={latest.status} /> : <span className="text-slate-400">No jobs</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/clients/${c.id}`} className="text-brand-700 hover:text-brand-800 font-medium">
                        Open →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <ClientFormModal
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false)
            mutate()
          }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'amber' | 'green' }) {
  const color = accent === 'amber' ? 'text-amber-600' : accent === 'green' ? 'text-emerald-600' : 'text-slate-900'
  return (
    <div className="card p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${color}`}>{value}</div>
    </div>
  )
}
