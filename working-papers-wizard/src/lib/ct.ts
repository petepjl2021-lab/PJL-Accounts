// UK Corporation Tax calculator with small profits rate + marginal relief,
// applicable to accounting periods from 1 April 2023 onwards.
// Assumes a single, non-associated company (the common case for small practice clients).
// The computed figure is a helper estimate — always sanity-check before filing.

export const CT_SMALL_PROFITS_THRESHOLD = 50000
export const CT_MAIN_RATE_THRESHOLD = 250000
export const CT_SMALL_PROFITS_RATE = 0.19
export const CT_MAIN_RATE = 0.25
export const CT_MARGINAL_RELIEF_FRACTION = 3 / 200

export interface CtResult {
  taxableProfit: number
  rateApplied: 'small profits rate' | 'main rate with marginal relief' | 'main rate'
  effectiveRatePct: number
  marginalRelief: number
  corporationTaxDue: number
}

export function calculateCorporationTax(taxableProfit: number): CtResult {
  const profit = Math.max(0, taxableProfit)

  if (profit <= CT_SMALL_PROFITS_THRESHOLD) {
    const tax = profit * CT_SMALL_PROFITS_RATE
    return {
      taxableProfit: profit,
      rateApplied: 'small profits rate',
      effectiveRatePct: CT_SMALL_PROFITS_RATE * 100,
      marginalRelief: 0,
      corporationTaxDue: round2(tax),
    }
  }

  if (profit >= CT_MAIN_RATE_THRESHOLD) {
    const tax = profit * CT_MAIN_RATE
    return {
      taxableProfit: profit,
      rateApplied: 'main rate',
      effectiveRatePct: CT_MAIN_RATE * 100,
      marginalRelief: 0,
      corporationTaxDue: round2(tax),
    }
  }

  const taxAtMainRate = profit * CT_MAIN_RATE
  const marginalRelief = (CT_MAIN_RATE_THRESHOLD - profit) * CT_MARGINAL_RELIEF_FRACTION
  const tax = taxAtMainRate - marginalRelief
  return {
    taxableProfit: profit,
    rateApplied: 'main rate with marginal relief',
    effectiveRatePct: profit > 0 ? (tax / profit) * 100 : 0,
    marginalRelief: round2(marginalRelief),
    corporationTaxDue: round2(tax),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
