'use client'

import ScheduleStepFrame from './ScheduleStepFrame'
import EditableGrid from './EditableGrid'
import PasteImportBar from './PasteImportBar'
import { getSchedule } from '@/lib/schedules'
import { OpeningBalancesData, defaultOpeningBalancesData } from '@/lib/scheduleData'
import { ScheduleRecord } from '@/types'

export default function OpeningBalancesForm({
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
  const def = getSchedule('openingBalances')!

  return (
    <ScheduleStepFrame<OpeningBalancesData>
      title={def.title}
      purpose={def.purpose}
      howTo={def.howTo}
      jobId={jobId}
      scheduleKey="openingBalances"
      record={record}
      defaultData={defaultOpeningBalancesData()}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
    >
      {(data, setData) => {
        const accDebit = data.accountsRows.reduce((s, r) => s + num(r.debit), 0)
        const accCredit = data.accountsRows.reduce((s, r) => s + num(r.credit), 0)
        const corDebit = data.correctionRows.reduce((s, r) => s + num(r.debit), 0)
        const corCredit = data.correctionRows.reduce((s, r) => s + num(r.credit), 0)
        return (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-800 text-sm">Prior Year Accounts Balances</h3>
                <PasteImportBar
                  targets={[
                    { key: 'nominalCode', label: 'Nominal Code' },
                    { key: 'debit', label: 'Debit', numeric: true },
                    { key: 'credit', label: 'Credit', numeric: true },
                  ]}
                  onImport={(rows) =>
                    setData({
                      ...data,
                      accountsRows: [
                        ...data.accountsRows,
                        ...rows.map((r) => ({ nominalCode: r.nominalCode || '', debit: r.debit || 0, credit: r.credit || 0, notes: '' })),
                      ],
                    })
                  }
                />
              </div>
              <EditableGrid
                columns={[
                  { key: 'nominalCode', label: 'Nominal Code', type: 'text', width: 130 },
                  { key: 'debit', label: 'Debit', type: 'number', width: 120 },
                  { key: 'credit', label: 'Credit', type: 'number', width: 120 },
                  { key: 'notes', label: 'Notes', type: 'text', width: 240 },
                ]}
                rows={data.accountsRows}
                onChange={(rows) => setData({ ...data, accountsRows: rows as any })}
                onAddRow={() => setData({ ...data, accountsRows: [...data.accountsRows, { nominalCode: '', debit: 0, credit: 0, notes: '' }] })}
                onRemoveRow={(i) => setData({ ...data, accountsRows: data.accountsRows.filter((_, idx) => idx !== i) })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Debit total £{accDebit.toLocaleString('en-GB', { minimumFractionDigits: 2 })} · Credit total £
                {accCredit.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-slate-800 text-sm mb-2">Correction Journals (to match software TB to prior year accounts)</h3>
              <EditableGrid
                columns={[
                  { key: 'nominalCode', label: 'Nominal Code', type: 'text', width: 120 },
                  { key: 'nominalName', label: 'Nominal Name', type: 'text', width: 180 },
                  { key: 'debit', label: 'Debit', type: 'number', width: 120 },
                  { key: 'credit', label: 'Credit', type: 'number', width: 120 },
                  { key: 'notes', label: 'Notes', type: 'text', width: 220 },
                ]}
                rows={data.correctionRows}
                onChange={(rows) => setData({ ...data, correctionRows: rows as any })}
                onAddRow={() =>
                  setData({ ...data, correctionRows: [...data.correctionRows, { nominalCode: '', nominalName: '', debit: 0, credit: 0, notes: '' }] })
                }
                onRemoveRow={(i) => setData({ ...data, correctionRows: data.correctionRows.filter((_, idx) => idx !== i) })}
              />
              <div
                className={`text-sm font-medium px-3 py-2 rounded-md mt-2 ${
                  Math.abs(corDebit - corCredit) < 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                Difference: £{(corDebit - corCredit).toLocaleString('en-GB', { minimumFractionDigits: 2 })} (should be nil)
              </div>
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
