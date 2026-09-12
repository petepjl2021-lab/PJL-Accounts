'use client'

import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'
import { Client, Job } from '@/types'
import ClientFormModal from '@/components/ClientFormModal'
import NewJobModal from '@/components/NewJobModal'
import StatusPill from '@/components/StatusPill'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { data: client, mutate, isLoading } = useSWR<Client>(`/api/clients/${params.id}`, fetcher)
  const [showEdit, setShowEdit] = useState(false)
  const [showNewJob, setShowNewJob] = useState(false)

  if (isLoading) return <div className="text-slate-400 text-sm">Loading…</div>
  if (!client) return <div className="text-slate-400 text-sm">Client not found.</div>

  const jobs = client.jobs || []

  return (
    <div>
      <div className="text-sm text-slate-500 mb-2">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>{' '}
        / {client.name}
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{client.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {client.companyNumber ? `Company No. ${client.companyNumber} · ` : ''}
            {client.accountingStandard}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowEdit(true)}>
            Edit Client
          </button>
          <button className="btn-primary" onClick={() => setShowNewJob(true)}>
            + New Job
          </button>
        </div>
      </div>

      {client.folderPath && (
        <div className="text-xs text-slate-500 mb-4">
          Exports save to: <span className="font-mono">{client.folderPath}</span>
        </div>
      )}

      <div className="card">
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No jobs yet. Click <span className="font-medium">+ New Job</span> to start this year&rsquo;s working papers.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2 font-medium">Year End</th>
                <th className="px-4 py-2 font-medium">Prepared By</th>
                <th className="px-4 py-2 font-medium">Reviewed By</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Exported</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j: Job) => (
                <tr key={j.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {new Date(j.yearEndDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{j.preparedBy || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{j.reviewedBy || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={j.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {j.exportedAt ? new Date(j.exportedAt).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/jobs/${j.id}`} className="text-brand-700 hover:text-brand-800 font-medium">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showEdit && (
        <ClientFormModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false)
            mutate()
          }}
        />
      )}
      {showNewJob && <NewJobModal client={client} jobs={jobs} onClose={() => setShowNewJob(false)} />}
    </div>
  )
}
