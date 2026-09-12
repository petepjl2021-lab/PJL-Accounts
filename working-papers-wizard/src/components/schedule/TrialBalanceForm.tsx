'use client'

import ScheduleStepFrame from './ScheduleStepFrame'
import EditableGrid from './EditableGrid'
import PasteImportBar from './PasteImportBar'
import { getSchedule } from '@/lib/schedules'
import { TrialBalanceData, defaultTrialBalanceData } from '@/lib/scheduleData'
import { ScheduleRecord } from '@/types'

export default function TrialBalanceForm({
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
  const def = getSchedule('trialBalance')!

  return (
    <ScheduleStepFrame<TrialBalanceData>
      title={def.title}
      purpose={def.purpose}
      howTo={def.howTo}
      jobId={jobId}
      scheduleKey="trialBalance"
      record={record}
      defaultData={defaultTrialBalanceData()}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
    >
      {(data, setData) => {
        const finalTotal = data.rows.reduce((s, r) => s + num(r.currentYear) + num(r.adjustment), 0)
        return (
          <div className="space-y-3">
            <div className="flex justify-end">
              <PasteImportBar
                targets={[
                  { key: 'nominal', label: 'Nominal Code' },
                  { key: 'description', label: 'Description' },
                  { key: 'currentYear', label: 'Current Year Amount', numeric: true },
                ]}
                onImport={(rows) =>
                  setData({
                    rows: [
                      ...data.rows,
                      ...rows.map((r) => ({
                        nominal: r.nominal || '',
                        description: r.description || '',
                        currentYear: r.currentYear || 0,
                        adjustment: 0,
                        comment: '',
                      })),
                    ],
                  })
                }
              />
            </div>
            <EditableGrid
              columns={[
                { key: 'nominal', label: 'Nominal', type: 'text', width: 100 },
                { key: 'description', label: 'Description', type: 'text', width: 220 },
                { key: 'priorYear', label: 'Prior Year', type: 'number', width: 110 },
                { key: 'currentYear', label: 'Current Year', type: 'number', width: 120 },
                { key: 'adjustment', label: 'Adjustment', type: 'number', width: 110 },
                { key: 'final', label: 'Final TB', type: 'number', computed: (r) => num(r.currentYear) + num(r.adjustment) },
                { key: 'comment', label: 'Comment', type: 'text', width: 220 },
              ]}
              rows={data.rows}
              onChange={(rows) => setData({ rows: rows as any })}
              onAddRow={() => setData({ rows: [...data.rows, { nominal: '', description: '', currentYear: 0, adjustment: 0, comment: '' }] })}
              onRemoveRow={(i) => setData({ rows: data.rows.filter((_, idx) => idx !== i) })}
            />
            <div className={`text-sm font-medium px-3 py-2 rounded-md ${Math.abs(finalTotal) < 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              Balance check (Final TB total): £{finalTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              {Math.abs(finalTotal) >= 0.01 && ' — if debits are entered as positive and credits as negative, this should net to nil.'}
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
