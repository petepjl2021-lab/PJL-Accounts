'use client'

import { useState } from 'react'
import { Job, ScheduleRecord } from '@/types'
import { getSchedule } from '@/lib/schedules'
import StatusPill from '@/components/StatusPill'

export default function ReviewExport({
  job,
  clientFolderPath,
  onJobUpdated,
}: {
  job: Job
  clientFolderPath: string | null
  onJobUpdated: () => void
}) {
  const [completing, setCompleting] = useState(false)
  const schedules = job.schedules || []
  const specialTitles: Record<string, string> = {
    coverSheet: 'Cover Sheet',
    index: 'Index',
    notesQueries: 'Notes and Queries',
    checklist: 'Checklist',
  }
  const titled = schedules
    .filter((s) => s.key !== 'index' && s.key !== 'coverSheet')
    .map((s) => ({
      ...s,
      title: specialTitles[s.key] || getSchedule(s.key)?.title || s.key,
    }))

  const notDone = titled.filter((s) => s.status !== 'DONE')
  const exportHref = `/api/jobs/${job.id}/export${clientFolderPath ? `?folder=${encodeURIComponent(clientFolderPath)}` : ''}`

  async function markComplete() {
    setCompleting(true)
    await fetch(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    setCompleting(false)
    onJobUpdated()
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Review &amp; Export</h2>
        <p className="text-sm text-slate-500 mb-4">
          Check every schedule is prepared and reviewed, then export the full file for this job in one go.
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 font-medium">Schedule</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Prepared By</th>
              <th className="py-2 font-medium">Reviewed By</th>
            </tr>
          </thead>
          <tbody>
            {titled.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-2 text-slate-900">{s.title}</td>
                <td className="py-2">
                  <StatusPill status={s.status} />
                </td>
                <td className="py-2 text-slate-600">{s.preparedBy || '—'}</td>
                <td className="py-2 text-slate-600">{s.reviewedBy || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {notDone.length > 0 && (
          <p className="text-xs text-amber-600 mt-3">
            {notDone.length} schedule(s) not yet marked done: {notDone.map((s) => s.title).join(', ')}. You can still export and complete
            the job — this is just a reminder.
          </p>
        )}
      </div>

      <div className="card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium text-slate-900">
            {job.status === 'COMPLETED' ? 'Job marked complete' : 'Finish this job'}
          </div>
          {clientFolderPath && (
            <div className="text-xs text-slate-500 mt-0.5">Will save straight into: {clientFolderPath}</div>
          )}
        </div>
        <div className="flex gap-2">
          {job.status !== 'COMPLETED' && (
            <button className="btn-secondary" onClick={markComplete} disabled={completing}>
              {completing ? 'Marking…' : 'Mark Job Complete'}
            </button>
          )}
          <a className="btn-primary" href={exportHref}>
            Export to Excel (.xlsx)
          </a>
        </div>
      </div>
    </div>
  )
}
