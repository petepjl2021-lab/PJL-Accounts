'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import { SCHEDULES } from '@/lib/schedules'
import { Client, Job } from '@/types'

export default function NewJobModal({ client, jobs, onClose }: { client: Client; jobs: Job[]; onClose: () => void }) {
  const hasPriorJob = jobs.length > 0
  const [yearEndDate, setYearEndDate] = useState('')
  const [preparedBy, setPreparedBy] = useState('')
  const [reviewedBy, setReviewedBy] = useState('')
  const [carryForward, setCarryForward] = useState(hasPriorJob)
  const [vatRegistered, setVatRegistered] = useState(false)
  const [runsPayroll, setRunsPayroll] = useState(false)
  const [ticked, setTicked] = useState<Set<string>>(
    new Set(SCHEDULES.filter((s) => s.defaultChecked).map((s) => s.key))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function toggle(key: string) {
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function setVat(v: boolean) {
    setVatRegistered(v)
    setTicked((prev) => {
      const next = new Set(prev)
      if (v) next.add('vatControl')
      else next.delete('vatControl')
      return next
    })
  }

  function setPayroll(v: boolean) {
    setRunsPayroll(v)
    setTicked((prev) => {
      const next = new Set(prev)
      if (v) {
        next.add('payeAndNic')
        next.add('wagesControl')
      } else {
        next.delete('payeAndNic')
        next.delete('wagesControl')
      }
      return next
    })
  }

  const allChecked = ticked.size === SCHEDULES.length
  function toggleAll() {
    setTicked(allChecked ? new Set() : new Set(SCHEDULES.map((s) => s.key)))
  }

  async function create() {
    if (!yearEndDate) {
      setError('Year end date is required')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/clients/${client.id}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        yearEndDate,
        preparedBy,
        reviewedBy,
        requiredSchedules: Array.from(ticked),
        carryForward,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Something went wrong')
      return
    }
    const job = await res.json()
    router.push(`/jobs/${job.id}`)
  }

  return (
    <Modal title={`New Job — ${client.name}`} onClose={onClose} wide>
      <div className="space-y-5">
        {error && <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Year End Date</label>
            <input type="date" className="input-base" value={yearEndDate} onChange={(e) => setYearEndDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prepared By</label>
            <input className="input-base" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Initials" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reviewed By</label>
            <input className="input-base" value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value)} placeholder="Initials" />
          </div>
        </div>

        {hasPriorJob && (
          <label className="flex items-center gap-2 rounded-md bg-brand-50 border border-brand-100 px-3 py-2 text-sm text-brand-800">
            <input type="checkbox" checked={carryForward} onChange={(e) => setCarryForward(e.target.checked)} />
            Carry forward fixed assets, DLA and reserves balances from last year&rsquo;s job
          </label>
        )}

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={vatRegistered} onChange={(e) => setVat(e.target.checked)} />
            VAT registered
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={runsPayroll} onChange={(e) => setPayroll(e.target.checked)} />
            Runs payroll
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">Schedules Required</label>
            <button className="text-xs text-brand-700 hover:underline" onClick={toggleAll} type="button">
              {allChecked ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto border border-slate-200 rounded-md p-3">
            {SCHEDULES.map((s) => (
              <label key={s.key} className="flex items-start gap-2 text-sm text-slate-700 py-0.5">
                <input type="checkbox" className="mt-0.5" checked={ticked.has(s.key)} onChange={() => toggle(s.key)} />
                <span>{s.title}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cover Sheet, Index, Checklist and Notes &amp; Queries are always included.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={create} disabled={saving}>
            {saving ? 'Creating…' : 'Create Job & Start Wizard'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
