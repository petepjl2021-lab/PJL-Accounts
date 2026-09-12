'use client'

import ScheduleStepFrame from './ScheduleStepFrame'
import EditableGrid from './EditableGrid'
import { getSchedule } from '@/lib/schedules'
import { JournalEntriesData, defaultJournalEntriesData } from '@/lib/scheduleData'
import { ScheduleRecord } from '@/types'

export default function JournalEntriesForm({
  jobId,
  record,
  onBack,
  onNext,
  isFirst,
  isLast,
}: {
  jobId: string
  record: ScheduleRecord
  onBack?: () => void
  onNext?: () => void
  isFirst?: boolean
  isLast?: boolean
}) {
  const def = getSchedule('journalEntries')!

  return (
    <ScheduleStepFrame<JournalEntriesData>
      title={def.title}
      purpose={def.purpose}
      howTo={def.howTo}
      jobId={jobId}
      scheduleKey="journalEntries"
      record={record}
      defaultData={defaultJournalEntriesData()}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
    >
      {(data, setData) => {
        const debit = data.rows.reduce((s, r) => s + num(r.debit), 0)
        const credit = data.rows.reduce((s, r) => s + num(r.credit), 0)
        return (
          <div className="space-y-3">
            <EditableGrid
              columns={[
                { key: 'ref', label: 'Journal Ref', type: 'text', width: 110 },
                { key: 'description', label: 'Description', type: 'text', width: 220 },
                { key: 'debit', label: 'Debit', type: 'number', width: 120 },
                { key: 'credit', label: 'Credit', type: 'number', width: 120 },
                { key: 'explanation', label: 'Explanation', type: 'text', width: 260 },
              ]}
              rows={data.rows}
              onChange={(rows) => setData({ rows: rows as any })}
              onAddRow={() => setData({ rows: [...data.rows, { ref: '', description: '', debit: 0, credit: 0, explanation: '' }] })}
              onRemoveRow={(i) => setData({ rows: data.rows.filter((_, idx) => idx !== i) })}
            />
            <div
              className={`text-sm font-medium px-3 py-2 rounded-md ${
                Math.abs(debit - credit) < 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              Debit total £{debit.toLocaleString('en-GB', { minimumFractionDigits: 2 })} · Credit total £
              {credit.toLocaleString('en-GB', { minimumFractionDigits: 2 })} · Difference £
              {(debit - credit).toLocaleString('en-GB', { minimumFractionDigits: 2 })} (should be nil)
            </div>
          </div>
        )
      }}
    </ScheduleStepFrame>
  )
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}
