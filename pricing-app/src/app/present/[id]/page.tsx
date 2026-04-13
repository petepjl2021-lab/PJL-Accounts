'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { formatCurrency, BUSINESS_TYPE_LABELS } from '@/lib/utils'
import type { QuoteWithRelations, PricingConfig } from '@/types'
import {
  CheckIcon,
  XMarkIcon,
  PrinterIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function PresentationPage() {
  const { id } = useParams<{ id: string }>()
  const { data: quote }  = useSWR<QuoteWithRelations>(`/api/pricing/quotes/${id}`, fetcher)
  const { data: config } = useSWR<PricingConfig>('/api/pricing/config', fetcher)
  const { data: allQuotes } = useSWR<QuoteWithRelations[]>('/api/pricing/quotes', fetcher)

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p className="text-slate-400">Loading…</p>
      </div>
    )
  }

  // Resolve package tier from the quote
  const packageTier = quote.package?.tier ?? 'TIER_ONE'

  function tierName(tier: string): string {
    if (!config) return tier
    const map: Record<string, string> = {
      TIER_ONE:   config.packageOneName,
      TIER_TWO:   config.packageTwoName,
      TIER_THREE: config.packageThreeName,
    }
    return map[tier] ?? tier
  }

  function tierEmoji(tier: string): string {
    if (!config) return ''
    const map: Record<string, string> = {
      TIER_ONE:   config.packageOneEmoji,
      TIER_TWO:   config.packageTwoEmoji,
      TIER_THREE: config.packageThreeEmoji,
    }
    return map[tier] ?? ''
  }

  function tierTagline(tier: string): string {
    if (!config) return ''
    const map: Record<string, string> = {
      TIER_ONE:   config.packageOneTagline,
      TIER_TWO:   config.packageTwoTagline,
      TIER_THREE: config.packageThreeTagline,
    }
    return map[tier] ?? ''
  }

  // Build three comparison cards from the quote's package data
  // We show all three tiers but only price the selected one (others show "Ask us")
  const TIERS = ['TIER_ONE', 'TIER_TWO', 'TIER_THREE']

  const selectedServices: string[] = quote.package?.includedServices
    ? JSON.parse(quote.package.includedServices)
    : []

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Toolbar — hidden when printing */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          {config?.logoUrl ? (
            <img
              src={config.logoUrl}
              alt={config.firmName ?? 'Firm logo'}
              className="h-8 w-auto max-w-[120px] object-contain"
            />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
              <BuildingOffice2Icon className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-white font-semibold text-sm">
            {config?.firmName ?? 'Pricing Calculator'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600 transition-colors"
          >
            <PrinterIcon className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 print:p-4 print:bg-white">
        {/* Header */}
        <div className="text-center mb-8 print:mb-4">
          <h1 className="text-3xl font-bold text-white print:text-slate-900 mb-2">
            Your Personalised Fee Proposal
          </h1>
          <p className="text-slate-300 print:text-slate-500">
            {quote.clientName && `For ${quote.clientName} · `}
            {BUSINESS_TYPE_LABELS[quote.businessType]} · {quote.turnoverBandLabel}
          </p>
        </div>

        {/* The selected package — full detail view */}
        <div className="max-w-5xl mx-auto">
          {/* Selected package highlight */}
          <div className={cn(
            'rounded-2xl p-8 mb-8 print:rounded-xl print:p-6 print:mb-4',
            'bg-blue-600 print:bg-blue-50 print:border print:border-blue-200'
          )}>
            <div className="flex items-start justify-between mb-6 print:mb-4">
              <div>
                <div className="text-3xl mb-2 print:text-2xl">{tierEmoji(packageTier)}</div>
                <h2 className="text-2xl font-bold text-white print:text-blue-900">
                  {tierName(packageTier)} Package
                </h2>
                <p className="text-blue-200 print:text-blue-700 mt-1 text-sm">{tierTagline(packageTier)}</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-white print:text-blue-800">
                  {formatCurrency(quote.monthlyTotal)}
                </div>
                <p className="text-blue-200 print:text-blue-600 text-sm">/month ex-VAT</p>
                <p className="text-blue-200 print:text-blue-600 text-sm mt-0.5">
                  {formatCurrency(quote.annualTotal)}/year
                </p>
              </div>
            </div>

            {/* Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 print:gap-1">
              {selectedServices.map((service, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-blue-50 print:text-blue-900">
                  <CheckIcon className="w-4 h-4 text-blue-200 print:text-blue-500 shrink-0 mt-0.5" />
                  {service}
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons included in this quote */}
          {quote.addOns.length > 0 && (
            <div className="card print:border-slate-200 p-6 mb-6 print:p-4 print:mb-4 bg-white">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg print:text-base">
                Also included in your quote:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quote.addOns.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-700">{a.nameSnap}
                      {a.quantity > 1 && ` (${a.quantity})`}
                    </span>
                    <span className="font-semibold text-slate-900">{formatCurrency(a.monthlyTotal)}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* One-offs */}
          {quote.oneOffs.length > 0 && (
            <div className="card print:border-slate-200 p-6 mb-6 print:p-4 print:mb-4 bg-white">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg print:text-base">
                One-off Setup Fees:
              </h3>
              <div className="space-y-1.5">
                {quote.oneOffs.map(o => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{o.nameSnap}</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(o.price)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-2">
                  <span>One-off total</span>
                  <span>{formatCurrency(quote.oneOffTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Total summary bar */}
          <div className="rounded-2xl print:rounded-xl bg-slate-800 print:bg-slate-100 p-6 print:p-4 mb-8 print:mb-4 flex items-center justify-between">
            <div>
              <p className="text-slate-300 print:text-slate-500 text-sm">Monthly investment (ex-VAT)</p>
              <p className="text-4xl font-bold text-white print:text-slate-900 mt-1">
                {formatCurrency(quote.monthlyTotal)}<span className="text-xl font-normal text-slate-400 print:text-slate-500">/mo</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-300 print:text-slate-500 text-sm">Annual equivalent</p>
              <p className="text-2xl font-bold text-slate-100 print:text-slate-700 mt-1">{formatCurrency(quote.annualTotal)}/yr</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-center">
            <p className="text-slate-400 print:text-slate-500 text-sm max-w-2xl mx-auto italic">
              {config?.disclaimerText ?? "This is a rough guide — I'll confirm exact fees once I know more about your business."}
            </p>
            {config?.closingLine && (
              <p className="text-slate-300 print:text-slate-600 text-sm font-semibold mt-2">
                {config.closingLine}
              </p>
            )}
            <p className="text-slate-500 print:text-slate-400 text-xs mt-4">
              {config?.firmName ?? 'PJL Accounts'} · All fees ex-VAT · Collected by monthly Direct Debit
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
