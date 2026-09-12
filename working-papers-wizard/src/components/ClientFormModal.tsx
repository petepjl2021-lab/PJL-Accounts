'use client'

import { useState } from 'react'
import Modal from './Modal'
import { Client } from '@/types'

export default function ClientFormModal({
  client,
  onClose,
  onSaved,
}: {
  client?: Client
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(client?.name || '')
  const [companyNumber, setCompanyNumber] = useState(client?.companyNumber || '')
  const [accountingStandard, setAccountingStandard] = useState(client?.accountingStandard || 'FRS-105')
  const [folderPath, setFolderPath] = useState(client?.folderPath || '')
  const [notes, setNotes] = useState(client?.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!name.trim()) {
      setError('Client name is required')
      return
    }
    setSaving(true)
    setError('')
    const url = client ? `/api/clients/${client.id}` : '/api/clients'
    const method = client ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, companyNumber, accountingStandard, folderPath, notes }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Something went wrong')
      return
    }
    onSaved()
  }

  return (
    <Modal title={client ? 'Edit Client' : 'New Client'} onClose={onClose}>
      <div className="space-y-4">
        {error && <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Client / Company Name</label>
          <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="ABC Engineering Ltd" autoFocus />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Companies House Number</label>
          <input className="input-base" value={companyNumber} onChange={(e) => setCompanyNumber(e.target.value)} placeholder="12345678" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Accounting Standard</label>
          <select className="input-base" value={accountingStandard} onChange={(e) => setAccountingStandard(e.target.value)}>
            <option value="FRS-105">FRS-105 (Micro-entity)</option>
            <option value="FRS-102">FRS-102 (1A)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Client Folder Path</label>
          <input
            className="input-base"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="e.g. \\\\server\\clients\\ABC Engineering Ltd"
          />
          <p className="text-xs text-slate-500 mt-1">
            When set, the desktop app will save exported working papers straight into this folder.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea className="input-base" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Client'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
