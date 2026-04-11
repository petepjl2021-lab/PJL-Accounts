'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  formatCurrency,
  formatDate,
  BUSINESS_TYPE_LABELS,
  ADDON_CATEGORY_LABELS,
  ONEOFF_CATEGORY_LABELS,
} from '@/lib/utils'
import { calcAddOnMonthlyPrice } from '@/lib/pricing'
import type { WizardState } from '@/types'
import type { ParsedPricingPackage, TurnoverBand, PricingAddOn, OneOffFee, PricingConfig } from '@/types'
import { QuoteTotals } from '@/lib/pricing'
import {
  CheckIcon,
  CalendarIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'

interface Props {
  state:    WizardState
  packages: ParsedPricingPackage[]
  bands:    TurnoverBand[]
  addOns:   PricingAddOn[]
  oneOffs:  OneOffFee[]
  config:   PricingConfig | undefined
  totals:   QuoteTotals
  packageName: string
  onChange: (patch: Partial<WizardState>) => void
  onBack:   () => void
}

export function QuoteSummary({
  state, packages, bands, addOns, oneOffs, config, totals, packageName, onChange, onBack
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const pkg  = packages.find(p => p.id === state.selectedPackageId)
  const band = bands.find(b => b.id === state.turnoverBandId)

  const selectedAddOns = state.selectedAddOns.map(sel => {
    const addOn = addOns.find(a => a.id === sel.addOnId)
    if (!addOn) return null
    const monthly = calcAddOnMonthlyPrice(addOn, sel.quantity, sel.frequency)
    return { addOn, ...sel, monthly }
  }).filter(Boolean) as Array<{
    addOn: PricingAddOn
    addOnId: string
    quantity: number
    frequency: 'MONTHLY' | 'QUARTERLY'
    monthly: number
  }>

  const selectedOneOffs = state.selectedOneOffIds.map(id => oneOffs.find(f => f.id === id)).filter(Boolean) as OneOffFee[]

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/pricing/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:       state.clientName || 'Unnamed Client',
          clientEmail:      state.clientEmail || null,
          businessType:     state.businessType,
          isExistingClient: state.isExistingClient,
          industry:         state.industry,
          turnoverBandId:   state.turnoverBandId,
          packageId:        state.selectedPackageId,
          packageNameSnap:  packageName,
          selectedAddOns:   state.selectedAddOns,
          selectedOneOffIds: state.selectedOneOffIds,
          notes:            state.notes,
        }),
      })
      if (!res.ok) throw new Error('Failed to save quote')
      const quote = await res.json()
      router.push(`/quotes/${quote.id}`)
    } catch (e) {
      setError('Failed to save quote. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Quote Summary</h2>
        <p className="text-slate-500 text-sm">
          Review everything below before saving or presenting to the client.
        </p>
      </div>

      {/* Client info card */}
      <div className="card p-5 flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 shrink-0">
          <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div>
            <span className="text-slate-500">Client / Business</span>
            <p className="font-semibold text-slate-900">{state.clientName || 'Unnamed Client'}</p>
          </div>
          {state.clientEmail && (
            <div>
              <span className="text-slate-500">Email</span>
              <p className="font-medium text-slate-800">{state.clientEmail}</p>
            </div>
          )}
          <div>
            <span className="text-slate-500">Business Type</span>
            <p className="font-medium text-slate-800">{BUSINESS_TYPE_LABELS[state.businessType]}</p>
          </div>
          <div>
            <span className="text-slate-500">Turnover Band</span>
            <p className="font-medium text-slate-800">{band?.label ?? '—'}</p>
          </div>
          <div>
            <span className="text-slate-500">Status</span>
            <p className="font-medium text-slate-800">
              {state.isExistingClient ? 'Existing client (repricing)' : 'New prospect'}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Quote Date</span>
            <p className="font-medium text-slate-800 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(new Date())}
            </p>
          </div>
        </div>
      </div>

      {/* Selected package */}
      {pkg && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">{packageName} Package</h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totals.baseMonthlyFee)}<span className="text-sm font-normal text-slate-400">/mo</span>
              </div>
              <div className="text-xs text-slate-400">×{band?.multiplier ?? 1} turnover multiplier</div>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-1.5">
            {pkg.includedServices.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckIcon className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add-ons */}
      {selectedAddOns.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Monthly Add-ons</h3>
          <div className="space-y-2">
            {selectedAddOns.map(({ addOn, quantity, frequency, monthly }) => (
              <div key={addOn.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-800">{addOn.name}</span>
                  {addOn.hasQuantity && (
                    <span className="text-slate-500 ml-2">
                      × {quantity} {addOn.unitLabel}{quantity > 1 ? 's' : ''}
                    </span>
                  )}
                  {frequency === 'QUARTERLY' && (
                    <span className="text-slate-400 ml-2">(quarterly, monthly equiv.)</span>
                  )}
                </div>
                <span className="font-semibold text-slate-800">
                  {addOn.basePrice ? `${formatCurrency(monthly)}/mo` : 'TBC'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* One-offs */}
      {selectedOneOffs.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-3">One-off Services</h3>
          <div className="space-y-2">
            {selectedOneOffs.map(fee => (
              <div key={fee.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-800">{fee.name}</span>
                <span className="font-semibold text-slate-800">{formatCurrency(fee.price)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm font-semibold border-t border-slate-100 pt-2 mt-2">
              <span className="text-slate-700">One-off total</span>
              <span className="text-slate-900">{formatCurrency(totals.oneOffTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Grand total */}
      <div className="card p-5 bg-blue-50 border-blue-200">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900">Estimated Monthly Fee</p>
            <p className="text-xs text-blue-600 mt-0.5">Ex-VAT · Direct Debit · No hidden charges</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-700">
              {formatCurrency(totals.monthlyTotal)}
              <span className="text-lg font-normal text-blue-400">/mo</span>
            </div>
            <div className="text-sm text-blue-600 mt-0.5">
              {formatCurrency(totals.annualTotal)}/year
            </div>
          </div>
        </div>
        {totals.oneOffTotal > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between text-sm text-blue-800">
            <span>Plus one-off setup fees:</span>
            <span className="font-semibold">{formatCurrency(totals.oneOffTotal)}</span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="card p-4 bg-amber-50 border-amber-200 text-sm text-amber-800">
        <p className="font-semibold mb-1">Important</p>
        <p>{config?.disclaimerText ?? "This is a rough guide — I'll confirm exact fees once I know more about your business."}</p>
        {config?.closingLine && <p className="mt-1 font-medium">{config.closingLine}</p>}
      </div>

      {/* Notes */}
      <div>
        <label className="label-base">Notes (internal — not shown to client)</label>
        <textarea
          value={state.notes}
          onChange={e => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Any internal notes about this quote…"
          className="input-base resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button onClick={onBack} className="btn-secondary">← Back</button>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-8"
          >
            {saving ? 'Saving…' : 'Save Quote'}
          </button>
        </div>
      </div>
    </div>
  )
}
