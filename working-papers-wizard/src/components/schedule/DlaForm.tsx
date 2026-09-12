'use client'

import ScheduleStepFrame from './ScheduleStepFrame'
import EditableGrid from './EditableGrid'
import { getSchedule } from '@/lib/schedules'
import { DlaData, DlaDirection, defaultDlaData, computeDlaClosing } from '@/lib/scheduleData'
import { ScheduleRecord } from '@/types'

const DIRECTIONS: DlaDirection[] = ['Credit (owed to director)', 'Debit (owed by director)']

export default function DlaForm({
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
  const def = getSchedule('directorsLoanAccount')!

  return (
    <ScheduleStepFrame<DlaData>
      title={def.title}
      purpose={def.purpose}
      howTo={def.howTo}
      jobId={jobId}
      scheduleKey="directorsLoanAccount"
      record={record}
      defaultData={defaultDlaData()}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
    >
      {(data, setData) => {
        const closing = computeDlaClosing(data)
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-600 font-medium">Opening Balance (amount owed to director)</span>
              <input
                type="number"
                className="input-base w-40"
                value={data.openingBalance}
                onChange={(e) => setData({ ...data, openingBalance: parseFloat(e.target.value) || 0 })}
              />
            </label>
            <EditableGrid
              columns={[
                { key: 'date', label: 'Date', type: 'date', width: 120 },
                { key: 'description', label: 'Description', type: 'text', width: 260 },
                { key: 'amount', label: 'Amount', type: 'number', width: 120 },
                { key: 'direction', label: 'Direction', type: 'select', options: DIRECTIONS, width: 200 },
              ]}
              rows={data.rows}
              onChange={(rows) => setData({ ...data, rows: rows as any })}
              onAddRow={() => setData({ ...data, rows: [...data.rows, { date: '', description: '', amount: 0, direction: DIRECTIONS[0] }] })}
              onRemoveRow={(i) => setData({ ...data, rows: data.rows.filter((_, idx) => idx !== i) })}
            />
            <div className="bg-slate-50 rounded-md px-3 py-2 text-sm inline-block">
              <span className="text-slate-500 mr-2">Closing Balance:</span>
              <span className="font-semibold text-slate-900">
                £{closing.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 ml-2">
                {closing >= 0 ? '(company owes director)' : '(director owes company — consider s.455 tax)'}
              </span>
            </div>
          </div>
        )
      }}
    </ScheduleStepFrame>
  )
}
