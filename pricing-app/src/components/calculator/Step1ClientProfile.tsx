'use client'

import { cn, BUSINESS_TYPE_LABELS } from '@/lib/utils'
import type { WizardState, BusinessType } from '@/types'
import type { TurnoverBand } from '@/types'
import type { ParsedIndustryPreset } from '@/types'

interface Props {
  state:    WizardState
  bands:    TurnoverBand[]
  presets:  ParsedIndustryPreset[]
  onChange: (patch: Partial<WizardState>) => void
  onNext:   () => void
}

const BUSINESS_TYPES: BusinessType[] = [
  'SOLE_TRADER', 'PARTNERSHIP', 'LIMITED_COMPANY', 'INDIVIDUAL',
]

export function Step1ClientProfile({ state, bands, presets, onChange, onNext }: Props) {
  const canProceed = state.businessType && state.turnoverBandId

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Client Profile</h2>
        <p className="text-slate-500 text-sm">
          Tell us a little about the client so we can show the right starting prices.
        </p>
      </div>

      {/* Client name + email */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-base">
            Client / Business Name
            <span className="text-slate-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={state.clientName}
            onChange={e => onChange({ clientName: e.target.value })}
            placeholder="e.g. Acme Ltd"
            className="input-base"
          />
        </div>
        <div>
          <label className="label-base">
            Email Address
            <span className="text-slate-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="email"
            value={state.clientEmail}
            onChange={e => onChange({ clientEmail: e.target.value })}
            placeholder="client@example.com"
            className="input-base"
          />
        </div>
      </div>

      {/* Existing / new client */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="existingClient"
          checked={state.isExistingClient}
          onChange={e => onChange({ isExistingClient: e.target.checked })}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="existingClient" className="text-sm text-slate-700 cursor-pointer">
          This is an existing client (repricing, not a new prospect)
        </label>
      </div>

      {/* Business type */}
      <div>
        <label className="label-base">Business Type <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
          {BUSINESS_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ businessType: type })}
              className={cn(
                'px-4 py-3 rounded-xl border-2 text-sm font-medium text-center transition-all',
                state.businessType === type
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              {BUSINESS_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Turnover band */}
      <div>
        <label className="label-base">
          Approximate Annual Turnover <span className="text-red-500">*</span>
        </label>
        <select
          value={state.turnoverBandId}
          onChange={e => onChange({ turnoverBandId: e.target.value })}
          className="input-base"
        >
          <option value="">Select turnover range…</option>
          {bands.map(b => (
            <option key={b.id} value={b.id}>
              {b.label} (×{b.multiplier} multiplier)
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-1">
          The turnover band applies a price multiplier to the base package rate.
        </p>
      </div>

      {/* Industry preset */}
      {presets.length > 0 && (
        <div>
          <label className="label-base">Industry / Sector</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {presets.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ industry: p.code })}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                  state.industry === p.code
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
          {presets.find(p => p.code === state.industry)?.description && (
            <p className="text-xs text-slate-400 mt-2">
              {presets.find(p => p.code === state.industry)?.description}
            </p>
          )}
        </div>
      )}

      {/* Next */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary px-8"
        >
          Next: Choose Package →
        </button>
      </div>
    </div>
  )
}
