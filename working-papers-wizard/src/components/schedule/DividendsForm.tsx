'use client'

import ScheduleStepFrame from './ScheduleStepFrame'
import EditableGrid from './EditableGrid'
import { getSchedule } from '@/lib/schedules'
import { DividendsData, defaultDividendsData, computeReservesCarriedForward } from '@/lib/scheduleData'
import { ScheduleRecord } from '@/types'

export default function DividendsForm({
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
  const def = getSchedule('dividendsAndReserves')!

  return (
    <ScheduleStepFrame<DividendsData>
      title={def.title}
      purpose={def.purpose}
      howTo={def.howTo}
      jobId={jobId}
      scheduleKey="dividendsAndReserves"
      record={record}
      defaultData={defaultDividendsData()}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
    >
      {(data, setData) => {
        const dividendsTotal = data.dividends.reduce((s, r) => s + num(r.amount), 0)
        const closing = computeReservesCarriedForward(data)
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 font-medium">Reserves Brought Forward</span>
                <input
                  type="number"
                  className="input-base w-36"
                  value={data.reservesBroughtForward}
                  onChange={(e) => setData({ ...data, reservesBroughtForward: parseFloat(e.target.value) || 0 })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 font-medium">Current Year Profit After Tax</span>
                <input
                  type="number"
                  className="input-base w-36"
                  value={data.currentYearProfit}
                  onChange={(e) => setData({ ...data, currentYearProfit: parseFloat(e.target.value) || 0 })}
                />
              </label>
            </div>

            <EditableGrid
              columns={[
                { key: 'date', label: 'Date', type: 'date', width: 120 },
                { key: 'description', label: 'Description', type: 'text', width: 260 },
                { key: 'amount', label: 'Amount', type: 'number', width: 130 },
              ]}
              rows={data.dividends}
              onChange={(rows) => setData({ ...data, dividends: rows as any })}
              onAddRow={() => setData({ ...data, dividends: [...data.dividends, { date: '', description: '', amount: 0 }] })}
              onRemoveRow={(i) => setData({ ...data, dividends: data.dividends.filter((_, idx) => idx !== i) })}
            />

            <div className="bg-slate-50 rounded-md px-3 py-2 text-sm space-y-1 inline-block">
              <div>Total dividends: £{dividendsTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
              <div className="font-semibold text-slate-900">
                Reserves Carried Forward: £{closing.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </div>
              {closing < 0 && (
                <div className="text-amber-600 text-xs">Warning: dividends may not be covered by distributable reserves.</div>
              )}
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
