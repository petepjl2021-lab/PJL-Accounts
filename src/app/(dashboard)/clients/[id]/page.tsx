'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import {
  ClientTypeBadge,
  HMRCStatusBadge,
  TaxReturnStatusBadge,
  TaskStatusBadge,
  OnboardingStageBadge,
} from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import {
  formatDate,
  CLIENT_TYPE_LABELS,
  HMRC_TYPE_LABELS,
  TAX_RETURN_TYPE_LABELS,
  isOverdue,
} from '@/lib/utils'
import type { ClientFull } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CLIENT_TYPE_OPTIONS = Object.entries(CLIENT_TYPE_LABELS)

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: client, mutate } = useSWR<ClientFull>(`/api/clients/${id}`, fetcher)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function openEdit() {
    if (!client) return
    setForm({
      name: client.name,
      companyName: client.companyName ?? '',
      clientType: client.clientType,
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      postcode: client.postcode ?? '',
      utr: client.utr ?? '',
      nino: client.nino ?? '',
      companyNo: client.companyNo ?? '',
      vatNo: client.vatNo ?? '',
      notes: client.notes ?? '',
      status: client.status,
    })
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setEditing(false)
    mutate()
  }

  if (!client) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="h-48 bg-slate-200 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">
              {client.companyName ?? client.name}
            </h1>
            {client.companyName && (
              <p className="text-slate-500 text-sm">{client.name}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                {client.ref}
              </span>
              <ClientTypeBadge type={client.clientType} />
              {client.status !== 'ACTIVE' && (
                <span className="text-xs text-red-600 font-medium">{client.status}</span>
              )}
            </div>
          </div>
          <button onClick={openEdit} className="btn-secondary">
            <PencilSquareIcon className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact info */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-3 text-sm">Contact Details</h2>
          <dl className="space-y-2 text-sm">
            {[
              ['Email', client.email],
              ['Phone', client.phone],
              ['Address', client.address],
              ['Postcode', client.postcode],
            ].map(([label, value]) =>
              value ? (
                <div key={label as string} className="flex gap-3">
                  <dt className="text-slate-400 w-20 shrink-0">{label}</dt>
                  <dd className="text-slate-700">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>

        {/* Tax details */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-3 text-sm">Tax &amp; Registration</h2>
          <dl className="space-y-2 text-sm">
            {[
              ['UTR', client.utr],
              ['NI Number', client.nino],
              ['Company No.', client.companyNo],
              ['VAT No.', client.vatNo],
            ].map(([label, value]) =>
              value ? (
                <div key={label as string} className="flex gap-3">
                  <dt className="text-slate-400 w-24 shrink-0">{label}</dt>
                  <dd className="text-slate-700 font-mono text-xs">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>

        {/* Onboarding status */}
        {client.onboarding && (
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3 text-sm">Onboarding</h2>
            <OnboardingStageBadge stage={client.onboarding.stage} />
            <div className="mt-3 space-y-1 text-sm">
              {[
                ['ID Verified', client.onboarding.idVerified],
                ['Address Verified', client.onboarding.addressVerified],
                ['Eng. Letter Signed', !!client.onboarding.engagementLetterSigned],
                ['HMRC Setup', client.onboarding.hmrcOnlineSetup],
                ['64-8 Requested', client.onboarding.agentAuthRequested],
              ].map(([label, done]) => (
                <div key={label as string} className="flex items-center gap-2">
                  <span className={done ? 'text-green-500' : 'text-slate-300'}>
                    {done ? '✓' : '○'}
                  </span>
                  <span className={done ? 'text-slate-700' : 'text-slate-400'}>
                    {label as string}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-2 text-sm">Notes</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* HMRC Authorisations */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">HMRC Authorisations</h2>
          <Link href="/hmrc" className="text-sm text-blue-600 hover:underline">
            Manage
          </Link>
        </div>
        {client.hmrcAuths.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400">No authorisations set up yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {client.hmrcAuths.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-medium text-slate-700">
                  {HMRC_TYPE_LABELS[a.type] ?? a.type}
                </span>
                <div className="flex items-center gap-4">
                  {a.authorisedDate && (
                    <span className="text-slate-400 text-xs">
                      Auth: {formatDate(a.authorisedDate)}
                    </span>
                  )}
                  <HMRCStatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tax Returns */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Tax Returns</h2>
          <Link href="/tax-returns" className="text-sm text-blue-600 hover:underline">
            Manage
          </Link>
        </div>
        {client.taxReturns.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400">No tax returns added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-2 font-medium text-slate-500">Type</th>
                <th className="text-left px-5 py-2 font-medium text-slate-500">Year</th>
                <th className="text-left px-5 py-2 font-medium text-slate-500">Due</th>
                <th className="text-left px-5 py-2 font-medium text-slate-500">Status</th>
                <th className="text-left px-5 py-2 font-medium text-slate-500">Filed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {client.taxReturns.map((r) => (
                <tr key={r.id} className="table-row-hover">
                  <td className="px-5 py-2">
                    {TAX_RETURN_TYPE_LABELS[r.type] ?? r.type}
                  </td>
                  <td className="px-5 py-2 text-slate-600">{r.taxYear}</td>
                  <td className="px-5 py-2">
                    <span
                      className={
                        isOverdue(r.dueDate) && r.status !== 'FILED'
                          ? 'text-red-600 font-semibold'
                          : 'text-slate-600'
                      }
                    >
                      {formatDate(r.dueDate)}
                    </span>
                  </td>
                  <td className="px-5 py-2">
                    <TaxReturnStatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-2 text-slate-500">{formatDate(r.filedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tasks */}
      {client.tasks.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Open Tasks</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {client.tasks
              .filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED')
              .map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-medium text-slate-700">{t.title}</span>
                  <TaskStatusBadge status={t.status} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Client" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client Type</label>
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
                Company / Trading Name
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
              <label className="block text-sm font-medium text-slate-700 mb-1">UTR</label>
              <input
                className="input-base"
                value={form.utr}
                onChange={(e) => setForm({ ...form, utr: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">NI Number</label>
              <input
                className="input-base"
                value={form.nino}
                onChange={(e) => setForm({ ...form, nino: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company No.</label>
              <input
                className="input-base"
                value={form.companyNo}
                onChange={(e) => setForm({ ...form, companyNo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">VAT No.</label>
              <input
                className="input-base"
                value={form.vatNo}
                onChange={(e) => setForm({ ...form, vatNo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                className="input-base"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
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
              rows={3}
              className="input-base"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setEditing(false)} className="btn-secondary">
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
