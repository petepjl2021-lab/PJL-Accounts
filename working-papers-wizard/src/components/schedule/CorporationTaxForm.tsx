'use client'

import ScheduleStepFrame from './ScheduleStepFrame'
import EditableGrid from './EditableGrid'
import { getSchedule } from '@/lib/schedules'
import { CorporationTaxData, defaultCorporationTaxData } from '@/lib/scheduleData'
import { calculateCorporationTax } from '@/lib/ct'
import { ScheduleRecord } from '@/types'

export default function CorporationTaxForm({
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
  const def = getSchedule('corporationTax')!

  return (
    <ScheduleStepFrame<CorporationTaxData>
      title={def.title}
      purpose={def.purpose}
      howTo={def.howTo}
      jobId={jobId}
      scheduleKey="corporationTax"
      record={record}
      defaultData={defaultCorporationTaxData()}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
    >
      {(data, setData) => {
        const addBacksTotal = data.addBacks.reduce((s, i) => s + num(i.amount), 0)
        const capAllTotal = data.capitalAllowances.reduce((s, i) => s + num(i.amount), 0)
        const taxableProfit = data.overrideTaxableProfit ?? num(data.profitBeforeTax) + addBacksTotal - capAllTotal
        const ct = calculateCorporationTax(taxableProfit)
        const taxDue = data.overrideTaxDue ?? ct.corporationTaxDue

        return (
          <div className="space-y-6">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-600 font-medium w-56">Profit Before Tax (per TB)</span>
              <input
                type="number"
                className="input-base w-40"
                value={data.profitBeforeTax}
                onChange={(e) => setData({ ...data, profitBeforeTax: parseFloat(e.target.value) || 0 })}
              />
            </label>

            <div>
              <h3 className="font-medium text-slate-800 text-sm mb-2">Add Back: Disallowable Expenses</h3>
              <EditableGrid
                columns={[
                  { key: 'description', label: 'Description', type: 'text', width: 300 },
                  { key: 'amount', label: 'Amount', type: 'number', width: 140 },
                ]}
                rows={data.addBacks}
                onChange={(rows) => setData({ ...data, addBacks: rows as any })}
                onAddRow={() => setData({ ...data, addBacks: [...data.addBacks, { description: '', amount: 0 }] })}
                onRemoveRow={(i) => setData({ ...data, addBacks: data.addBacks.filter((_, idx) => idx !== i) })}
              />
            </div>

            <div>
              <h3 className="font-medium text-slate-800 text-sm mb-2">Less: Capital Allowances</h3>
              <EditableGrid
                columns={[
                  { key: 'description', label: 'Description', type: 'text', width: 300 },
                  { key: 'amount', label: 'Amount', type: 'number', width: 140 },
                ]}
                rows={data.capitalAllowances}
                onChange={(rows) => setData({ ...data, capitalAllowances: rows as any })}
                onAddRow={() => setData({ ...data, capitalAllowances: [...data.capitalAllowances, { description: '', amount: 0 }] })}
                onRemoveRow={(i) => setData({ ...data, capitalAllowances: data.capitalAllowances.filter((_, idx) => idx !== i) })}
              />
            </div>

            <div className="bg-brand-50 border border-brand-100 rounded-md p-4 space-y-1 text-sm">
              <Row label="Taxable Profit" value={taxableProfit} />
              <Row label="Rate Applied" value={ct.rateApplied} isText />
              <Row label="Effective Rate" value={`${ct.effectiveRatePct.toFixed(2)}%`} isText />
              {ct.marginalRelief > 0 && <Row label="Marginal Relief" value={ct.marginalRelief} />}
              <Row label="Corporation Tax Due" value={taxDue} bold />
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-slate-500">Override computed figures</summary>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <label className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-32">Override taxable profit</span>
                  <input
                    type="number"
                    className="input-base"
                    value={data.overrideTaxableProfit ?? ''}
                    onChange={(e) => setData({ ...data, overrideTaxableProfit: e.target.value === '' ? null : parseFloat(e.target.value) })}
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-32">Override CT due</span>
                  <input
                    type="number"
                    className="input-base"
                    value={data.overrideTaxDue ?? ''}
                    onChange={(e) => setData({ ...data, overrideTaxDue: e.target.value === '' ? null : parseFloat(e.target.value) })}
                  />
                </label>
              </div>
            </details>
            <p className="text-xs text-slate-400">
              Estimate assumes a single company (not part of an associated group), based on the small profits rate / main
              rate marginal relief rules from 1 April 2023. Always verify before filing.
            </p>
          </div>
        )
      }}
    </ScheduleStepFrame>
  )
}

function Row({ label, value, bold, isText }: { label: string; value: number | string; bold?: boolean; isText?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold text-slate-900 border-t border-brand-200 pt-1 mt-1' : 'text-slate-700'}`}>
      <span>{label}</span>
      <span>{isText || typeof value === 'string' ? value : `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}</span>
    </div>
  )
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}
