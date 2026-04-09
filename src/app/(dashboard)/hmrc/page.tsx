'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PlusIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { HMRCStatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, HMRC_TYPE_LABELS, HMRC_STATUS_LABELS } from '@/lib/utils'
import type { HMRCAuthWithClient } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const TYPE_OPTIONS = Object.entries(HMRC_TYPE_LABELS)
const STATUS_OPTIONS = Object.entries(HMRC_STATUS_LABELS)

function defaultForm() {
  return {
    clientId: '',
    type: 'SELF_ASSESSMENT',
    status: 'NOT_STARTED',
    form64_8Sent: '',
    authorisedDate: '',
    expiryDate: '',
    agentRef: '',
    notes: '',
  }
}

export default function HMRCPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<HMRCAuthWithClient | null>(null)
  const [deleting, setDeleting] = useState<HMRCAuthWithClient | null>(null)
  const [form, setForm] = useState(defaultForm())
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter) params.set('status', statusFilter)
  if (typeFilter) params.set('type', typeFilter)

  const { data: records = [], mutate } = useSWR<HMRCAuthWithClient[]>(
    `/api/hmrc?${params}`,
    fetcher
  )
  const { data: clients = [] } = useSWR('/api/clients', fetcher)

  function openNew() {
    setForm(defaultForm())
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(r: HMRCAuthWithClient) {
    setForm({
      clientId: r.clientId,
      type: r.type,
      status: r.status,
      form64_8Sent: r.form64_8Sent
        ? new Date(r.form64_8Sent).toISOString().split('T')[0]
        : '',
      authorisedDate: r.authorisedDate
        ? new Date(r.authorisedDate).toISOString().split('T')[0]
        : '',
      expiryDate: r.expiryDate
        ? new Date(r.expiryDate).toISOString().split('T')[0]
        : '',
      agentRef: r.agentRef ?? '',
      notes: r.notes ?? '',
    })
    setEditing(r)
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    const url = editing ? `/api/hmrc/${editing.id}` : '/api/hmrc'
    const method = editing ? 'PATCH' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    mutate()
  }

  async function handleDelete() {
    if (!deleting) return
    await fetch(`/api/hmrc/${deleting.id}`, { method: 'DELETE' })
    setDeleting(null)
    mutate()
  }

  const pending = records.filter((r) => ['FORM_SENT', 'PENDING_HMRC'].includes(r.status)).length
  const authorised = records.filter((r) => r.status === 'AUTHORISED').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">HMRC Authorisation Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">
            {authorised} authorised · {pending} pending
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Authorisation
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-base w-52"
        >
          <option value="">All Types</option>
          {TYPE_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base w-44"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {records.length === 0 ? (
          <EmptyState
            icon={IdentificationIcon}
            title="No authorisation records"
            description="Track 64-8 authorisations for Self Assessment, PAYE, Corporation Tax, VAT and more."
            action={
              <button onClick={openNew} className="btn-primary">
                <PlusIcon className="w-4 h-4" /> Add Authorisation
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Auth Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">64-8 Sent</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Authorised</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Expires</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Agent Ref</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {r.client.companyName ?? r.client.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">{r.client.ref}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {HMRC_TYPE_LABELS[r.type] ?? r.type}
                  </td>
                  <td className="px-4 py-3">
                    <HMRCStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.form64_8Sent)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.authorisedDate)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.expiryDate)}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                    {r.agentRef ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(r)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Authorisation' : 'Add HMRC Authorisation'}
        size="md"
      >
        <div className="space-y-4">
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                className="input-base"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              >
                <option value="">Select client…</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.ref} — {c.companyName ?? c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {!editing && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Authorisation Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="input-base"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {TYPE_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                className="input-base"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                64-8 Form Sent
              </label>
              <input
                type="date"
                className="input-base"
                value={form.form64_8Sent}
                onChange={(e) => setForm({ ...form, form64_8Sent: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Authorised Date
              </label>
              <input
                type="date"
                className="input-base"
                value={form.authorisedDate}
                onChange={(e) => setForm({ ...form, authorisedDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
              <input
                type="date"
                className="input-base"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Agent Ref</label>
              <input
                className="input-base"
                value={form.agentRef}
                onChange={(e) => setForm({ ...form, agentRef: e.target.value })}
                placeholder="Agent reference number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={3}
              className="input-base"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={saving || (!editing && !form.clientId)}
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Authorisation'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Authorisation"
        message={`Remove ${HMRC_TYPE_LABELS[deleting?.type ?? '']} for ${
          deleting?.client.companyName ?? deleting?.client.name ?? ''
        }?`}
      />
    </div>
  )
}
