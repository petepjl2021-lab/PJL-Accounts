'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { TaxReturnStatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  formatDate,
  formatCurrency,
  isOverdue,
  taxYearOptions,
  currentTaxYear,
  TAX_RETURN_TYPE_LABELS,
  TAX_RETURN_STATUS_LABELS,
} from '@/lib/utils'
import type { TaxReturnWithClient } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const TYPE_OPTIONS = Object.entries(TAX_RETURN_TYPE_LABELS)
const STATUS_OPTIONS = Object.entries(TAX_RETURN_STATUS_LABELS)

function defaultForm() {
  return {
    clientId: '',
    type: 'SA100',
    taxYear: currentTaxYear(),
    dueDate: '',
    status: 'NOT_STARTED',
    infoRequestedDate: '',
    infoReceivedDate: '',
    preparedDate: '',
    reviewedDate: '',
    sentToClientDate: '',
    clientApprovedDate: '',
    filedDate: '',
    hmrcReference: '',
    taxChargeable: '',
    taxPayable: '',
    paymentDueDate: '',
    notes: '',
    assignedToId: '',
  }
}

export default function TaxReturnsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TaxReturnWithClient | null>(null)
  const [deleting, setDeleting] = useState<TaxReturnWithClient | null>(null)
  const [form, setForm] = useState(defaultForm())
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter) params.set('status', statusFilter)
  if (typeFilter) params.set('type', typeFilter)
  if (yearFilter) params.set('taxYear', yearFilter)

  const { data: records = [], mutate } = useSWR<TaxReturnWithClient[]>(
    `/api/tax-returns?${params}`,
    fetcher
  )
  const { data: clients = [] } = useSWR('/api/clients', fetcher)
  const { data: users = [] } = useSWR('/api/users', fetcher)

  const years = taxYearOptions(6)

  function openNew() {
    setForm(defaultForm())
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(r: TaxReturnWithClient) {
    const d = (v: string | Date | null | undefined) =>
      v ? new Date(v).toISOString().split('T')[0] : ''
    setForm({
      clientId: r.clientId,
      type: r.type,
      taxYear: r.taxYear,
      dueDate: d(r.dueDate),
      status: r.status,
      infoRequestedDate: d(r.infoRequestedDate),
      infoReceivedDate: d(r.infoReceivedDate),
      preparedDate: d(r.preparedDate),
      reviewedDate: d(r.reviewedDate),
      sentToClientDate: d(r.sentToClientDate),
      clientApprovedDate: d(r.clientApprovedDate),
      filedDate: d(r.filedDate),
      hmrcReference: r.hmrcReference ?? '',
      taxChargeable: r.taxChargeable?.toString() ?? '',
      taxPayable: r.taxPayable?.toString() ?? '',
      paymentDueDate: d(r.paymentDueDate),
      notes: r.notes ?? '',
      assignedToId: r.assignedToId ?? '',
    })
    setEditing(r)
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    const url = editing ? `/api/tax-returns/${editing.id}` : '/api/tax-returns'
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
    await fetch(`/api/tax-returns/${deleting.id}`, { method: 'DELETE' })
    setDeleting(null)
    mutate()
  }

  const overdue = records.filter((r) => isOverdue(r.dueDate) && r.status !== 'FILED').length
  const filed = records.filter((r) => r.status === 'FILED').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tax Return Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">
            {records.length} returns · {filed} filed · {overdue > 0 && (
              <span className="text-red-600 font-medium">{overdue} overdue</span>
            )}
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Return
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" />
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="input-base w-36"
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
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
            icon={DocumentTextIcon}
            title="No tax returns found"
            description="Add SA100, CT600, VAT returns and more. Track every stage from info request to filing."
            action={
              <button onClick={openNew} className="btn-primary">
                <PlusIcon className="w-4 h-4" /> Add Return
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Return</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Tax Year</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Due Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Filed</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">HMRC Ref</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Assigned</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => {
                const overdue = isOverdue(r.dueDate) && r.status !== 'FILED'
                return (
                  <tr key={r.id} className={`table-row-hover ${overdue ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {r.client.companyName ?? r.client.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">{r.client.ref}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {TAX_RETURN_TYPE_LABELS[r.type] ?? r.type}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.taxYear}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          overdue ? 'text-red-600 font-semibold' : 'text-slate-600'
                        }
                      >
                        {formatDate(r.dueDate)}
                        {overdue && ' ⚠'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TaxReturnStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(r.filedDate)}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {r.hmrcReference ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.assignedTo?.name ?? '—'}</td>
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
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Tax Return' : 'Add Tax Return'}
        size="xl"
      >
        <div className="space-y-4">
          {/* Basic */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Return Type <span className="text-red-500">*</span>
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tax Year <span className="text-red-500">*</span>
              </label>
              <select
                className="input-base"
                value={form.taxYear}
                onChange={(e) => setForm({ ...form, taxYear: e.target.value })}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Filing Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input-base"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
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
                Assigned To
              </label>
              <select
                className="input-base"
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress dates */}
          <div className="border rounded-lg p-4 bg-slate-50">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Progress Dates</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['infoRequestedDate', 'Info Requested'],
                ['infoReceivedDate', 'Info Received'],
                ['preparedDate', 'Prepared'],
                ['reviewedDate', 'Reviewed'],
                ['sentToClientDate', 'Sent to Client'],
                ['clientApprovedDate', 'Client Approved'],
                ['filedDate', 'Filed with HMRC'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-slate-600 mb-1">{label}</label>
                  <input
                    type="date"
                    className="input-base text-xs"
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tax / filing details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                HMRC Reference
              </label>
              <input
                className="input-base"
                value={form.hmrcReference}
                onChange={(e) => setForm({ ...form, hmrcReference: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tax Chargeable (£)
              </label>
              <input
                type="number"
                className="input-base"
                value={form.taxChargeable}
                onChange={(e) => setForm({ ...form, taxChargeable: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tax Payable (£)
              </label>
              <input
                type="number"
                className="input-base"
                value={form.taxPayable}
                onChange={(e) => setForm({ ...form, taxPayable: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Due Date
              </label>
              <input
                type="date"
                className="input-base"
                value={form.paymentDueDate}
                onChange={(e) => setForm({ ...form, paymentDueDate: e.target.value })}
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
            disabled={saving || (!editing && (!form.clientId || !form.dueDate))}
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Return'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Tax Return"
        message={`Delete ${TAX_RETURN_TYPE_LABELS[deleting?.type ?? '']} ${deleting?.taxYear} for ${
          deleting?.client.companyName ?? deleting?.client.name ?? ''
        }?`}
      />
    </div>
  )
}
