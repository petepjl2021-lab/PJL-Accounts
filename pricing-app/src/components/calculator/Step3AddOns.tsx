'use client'

import { cn, formatCurrency, ADDON_CATEGORY_LABELS, ONEOFF_CATEGORY_LABELS } from '@/lib/utils'
import { calcAddOnMonthlyPrice } from '@/lib/pricing'
import type { WizardState, SelectedAddOn } from '@/types'
import type { PricingAddOn, OneOffFee } from '@/types'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

interface Props {
  state:    WizardState
  addOns:   PricingAddOn[]
  oneOffs:  OneOffFee[]
  onChange: (patch: Partial<WizardState>) => void
  onNext:   () => void
  onBack:   () => void
}

function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const k = String(item[key])
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function Step3AddOns({ state, addOns, oneOffs, onChange, onNext, onBack }: Props) {
  // Helper: get current selection for an add-on
  function getSelection(addOnId: string): SelectedAddOn | undefined {
    return state.selectedAddOns.find(s => s.addOnId === addOnId)
  }

  function isAddOnSelected(addOnId: string): boolean {
    return !!getSelection(addOnId)
  }

  function toggleAddOn(addOn: PricingAddOn) {
    if (isAddOnSelected(addOn.id)) {
      onChange({ selectedAddOns: state.selectedAddOns.filter(s => s.addOnId !== addOn.id) })
    } else {
      onChange({
        selectedAddOns: [...state.selectedAddOns, {
          addOnId:  addOn.id,
          quantity: addOn.minQuantity,
          frequency: 'MONTHLY',
        }],
      })
    }
  }

  function updateQuantity(addOnId: string, quantity: number) {
    onChange({
      selectedAddOns: state.selectedAddOns.map(s =>
        s.addOnId === addOnId ? { ...s, quantity } : s
      ),
    })
  }

  function updateFrequency(addOnId: string, frequency: 'MONTHLY' | 'QUARTERLY') {
    onChange({
      selectedAddOns: state.selectedAddOns.map(s =>
        s.addOnId === addOnId ? { ...s, frequency } : s
      ),
    })
  }

  function toggleOneOff(feeId: string) {
    if (state.selectedOneOffIds.includes(feeId)) {
      onChange({ selectedOneOffIds: state.selectedOneOffIds.filter(id => id !== feeId) })
    } else {
      onChange({ selectedOneOffIds: [...state.selectedOneOffIds, feeId] })
    }
  }

  const groupedAddOns  = groupBy(addOns, 'category')
  const groupedOneOffs = groupBy(oneOffs, 'category')

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Add-ons & One-off Services</h2>
        <p className="text-slate-500 text-sm">
          Tick any additional monthly services or one-off jobs to include in the quote.
        </p>
      </div>

      {/* ── Monthly Add-ons ─────────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-4">
          Monthly Services <span className="text-slate-400 font-normal text-sm">(added to your monthly total)</span>
        </h3>

        <div className="space-y-6">
          {Object.entries(groupedAddOns).map(([category, items]) => (
            <div key={category}>
              <p className="section-title mb-3">{ADDON_CATEGORY_LABELS[category] ?? category}</p>
              <div className="space-y-2">
                {items.map(addOn => {
                  const sel      = getSelection(addOn.id)
                  const selected = !!sel
                  const qty      = sel?.quantity  ?? addOn.minQuantity
                  const freq     = sel?.frequency ?? 'MONTHLY'
                  const monthly  = selected && addOn.basePrice
                    ? calcAddOnMonthlyPrice(addOn, qty, freq)
                    : null
                  const isTbc    = !addOn.basePrice

                  return (
                    <div
                      key={addOn.id}
                      className={cn(
                        'card p-4 transition-all',
                        selected && 'ring-1 ring-blue-400 bg-blue-50/30'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`addon-${addOn.id}`}
                          checked={selected}
                          onChange={() => toggleAddOn(addOn)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`addon-${addOn.id}`}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span className="font-medium text-slate-900 text-sm">{addOn.name}</span>
                            <span className={cn(
                              'text-sm font-semibold shrink-0 ml-4',
                              isTbc ? 'text-slate-400' : 'text-slate-700'
                            )}>
                              {isTbc
                                ? 'TBC'
                                : addOn.additionalUnitPrice
                                  ? `${formatCurrency(addOn.basePrice)} + ${formatCurrency(addOn.additionalUnitPrice)}/${addOn.unitLabel}`
                                  : formatCurrency(addOn.basePrice)
                              }
                            </span>
                          </label>

                          {addOn.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{addOn.description}</p>
                          )}

                          {/* Incremental pricing note */}
                          {addOn.additionalUnitPrice && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <InformationCircleIcon className="w-3.5 h-3.5" />
                              Includes {addOn.includedUnits} {addOn.unitLabel}
                              {addOn.includedUnits > 1 ? 's' : ''},
                              then +{formatCurrency(addOn.additionalUnitPrice)} per extra {addOn.unitLabel}
                            </p>
                          )}

                          {/* Controls when selected */}
                          {selected && (
                            <div className="flex items-center gap-4 mt-3 flex-wrap">
                              {addOn.hasQuantity && (
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-slate-600">
                                    No. of {addOn.unitLabel}s:
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(addOn.id, Math.max(addOn.minQuantity, qty - 1))}
                                      className="w-7 h-7 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-bold"
                                    >−</button>
                                    <span className="w-8 text-center text-sm font-semibold text-slate-900">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(addOn.id, Math.min(addOn.maxQuantity, qty + 1))}
                                      className="w-7 h-7 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-bold"
                                    >+</button>
                                  </div>
                                </div>
                              )}

                              {addOn.hasFrequency && (
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-slate-600">Frequency:</label>
                                  <select
                                    value={freq}
                                    onChange={e => updateFrequency(addOn.id, e.target.value as 'MONTHLY' | 'QUARTERLY')}
                                    className="input-base w-auto py-1 text-xs"
                                  >
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="QUARTERLY">Quarterly</option>
                                  </select>
                                </div>
                              )}

                              {monthly != null && (
                                <div className="ml-auto text-sm font-semibold text-blue-700">
                                  = {formatCurrency(monthly)}/mo
                                </div>
                              )}
                              {isTbc && selected && (
                                <div className="ml-auto text-xs text-slate-400">
                                  Price TBC — Pete to confirm
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── One-Off Fees ─────────────────────────────────────────────────────────── */}
      {oneOffs.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            One-off Services <span className="text-slate-400 font-normal text-sm">(fixed fee — not included in monthly)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Tick any one-off services needed at setup or during the year.
          </p>

          <div className="space-y-6">
            {Object.entries(groupedOneOffs).map(([category, fees]) => (
              <div key={category}>
                <p className="section-title mb-3">{ONEOFF_CATEGORY_LABELS[category] ?? category}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fees.map(fee => {
                    const selected = state.selectedOneOffIds.includes(fee.id)
                    return (
                      <label
                        key={fee.id}
                        className={cn(
                          'card p-3 flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-slate-50',
                          selected && 'ring-1 ring-blue-400 bg-blue-50/30'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleOneOff(fee.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-800">{fee.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 shrink-0">
                          {formatCurrency(fee.price)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-2">
        <button onClick={onBack} className="btn-secondary">← Back</button>
        <button onClick={onNext} className="btn-primary px-8">
          Review Quote →
        </button>
      </div>
    </div>
  )
}
