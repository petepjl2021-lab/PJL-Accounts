'use client'

import { cn, formatCurrency } from '@/lib/utils'
import { getPackageBasePrice } from '@/lib/pricing'
import { CheckIcon } from '@heroicons/react/24/solid'
import { StarIcon } from '@heroicons/react/24/outline'
import type { ParsedPricingPackage, WizardState } from '@/types'
import type { TurnoverBand, PricingConfig } from '@/types'

interface Props {
  state:    WizardState
  packages: ParsedPricingPackage[]
  bands:    TurnoverBand[]
  config:   PricingConfig | undefined
  onChange: (patch: Partial<WizardState>) => void
  onNext:   () => void
  onBack:   () => void
}

function packageName(tier: string, config: PricingConfig | undefined): string {
  if (!config) return tier
  const map: Record<string, string> = {
    TIER_ONE:   config.packageOneName,
    TIER_TWO:   config.packageTwoName,
    TIER_THREE: config.packageThreeName,
  }
  return map[tier] ?? tier
}

function packageEmoji(tier: string, config: PricingConfig | undefined): string {
  if (!config) return ''
  const map: Record<string, string> = {
    TIER_ONE:   config.packageOneEmoji,
    TIER_TWO:   config.packageTwoEmoji,
    TIER_THREE: config.packageThreeEmoji,
  }
  return map[tier] ?? ''
}

function packageTagline(tier: string, config: PricingConfig | undefined): string {
  if (!config) return ''
  const map: Record<string, string> = {
    TIER_ONE:   config.packageOneTagline,
    TIER_TWO:   config.packageTwoTagline,
    TIER_THREE: config.packageThreeTagline,
  }
  return map[tier] ?? ''
}

export function Step2PackageCards({ state, packages, bands, config, onChange, onNext, onBack }: Props) {
  const band = bands.find(b => b.id === state.turnoverBandId)
  const multiplier = band?.multiplier ?? 1.0

  const enabledPackages = packages.filter(p => p.enabled)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Choose a Package</h2>
        <p className="text-slate-500 text-sm">
          Prices shown include the ×{multiplier} turnover multiplier ({band?.label ?? '—'}).
          All fees are per month, ex-VAT.
        </p>
      </div>

      {/* Package cards */}
      <div className={cn(
        'grid gap-6',
        enabledPackages.length === 3 ? 'grid-cols-1 lg:grid-cols-3' :
        enabledPackages.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
        'grid-cols-1 max-w-sm mx-auto'
      )}>
        {enabledPackages.map(pkg => {
          const basePrice = getPackageBasePrice(pkg, state.businessType)
          const price     = Math.round(basePrice * multiplier * 100) / 100
          const selected  = state.selectedPackageId === pkg.id
          const name      = packageName(pkg.tier, config)
          const emoji     = packageEmoji(pkg.tier, config)
          const tagline   = packageTagline(pkg.tier, config)

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onChange({ selectedPackageId: pkg.id })}
              className={cn(
                'card text-left p-6 transition-all hover:shadow-lg relative flex flex-col',
                selected  && 'ring-2 ring-blue-500 shadow-md',
                pkg.highlighted && !selected && 'ring-1 ring-blue-300',
              )}
            >
              {/* Recommended badge */}
              {pkg.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow">
                    <StarIcon className="w-3 h-3" /> Recommended
                  </span>
                </div>
              )}

              {/* Selected check */}
              {selected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Header */}
              <div className="mb-4">
                <div className="text-2xl mb-1">{emoji}</div>
                <h3 className="text-xl font-bold text-slate-900">{name}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-snug">{tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {basePrice > 0 ? (
                  <>
                    <div className="text-3xl font-bold text-slate-900">
                      {formatCurrency(price)}
                      <span className="text-base font-normal text-slate-400">/mo</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatCurrency(price * 12)}/yr ex-VAT
                    </p>
                  </>
                ) : (
                  <div className="text-lg font-semibold text-slate-400">
                    Not available for this business type
                  </div>
                )}
              </div>

              {/* Services list */}
              <ul className="space-y-2 flex-1">
                {pkg.includedServices.map((service, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckIcon className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {service}
                  </li>
                ))}
              </ul>

              {/* Select button */}
              <div className="mt-6">
                <div className={cn(
                  'w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-colors',
                  selected
                    ? 'bg-blue-600 text-white'
                    : pkg.highlighted
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                )}>
                  {selected ? '✓ Selected' : 'Select this package'}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-2">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!state.selectedPackageId}
          className="btn-primary px-8"
        >
          Next: Add-ons →
        </button>
      </div>
    </div>
  )
}
