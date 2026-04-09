'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { ClientTypeBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { CLIENT_TYPE_LABELS } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CLIENT_TYPE_OPTIONS = Object.entries(CLIENT_TYPE_LABELS)

function defaultForm() {
  return {
    name: '',
    companyName: '',
    clientType: 'INDIVIDUAL',
    email: '',
    phone: '',
    address: '',
    postcode: '',
    utr: '',
    nino: '',
    companyNo: '',
    vatNo: '',
    notes: '',
  }
}

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm())
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter) params.set('status', statusFilter)

  const { data: clients = [], mutate } = useSWR(`/api/clients?${params}`, fetcher)

  async function handleSave() {
    setSaving(true)
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    setForm(defaultForm())
    mutate()
  }

  const showNino = ['INDIVIDUAL', 'SOLE_TRADER'].includes(form.clientType)
  const showCompanyNo = ['LIMITED_COMPANY', 'LLP'].includes(form.clientType)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">{clients.length} clients</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base w-40"
        >
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {clients.length === 0 ? (
          <EmptyState
            icon={UserGroupIcon}
            title="No clients found"
            description="Add your first client to get started."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <PlusIcon className="w-4 h-4" /> Add Client
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Ref</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Tax Returns</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c: any) => (
                <tr key={c.id} className="table-row-hover">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.ref}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {c.companyName ?? c.name}
                    </p>
                    {c.companyName && (
                      <p className="text-xs text-slate-500">{c.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ClientTypeBadge type={c.clientType} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c._count?.taxReturns ?? 0}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${c.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Client Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Add New Client"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Client Type <span className="text-red-500">*</span>
              </label>
              <select
                className="input-base"
                value={form.clientType}
                onChange={(e) => setForm({ ...form, clientType: e.target.value })}
              >
                {CLIENT_TYPE_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {['LIMITED_COMPANY', 'LLP', 'PARTNERSHIP'].includes(form.clientType)
                  ? 'Company Name'
                  : 'Full Name'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                className="input-base"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            {['LIMITED_COMPANY', 'LLP', 'PARTNERSHIP'].includes(form.clientType) && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Primary Contact Name
                </label>
                <input
                  className="input-base"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Director / Partner name"
                />
              </div>
            )}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                UTR (Unique Taxpayer Ref)
              </label>
              <input
                className="input-base"
                value={form.utr}
                onChange={(e) => setForm({ ...form, utr: e.target.value })}
                placeholder="10 digit UTR"
              />
            </div>
            {showNino && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NI Number</label>
                <input
                  className="input-base"
                  value={form.nino}
                  onChange={(e) => setForm({ ...form, nino: e.target.value })}
                  placeholder="AB 12 34 56 C"
                />
              </div>
            )}
            {showCompanyNo && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Companies House No.
                </label>
                <input
                  className="input-base"
                  value={form.companyNo}
                  onChange={(e) => setForm({ ...form, companyNo: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                VAT Registration No.
              </label>
              <input
                className="input-base"
                value={form.vatNo}
                onChange={(e) => setForm({ ...form, vatNo: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              rows={2}
              className="input-base"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
              <input
                className="input-base uppercase"
                value={form.postcode}
                onChange={(e) => setForm({ ...form, postcode: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
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
            disabled={saving || !form.name}
          >
            {saving ? 'Creating…' : 'Create Client'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
