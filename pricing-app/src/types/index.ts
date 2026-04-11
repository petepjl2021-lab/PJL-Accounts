import type {
  Quote,
  QuoteAddOn,
  QuoteOneOff,
  PricingAddOn,
  OneOffFee,
  PricingPackage,
  PricingConfig,
  TurnoverBand,
  IndustryPreset,
  User,
} from '@prisma/client'

// ─── Parsed versions (JSON fields deserialised) ───────────────────────────────

export type ParsedPricingPackage = Omit<PricingPackage, 'includedServices'> & {
  includedServices: string[]
}

export type ParsedIndustryPreset = Omit<IndustryPreset, 'defaultAddOnIds'> & {
  defaultAddOnIds: string[]
}

// ─── Quote with relations ─────────────────────────────────────────────────────

export type QuoteAddOnWithRelation = QuoteAddOn & {
  addOn: PricingAddOn
}

export type QuoteOneOffWithRelation = QuoteOneOff & {
  fee: OneOffFee
}

export type QuoteWithRelations = Quote & {
  package:  PricingPackage | null
  addOns:   QuoteAddOnWithRelation[]
  oneOffs:  QuoteOneOffWithRelation[]
  createdBy: Pick<User, 'id' | 'name'> | null
}

// ─── Wizard state ─────────────────────────────────────────────────────────────

export type BusinessType = 'SOLE_TRADER' | 'PARTNERSHIP' | 'LIMITED_COMPANY' | 'INDIVIDUAL'

export interface SelectedAddOn {
  addOnId:   string
  quantity:  number
  frequency: 'MONTHLY' | 'QUARTERLY'
}

export interface WizardState {
  step: 1 | 2 | 3 | 'summary'
  // Step 1
  clientName:       string
  clientEmail:      string
  businessType:     BusinessType
  isExistingClient: boolean
  industry:         string    // IndustryPreset.code e.g. "GENERAL"
  turnoverBandId:   string
  // Step 2
  selectedPackageId: string | null
  // Step 3
  selectedAddOns:    SelectedAddOn[]
  selectedOneOffIds: string[]
  // Summary
  notes: string
}

// ─── Re-exports from Prisma ───────────────────────────────────────────────────

export type {
  PricingConfig,
  PricingPackage,
  TurnoverBand,
  PricingAddOn,
  OneOffFee,
  IndustryPreset,
  Quote,
  User,
}
