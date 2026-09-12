'use client'

import { useState } from 'react'
import Modal from './Modal'
import { SCHEDULES } from '@/lib/schedules'

export default function EditSchedulesModal({
  jobId,
  current,
  onClose,
  onSaved,
}: {
  jobId: string
  current: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [ticked, setTicked] = useState<Set<string>>(new Set(current))
  const [saving, setSaving] = useState(false)

  function toggle(key: string) {
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function save() {
    setSaving(true)
    await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requiredSchedules: Array.from(ticked) }),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <Modal title="Edit Schedules Required" onClose={onClose} wide>
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Un-ticking a schedule hides it from the wizard but keeps any data you already entered. Ticking a new one adds it
          with a blank starting point.
        </p>
        <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto border border-slate-200 rounded-md p-3">
          {SCHEDULES.map((s) => (
            <label key={s.key} className="flex items-start gap-2 text-sm text-slate-700 py-0.5">
              <input type="checkbox" className="mt-0.5" checked={ticked.has(s.key)} onChange={() => toggle(s.key)} />
              <span>{s.title}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
