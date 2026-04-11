'use client'

import { formatCurrency } from '@/lib/utils'
import type { QuoteTotals } from '@/lib/pricing'

interface Props {
  totals:     QuoteTotals
  packageName: string
}

export function PriceLiveBar({ totals, packageName }: Props) {
  return (
    <div className="fixed bottom-0 left-60 right-0 z-30 bg-white border-t border-slate-200 shadow-lg px-8 py-3 print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Breakdown */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-500">Package ({packageName}):</span>{' '}
            <span className="font-semibold text-slate-800">{formatCurrency(totals.baseMonthlyFee)}/mo</span>
          </div>
          {totals.addOnsMonthlyFee > 0 && (
            <div>
              <span className="text-slate-500">Add-ons:</span>{' '}
              <span className="font-semibold text-slate-800">+{formatCurrency(totals.addOnsMonthlyFee)}/mo</span>
            </div>
          )}
          {totals.oneOffTotal > 0 && (
            <div>
              <span className="text-slate-500">One-offs:</span>{' '}
              <span className="font-semibold text-slate-800">{formatCurrency(totals.oneOffTotal)}</span>
            </div>
          )}
        </div>

        {/* Grand total */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">Monthly total ex-VAT</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totals.monthlyTotal)}
              <span className="text-sm font-normal text-slate-400">/mo</span>
            </div>
          </div>
          <div className="text-right pl-4 border-l border-slate-200">
            <div className="text-xs text-slate-400">Annual total ex-VAT</div>
            <div className="text-lg font-bold text-slate-800">
              {formatCurrency(totals.annualTotal)}/yr
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
