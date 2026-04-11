/**
 * Pure pricing calculation engine.
 * No Prisma imports — works on plain objects so it can run client-side too.
 */

export type BusinessType = 'SOLE_TRADER' | 'PARTNERSHIP' | 'LIMITED_COMPANY' | 'INDIVIDUAL'

export interface PackageRow {
  id: string
  tier: string
  priceSoleTrader: number
  pricePartnership: number
  priceLtd: number
  priceIndividual: number
  includedServices: string[]
  highlighted: boolean
  enabled: boolean
  sortOrder: number
}

export interface TurnoverBandRow {
  id: string
  label: string
  minTurnover: number
  maxTurnover: number | null
  multiplier: number
  sortOrder: number
}

export interface AddOnRow {
  id: string
  name: string
  description: string | null
  category: string
  basePrice: number | null
  includedUnits: number
  additionalUnitPrice: number | null
  unitLabel: string
  hasQuantity: boolean
  minQuantity: number
  maxQuantity: number
  hasFrequency: boolean
  enabled: boolean
  sortOrder: number
}

export interface OneOffFeeRow {
  id: string
  name: string
  category: string
  price: number
  enabled: boolean
  sortOrder: number
}

export interface SelectedAddOn {
  addOnId: string
  quantity: number
  frequency: 'MONTHLY' | 'QUARTERLY'
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

/** Get the base price from a package for a given business type */
export function getPackageBasePrice(pkg: PackageRow, businessType: BusinessType): number {
  switch (businessType) {
    case 'SOLE_TRADER':     return pkg.priceSoleTrader
    case 'PARTNERSHIP':     return pkg.pricePartnership
    case 'LIMITED_COMPANY': return pkg.priceLtd
    case 'INDIVIDUAL':      return pkg.priceIndividual
    default:                return 0
  }
}

/** Find the applicable turnover band for a given band ID */
export function findBand(bandId: string, bands: TurnoverBandRow[]): TurnoverBandRow | undefined {
  return bands.find(b => b.id === bandId)
}

/**
 * Calculate the effective monthly price for an add-on given quantity and frequency.
 *
 * Incremental model:
 *   if quantity <= includedUnits  → basePrice
 *   else                          → basePrice + (quantity - includedUnits) × additionalUnitPrice
 *
 * Frequency adjustment:
 *   QUARTERLY → divide monthly-equivalent by 3 (i.e. you pay quarterly, divide across months)
 */
export function calcAddOnMonthlyPrice(
  addOn: AddOnRow,
  quantity: number,
  frequency: 'MONTHLY' | 'QUARTERLY',
): number {
  if (!addOn.basePrice) return 0

  const qty = Math.max(1, quantity)
  let price = addOn.basePrice

  if (addOn.additionalUnitPrice && qty > addOn.includedUnits) {
    price = addOn.basePrice + (qty - addOn.includedUnits) * addOn.additionalUnitPrice
  }

  // For quarterly services, the monthly equivalent is price/3
  if (frequency === 'QUARTERLY') {
    price = price / 3
  }

  return price
}

/** Unit price (per unit above threshold) — shown in summary */
export function calcAddOnUnitPrice(addOn: AddOnRow, quantity: number): number {
  if (!addOn.basePrice) return 0
  const qty = Math.max(1, quantity)
  if (addOn.additionalUnitPrice && qty > addOn.includedUnits) {
    return addOn.basePrice + (qty - addOn.includedUnits) * addOn.additionalUnitPrice
  }
  return addOn.basePrice
}

// ─── Main calculation ─────────────────────────────────────────────────────────

export interface QuoteTotals {
  baseMonthlyFee:   number
  addOnsMonthlyFee: number
  monthlyTotal:     number
  annualTotal:      number
  oneOffTotal:      number
}

export function calculateTotals(params: {
  businessType:     BusinessType
  selectedPackage:  PackageRow | null
  selectedBand:     TurnoverBandRow | null
  selectedAddOns:   SelectedAddOn[]
  selectedOneOffIds: string[]
  addOns:           AddOnRow[]
  oneOffs:          OneOffFeeRow[]
}): QuoteTotals {
  const {
    businessType, selectedPackage, selectedBand,
    selectedAddOns, selectedOneOffIds, addOns, oneOffs,
  } = params

  const multiplier = selectedBand?.multiplier ?? 1.0

  const basePrice = selectedPackage
    ? getPackageBasePrice(selectedPackage, businessType) * multiplier
    : 0

  const addOnsMonthly = selectedAddOns.reduce((sum, sel) => {
    const addOn = addOns.find(a => a.id === sel.addOnId)
    if (!addOn) return sum
    return sum + calcAddOnMonthlyPrice(addOn, sel.quantity, sel.frequency)
  }, 0)

  const oneOffTotal = selectedOneOffIds.reduce((sum, id) => {
    const fee = oneOffs.find(f => f.id === id)
    return sum + (fee?.price ?? 0)
  }, 0)

  const monthlyTotal = basePrice + addOnsMonthly

  return {
    baseMonthlyFee:   Math.round(basePrice * 100) / 100,
    addOnsMonthlyFee: Math.round(addOnsMonthly * 100) / 100,
    monthlyTotal:     Math.round(monthlyTotal * 100) / 100,
    annualTotal:      Math.round(monthlyTotal * 12 * 100) / 100,
    oneOffTotal:      Math.round(oneOffTotal * 100) / 100,
  }
}

// ─── Tier label helpers ───────────────────────────────────────────────────────

export const TIER_ORDER: Record<string, number> = {
  TIER_ONE:   1,
  TIER_TWO:   2,
  TIER_THREE: 3,
}
