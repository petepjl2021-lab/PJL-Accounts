'use client'

import { useReducer, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

import { WizardStepIndicator }  from '@/components/calculator/WizardStepIndicator'
import { Step1ClientProfile }   from '@/components/calculator/Step1ClientProfile'
import { Step2PackageCards }    from '@/components/calculator/Step2PackageCards'
import { Step3AddOns }          from '@/components/calculator/Step3AddOns'
import { QuoteSummary }         from '@/components/calculator/QuoteSummary'
import { PriceLiveBar }         from '@/components/calculator/PriceLiveBar'

import { calculateTotals } from '@/lib/pricing'
import type { WizardState, ParsedPricingPackage, ParsedIndustryPreset } from '@/types'
import type { TurnoverBand, PricingAddOn, OneOffFee, PricingConfig } from '@/types'
import { Sidebar } from '@/components/layout/Sidebar'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── Wizard reducer ─────────────────────────────────────────────────────────

const INITIAL_STATE: WizardState = {
  step:              1,
  clientName:        '',
  clientEmail:       '',
  businessType:      'LIMITED_COMPANY',
  isExistingClient:  false,
  industry:          'GENERAL',
  turnoverBandId:    '',
  selectedPackageId: null,
  selectedAddOns:    [],
  selectedOneOffIds: [],
  notes:             '',
}

type Action =
  | { type: 'PATCH';  payload: Partial<WizardState> }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'RESET' }

function wizardReducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'PATCH':
      return { ...state, ...action.payload }
    case 'NEXT': {
      const steps: Array<WizardState['step']> = [1, 2, 3, 'summary']
      const idx  = steps.indexOf(state.step)
      return { ...state, step: steps[Math.min(idx + 1, steps.length - 1)] }
    }
    case 'BACK': {
      const steps: Array<WizardState['step']> = [1, 2, 3, 'summary']
      const idx  = steps.indexOf(state.step)
      return { ...state, step: steps[Math.max(idx - 1, 0)] }
    }
    case 'RESET':
      return { ...INITIAL_STATE }
    default:
      return state
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const { status } = useSession()
  const router     = useRouter()

  // ── All hooks must be called unconditionally before any early return ────────

  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE)

  const { data: config }   = useSWR<PricingConfig>('/api/pricing/config', fetcher)
  const { data: packages } = useSWR<ParsedPricingPackage[]>('/api/pricing/packages', fetcher)
  const { data: bands }    = useSWR<TurnoverBand[]>('/api/pricing/bands', fetcher)
  const { data: addOns }   = useSWR<PricingAddOn[]>('/api/pricing/addons', fetcher)
  const { data: oneOffs }  = useSWR<OneOffFee[]>('/api/pricing/oneoffs', fetcher)
  const { data: presets }  = useSWR<ParsedIndustryPreset[]>('/api/pricing/presets', fetcher)

  // Array.isArray guards ensure a { error: '...' } API response (returned while
  // the session is still initialising) never reaches .find() as a non-array.
  const safePackages = Array.isArray(packages) ? packages : []
  const safeBands    = Array.isArray(bands)    ? bands    : []
  const safeAddOns   = Array.isArray(addOns)   ? addOns   : []
  const safeOneOffs  = Array.isArray(oneOffs)  ? oneOffs  : []
  const safePresets  = Array.isArray(presets)  ? presets  : []

  const selectedPackage = safePackages.find(p => p.id === state.selectedPackageId) ?? null
  const selectedBand    = safeBands.find(b => b.id === state.turnoverBandId) ?? null

  // useMemo is a hook — must be called here, BEFORE any early return
  const totals = useMemo(() => calculateTotals({
    businessType:      state.businessType,
    selectedPackage,
    selectedBand,
    selectedAddOns:    state.selectedAddOns,
    selectedOneOffIds: state.selectedOneOffIds,
    addOns:            safeAddOns,
    oneOffs:           safeOneOffs,
  }), [state, selectedPackage, selectedBand, safeAddOns, safeOneOffs])

  // ── Early returns AFTER all hooks ───────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/signin')
    return null
  }

  // ── Derived values (not hooks) ──────────────────────────────────────────────

  function getPackageName(tier: string): string {
    if (!config) return tier
    const map: Record<string, string> = {
      TIER_ONE:   config.packageOneName,
      TIER_TWO:   config.packageTwoName,
      TIER_THREE: config.packageThreeName,
    }
    return map[tier] ?? tier
  }

  const pkgName = selectedPackage ? getPackageName(selectedPackage.tier) : '—'

  function handleStepForward() {
    if (state.step === 2) {
      const preset = safePresets.find(p => p.code === state.industry)
      if (preset && state.selectedAddOns.length === 0 && preset.defaultAddOnIds.length > 0) {
        const presetAddOns = preset.defaultAddOnIds
          .map(id => safeAddOns.find(a => a.id === id))
          .filter(Boolean) as PricingAddOn[]

        dispatch({
          type: 'PATCH',
          payload: {
            selectedAddOns: presetAddOns.map(a => ({
              addOnId:   a.id,
              quantity:  a.minQuantity,
              frequency: 'MONTHLY' as const,
            })),
          },
        })
      }
    }
    dispatch({ type: 'NEXT' })
  }

  const showLiveBar = state.step === 2 || state.step === 3 || state.step === 'summary'

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold text-slate-900">New Quote</h1>
              <button
                onClick={() => dispatch({ type: 'RESET' })}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Start Over
              </button>
            </div>
            <WizardStepIndicator currentStep={state.step} />
          </div>
        </div>

        {/* Step content */}
        <div className={`flex-1 px-8 py-8 ${showLiveBar ? 'pb-24' : ''}`}>
          <div className="max-w-5xl mx-auto">
            {state.step === 1 && (
              <Step1ClientProfile
                state={state}
                bands={safeBands}
                presets={safePresets}
                onChange={p => dispatch({ type: 'PATCH', payload: p })}
                onNext={() => dispatch({ type: 'NEXT' })}
              />
            )}

            {state.step === 2 && (
              <Step2PackageCards
                state={state}
                packages={safePackages}
                bands={safeBands}
                config={config}
                onChange={p => dispatch({ type: 'PATCH', payload: p })}
                onNext={handleStepForward}
                onBack={() => dispatch({ type: 'BACK' })}
              />
            )}

            {state.step === 3 && (
              <Step3AddOns
                state={state}
                addOns={safeAddOns}
                oneOffs={safeOneOffs}
                onChange={p => dispatch({ type: 'PATCH', payload: p })}
                onNext={() => dispatch({ type: 'NEXT' })}
                onBack={() => dispatch({ type: 'BACK' })}
              />
            )}

            {state.step === 'summary' && (
              <QuoteSummary
                state={state}
                packages={safePackages}
                bands={safeBands}
                addOns={safeAddOns}
                oneOffs={safeOneOffs}
                config={config}
                totals={totals}
                packageName={pkgName}
                onChange={p => dispatch({ type: 'PATCH', payload: p })}
                onBack={() => dispatch({ type: 'BACK' })}
              />
            )}
          </div>
        </div>

        {showLiveBar && selectedPackage && (
          <PriceLiveBar totals={totals} packageName={pkgName} />
        )}
      </main>
    </div>
  )
}
