'use client'

import ScheduleStepFrame from './ScheduleStepFrame'
import EditableGrid from './EditableGrid'
import { getSchedule } from '@/lib/schedules'
import { FixedAssetsData, defaultFixedAssetsData, assetRowCostCf, assetRowCharge, assetRowDepCf, assetRowNbv } from '@/lib/scheduleData'
import { ScheduleRecord } from '@/types'

export default function FixedAssetsForm({
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
  const def = getSchedule('fixedAssets')!

  return (
    <ScheduleStepFrame<FixedAssetsData>
      title={def.title}
      purpose={def.purpose}
      howTo={def.howTo}
      jobId={jobId}
      scheduleKey="fixedAssets"
      record={record}
      defaultData={defaultFixedAssetsData()}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
    >
      {(data, setData) => {
        let totalCharge = 0
        let totalNbv = 0
        let totalCostCf = 0
        data.classes.forEach((cls) => {
          cls.rows.forEach((r) => {
            totalCharge += assetRowCharge(r, cls.ratePct)
            totalNbv += assetRowNbv(r, cls.ratePct)
            totalCostCf += assetRowCostCf(r)
          })
        })

        function updateClass(i: number, patch: Partial<FixedAssetsData['classes'][number]>) {
          const classes = data.classes.slice()
          classes[i] = { ...classes[i], ...patch }
          setData({ classes })
        }

        return (
          <div className="space-y-8">
            {data.classes.map((cls, ci) => (
              <div key={ci}>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <input
                    className="input-base w-56 font-medium"
                    value={cls.name}
                    onChange={(e) => updateClass(ci, { name: e.target.value })}
                  />
                  <label className="flex items-center gap-1.5 text-sm text-slate-600">
                    Rate
                    <input
                      type="number"
                      className="input-base w-20"
                      value={cls.ratePct}
                      onChange={(e) => updateClass(ci, { ratePct: parseFloat(e.target.value) || 0 })}
                    />
                    %
                  </label>
                  <select className="input-base w-40" value={cls.method} onChange={(e) => updateClass(ci, { method: e.target.value })}>
                    <option>Straight Line</option>
                    <option>Reducing Balance</option>
                  </select>
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:underline ml-auto"
                    onClick={() => setData({ classes: data.classes.filter((_, i) => i !== ci) })}
                  >
                    Remove class
                  </button>
                </div>
                <EditableGrid
                  columns={[
                    { key: 'date', label: 'Date', type: 'date', width: 120 },
                    { key: 'asset', label: 'Asset', type: 'text', width: 180 },
                    { key: 'bf', label: 'Cost B/F', type: 'number', width: 110 },
                    { key: 'additions', label: 'Additions', type: 'number', width: 110 },
                    { key: 'disposal', label: 'Disposals', type: 'number', width: 110 },
                    { key: 'costCf', label: 'Cost C/F', type: 'number', computed: (r) => assetRowCostCf(r as any) },
                    { key: 'months', label: 'Months', type: 'number', width: 80 },
                    { key: 'depBf', label: 'Dep B/F', type: 'number', width: 110 },
                    { key: 'charge', label: 'Charge for Year', type: 'number', computed: (r) => assetRowCharge(r as any, cls.ratePct) },
                    { key: 'depCf', label: 'Dep C/F', type: 'number', computed: (r) => assetRowDepCf(r as any, cls.ratePct) },
                    { key: 'nbv', label: 'NBV', type: 'number', computed: (r) => assetRowNbv(r as any, cls.ratePct) },
                  ]}
                  rows={cls.rows}
                  onChange={(rows) => updateClass(ci, { rows: rows as any })}
                  onAddRow={() =>
                    updateClass(ci, { rows: [...cls.rows, { date: '', asset: '', bf: 0, additions: 0, disposal: 0, months: '', depBf: 0 }] })
                  }
                  onRemoveRow={(i) => updateClass(ci, { rows: cls.rows.filter((_, idx) => idx !== i) })}
                />
              </div>
            ))}

            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setData({ classes: [...data.classes, { name: 'New Asset Class', ratePct: 20, method: 'Straight Line', rows: [] }] })}
            >
              + Add asset class
            </button>

            <div className="border-t border-slate-200 pt-4 grid grid-cols-3 gap-4 text-sm">
              <Stat label="Total depreciation charge" value={totalCharge} />
              <Stat label="Total net book value" value={totalNbv} />
              <Stat label="Total cost carried forward" value={totalCostCf} />
            </div>
          </div>
        )
      }}
    </ScheduleStepFrame>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 rounded-md px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">£{value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
    </div>
  )
}
