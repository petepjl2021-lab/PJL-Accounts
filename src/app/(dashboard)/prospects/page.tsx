'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PlusIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { ProspectStatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  formatDate,
  formatCurrency,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_STATUS_LABELS,
} from '@/lib/utils'
import type { ProspectWithUser } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const SERVICE_OPTIONS = [
  'Self Assessment',
  'Corporation Tax',
  'Bookkeeping',
  'Payroll / PAYE',
  'VAT',
  'Accounts Preparation',
  'Tax Planning',
  'CIS',
  'Other',
]

const STATUS_OPTIONS = Object.entries(PROSPECT_STATUS_LABELS)
const SOURCE_OPTIONS = Object.entries(PROSPECT_SOURCE_LABELS)

function defaultForm() {
  return {
    name: '',
    companyName: '',
    email: '',
    phone: '',
    source: 'OTHER',
    serviceTypes: [] as string[],
    status: 'NEW',
    estimatedFees: '',
    notes: '',
    nextAction: '',
    nextActionDate: '',
    lostReason: '',
    assignedToId: '',
  }
}

export default function ProspectsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ProspectWithUser | null>(null)
  const [deleting, setDeleting] = useState<ProspectWithUser | null>(null)
  const [form, setForm] = useState(defaultForm())
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter) params.set('status', statusFilter)

  const { data: prospects = [], mutate } = useSWR<ProspectWithUser[]>(
    `/api/prospects?${params}`,
    fetcher
  )
  const { data: users = [] } = useSWR('/api/users', fetcher)

  function openNew() {
    setForm(defaultForm())
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(p: ProspectWithUser) {
    setForm({
      name: p.name,
      companyName: p.companyName ?? '',
      email: p.email ?? '',
      phone: p.phone ?? '',
      source: p.source,
      serviceTypes: JSON.parse(p.serviceTypes ?? '[]'),
      status: p.status,
      estimatedFees: p.estimatedFees?.toString() ?? '',
      notes: p.notes ?? '',
      nextAction: p.nextAction ?? '',
      nextActionDate: p.nextActionDate
        ? new Date(p.nextActionDate).toISOString().split('T')[0]
        : '',
      lostReason: p.lostReason ?? '',
      assignedToId: p.assignedToId ?? '',
    })
    setEditing(p)
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    const url = editing ? `/api/prospects/${editing.id}` : '/api/prospects'
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
    await fetch(`/api/prospects/${deleting.id}`, { method: 'DELETE' })
    setDeleting(null)
    mutate()
  }

  function toggleService(s: string) {
    setForm((f) => ({
      ...f,
      serviceTypes: f.serviceTypes.includes(s)
        ? f.serviceTypes.filter((x) => x !== s)
        : [...f.serviceTypes, s],
    }))
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Prospect Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">
            {prospects.length} prospect{prospects.length !== 1 ? 's' : ''} in pipeline
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Prospect
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search prospects…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base w-48"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {prospects.length === 0 ? (
          <EmptyState
            icon={UserPlusIcon}
            title="No prospects found"
            description="Add your first prospect to start tracking your pipeline."
            action={
              <button onClick={openNew} className="btn-primary">
                <PlusIcon className="w-4 h-4" /> Add Prospect
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Services</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Est. Fees</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Next Action</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Assigned</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prospects.map((p) => (
                <tr key={p.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    {p.companyName && (
                      <p className="text-xs text-slate-500">{p.companyName}</p>
                    )}
                    {p.email && <p className="text-xs text-slate-400">{p.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {PROSPECT_SOURCE_LABELS[p.source] ?? p.source}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">
                    {(JSON.parse(p.serviceTypes ?? '[]') as string[]).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ProspectStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(p.estimatedFees)}
                  </td>
                  <td className="px-4 py-3">
                    {p.nextAction ? (
                      <div>
                        <p className="text-slate-700 text-xs">{p.nextAction}</p>
                        {p.nextActionDate && (
                          <p className="text-slate-400 text-xs">{formatDate(p.nextActionDate)}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.assignedTo?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(p)}
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
        title={editing ? 'Edit Prospect' : 'Add Prospect'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input-base"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company Name
              </label>
              <input
                className="input-base"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                className="input-base"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                className="input-base"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select
                className="input-base"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                {SOURCE_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estimated Annual Fees (£)
              </label>
              <input
                type="number"
                className="input-base"
                value={form.estimatedFees}
                onChange={(e) => setForm({ ...form, estimatedFees: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assigned To
              </label>
              <select
                className="input-base"
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {users.map((u: { id: string; name: string }) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Services Required
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.serviceTypes.includes(s)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Next Action */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Next Action
              </label>
              <input
                className="input-base"
                value={form.nextAction}
                onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
                placeholder="e.g. Send proposal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Next Action Date
              </label>
              <input
                type="date"
                className="input-base"
                value={form.nextActionDate}
                onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })}
              />
            </div>
          </div>

          {form.status === 'LOST' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lost Reason
              </label>
              <input
                className="input-base"
                value={form.lostReason}
                onChange={(e) => setForm({ ...form, lostReason: e.target.value })}
              />
            </div>
          )}

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
          <button onClick={handleSave} className="btn-primary" disabled={saving || !form.name}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Prospect'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Prospect"
        message={`Are you sure you want to delete ${deleting?.name}? This cannot be undone.`}
      />
    </div>
  )
}
