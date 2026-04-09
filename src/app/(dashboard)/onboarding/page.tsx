'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import { OnboardingStageBadge, ClientTypeBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import type { OnboardingWithClient } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STAGE_OPTIONS = [
  ['INITIAL_CONTACT', 'Initial Contact'],
  ['AML', 'AML / KYC'],
  ['ENGAGEMENT_LETTER', 'Engagement Letter'],
  ['HMRC_SETUP', 'HMRC Setup'],
  ['SOFTWARE_SETUP', 'Software Setup'],
  ['COMPLETED', 'Completed'],
]

const AML_OPTIONS = [
  ['PENDING', 'Pending'],
  ['IN_PROGRESS', 'In Progress'],
  ['COMPLETED', 'Completed'],
  ['FAILED', 'Failed'],
]

export default function OnboardingPage() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [editing, setEditing] = useState<OnboardingWithClient | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (stageFilter) params.set('stage', stageFilter)

  const { data: records = [], mutate } = useSWR<OnboardingWithClient[]>(
    `/api/onboarding?${params}`,
    fetcher
  )

  function openEdit(r: OnboardingWithClient) {
    setEditing(r)
    setForm({
      stage: r.stage,
      amlStatus: r.amlStatus,
      amlCompletedDate: r.amlCompletedDate
        ? new Date(r.amlCompletedDate).toISOString().split('T')[0]
        : '',
      idVerified: r.idVerified,
      addressVerified: r.addressVerified,
      amlNotes: r.amlNotes ?? '',
      engagementLetterSent: r.engagementLetterSent
        ? new Date(r.engagementLetterSent).toISOString().split('T')[0]
        : '',
      engagementLetterSigned: r.engagementLetterSigned
        ? new Date(r.engagementLetterSigned).toISOString().split('T')[0]
        : '',
      termsAccepted: r.termsAccepted,
      hmrcOnlineSetup: r.hmrcOnlineSetup,
      agentAuthRequested: r.agentAuthRequested,
      softwareSetup: r.softwareSetup,
      softwareName: r.softwareName ?? '',
      conflictCheckDone: r.conflictCheckDone,
      ddSetup: r.ddSetup,
      completedAt: r.completedAt
        ? new Date(r.completedAt).toISOString().split('T')[0]
        : '',
      notes: r.notes ?? '',
    })
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    await fetch(`/api/onboarding/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setEditing(null)
    mutate()
  }

  function pct(r: OnboardingWithClient): number {
    const checks = [
      r.conflictCheckDone,
      r.amlStatus === 'COMPLETED',
      r.idVerified,
      r.addressVerified,
      !!r.engagementLetterSent,
      !!r.engagementLetterSigned,
      r.termsAccepted,
      r.hmrcOnlineSetup,
      r.agentAuthRequested,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Client Onboarding</h1>
          <p className="text-sm text-slate-500 mt-1">
            {records.filter((r) => r.stage !== 'COMPLETED').length} clients in progress
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="input-base w-52"
        >
          <option value="">All Stages</option>
          {STAGE_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {records.length === 0 ? (
          <EmptyState
            icon={ClipboardDocumentCheckIcon}
            title="No onboarding records"
            description="Onboarding records are created automatically when you add a new client."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Stage</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">AML</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Eng. Letter</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">HMRC Setup</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Progress</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => {
                const progress = pct(r)
                return (
                  <tr key={r.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {r.client.companyName ?? r.client.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">{r.client.ref}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ClientTypeBadge type={r.client.clientType} />
                    </td>
                    <td className="px-4 py-3">
                      <OnboardingStageBadge stage={r.stage} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.amlStatus === 'COMPLETED'
                            ? 'text-green-600'
                            : r.amlStatus === 'FAILED'
                            ? 'text-red-600'
                            : 'text-amber-600'
                        }
                      >
                        {r.amlStatus === 'COMPLETED' ? '✓' : r.amlStatus === 'FAILED' ? '✗' : '○'}{' '}
                        {r.amlStatus === 'COMPLETED'
                          ? formatDate(r.amlCompletedDate)
                          : r.amlStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.engagementLetterSigned ? (
                        <span className="text-green-600">✓ Signed {formatDate(r.engagementLetterSigned)}</span>
                      ) : r.engagementLetterSent ? (
                        <span className="text-amber-600">Sent {formatDate(r.engagementLetterSent)}</span>
                      ) : (
                        <span className="text-slate-400">Not sent</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.hmrcOnlineSetup ? (
                        <span className="text-green-600">✓ Done</span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Onboarding — ${editing?.client.companyName ?? editing?.client.name ?? ''}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Stage & Overall */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Overall Stage
              </label>
              <select
                className="input-base"
                value={form.stage as string}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                {STAGE_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Completed Date
              </label>
              <input
                type="date"
                className="input-base"
                value={form.completedAt as string}
                onChange={(e) => setForm({ ...form, completedAt: e.target.value })}
              />
            </div>
          </div>

          {/* Conflict Check / DD */}
          <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
            <h3 className="font-medium text-slate-800 text-sm">Practice Management</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.conflictCheckDone as boolean}
                  onChange={(e) => setForm({ ...form, conflictCheckDone: e.target.checked })}
                  className="rounded"
                />
                Conflict of interest check done
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.ddSetup as boolean}
                  onChange={(e) => setForm({ ...form, ddSetup: e.target.checked })}
                  className="rounded"
                />
                Direct Debit / payment setup
              </label>
            </div>
          </div>

          {/* AML */}
          <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
            <h3 className="font-medium text-slate-800 text-sm">AML / KYC Checks</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">AML Status</label>
                <select
                  className="input-base"
                  value={form.amlStatus as string}
                  onChange={(e) => setForm({ ...form, amlStatus: e.target.value })}
                >
                  {AML_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">AML Completed Date</label>
                <input
                  type="date"
                  className="input-base"
                  value={form.amlCompletedDate as string}
                  onChange={(e) => setForm({ ...form, amlCompletedDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.idVerified as boolean}
                  onChange={(e) => setForm({ ...form, idVerified: e.target.checked })}
                  className="rounded"
                />
                ID verified (passport / driving licence)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.addressVerified as boolean}
                  onChange={(e) => setForm({ ...form, addressVerified: e.target.checked })}
                  className="rounded"
                />
                Address verified (utility bill / bank statement)
              </label>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">AML Notes</label>
              <input
                className="input-base"
                value={form.amlNotes as string}
                onChange={(e) => setForm({ ...form, amlNotes: e.target.value })}
                placeholder="e.g. PEP check, source of funds…"
              />
            </div>
          </div>

          {/* Engagement Letter */}
          <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
            <h3 className="font-medium text-slate-800 text-sm">Engagement Letter & Terms</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Letter Sent</label>
                <input
                  type="date"
                  className="input-base"
                  value={form.engagementLetterSent as string}
                  onChange={(e) => setForm({ ...form, engagementLetterSent: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Letter Signed</label>
                <input
                  type="date"
                  className="input-base"
                  value={form.engagementLetterSigned as string}
                  onChange={(e) => setForm({ ...form, engagementLetterSigned: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.termsAccepted as boolean}
                onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
                className="rounded"
              />
              Terms of business accepted
            </label>
          </div>

          {/* HMRC / Software */}
          <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
            <h3 className="font-medium text-slate-800 text-sm">HMRC & Software Setup</h3>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.hmrcOnlineSetup as boolean}
                  onChange={(e) => setForm({ ...form, hmrcOnlineSetup: e.target.checked })}
                  className="rounded"
                />
                HMRC Online Services access set up
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.agentAuthRequested as boolean}
                  onChange={(e) => setForm({ ...form, agentAuthRequested: e.target.checked })}
                  className="rounded"
                />
                Agent authorisation (64-8) requested
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.softwareSetup as boolean}
                  onChange={(e) => setForm({ ...form, softwareSetup: e.target.checked })}
                  className="rounded"
                />
                Bookkeeping software set up
              </label>
            </div>
            {(form.softwareSetup as boolean) && (
              <div>
                <label className="block text-xs text-slate-600 mb-1">Software Name</label>
                <input
                  className="input-base"
                  value={form.softwareName as string}
                  onChange={(e) => setForm({ ...form, softwareName: e.target.value })}
                  placeholder="e.g. QuickBooks, Xero, FreeAgent…"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={3}
              className="input-base"
              value={form.notes as string}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setEditing(null)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
