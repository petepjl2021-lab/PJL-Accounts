import type { PrismaClient } from '@prisma/client'

/**
 * Idempotent seed of all default pricing data.
 * Safe to run multiple times — uses upsert on stable keys.
 */
export async function seedPricingData(prisma: PrismaClient) {
  // ─── Pricing Config (singleton) ─────────────────────────────────────────────
  await prisma.pricingConfig.upsert({
    where:  { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })

  // ─── Packages ────────────────────────────────────────────────────────────────
  const baseServices = [
    'Annual accounts (statutory financial statements)',
    'Corporation Tax return (CT600) / Sole Trader SA return',
    'Deal with all HMRC correspondence',
    'Companies House filing — abbreviated accounts (Ltd)',
    'Annual systems report & accounting grading',
    'Annual profit review — one-page business summary',
  ]

  const boostServices = [
    ...baseServices,
    'Personal tax planning review (February each year)',
    'Business tax planning review (2 months before year-end)',
    'Company car planning advice',
    'Tax-efficient remuneration package advice',
    'PAYE health check',
    'VAT health check',
    'Professional fee protection insurance',
  ]

  const beyondServices = [
    ...boostServices,
    'Quarterly management accounts with graphical analysis',
    '13-week cashflow forecasting',
    'Benchmarking review vs sector peers',
    'Monthly / quarterly finance meetings',
    'Business growth support sessions',
  ]

  const packages = [
    {
      tier: 'TIER_ONE',
      priceSoleTrader:  30,
      pricePartnership: 70,
      priceLtd:         100,
      priceIndividual:  25,
      includedServices: JSON.stringify(baseServices),
      highlighted:      false,
      enabled:          true,
      sortOrder:        1,
    },
    {
      tier: 'TIER_TWO',
      priceSoleTrader:  45,
      pricePartnership: 105,
      priceLtd:         150,
      priceIndividual:  40,
      includedServices: JSON.stringify(boostServices),
      highlighted:      true,
      enabled:          true,
      sortOrder:        2,
    },
    {
      tier: 'TIER_THREE',
      priceSoleTrader:  75,
      pricePartnership: 175,
      priceLtd:         250,
      priceIndividual:  0,
      includedServices: JSON.stringify(beyondServices),
      highlighted:      false,
      enabled:          true,
      sortOrder:        3,
    },
  ]

  for (const pkg of packages) {
    await prisma.pricingPackage.upsert({
      where:  { tier: pkg.tier },
      update: pkg,
      create: pkg,
    })
  }

  // ─── Turnover Bands ──────────────────────────────────────────────────────────
  const bands = [
    { label: 'Up to £50,000',            minTurnover: 0,       maxTurnover: 50000,   multiplier: 1.0,  sortOrder: 1 },
    { label: '£50,001 – £150,000',        minTurnover: 50001,   maxTurnover: 150000,  multiplier: 1.25, sortOrder: 2 },
    { label: '£150,001 – £500,000',       minTurnover: 150001,  maxTurnover: 500000,  multiplier: 1.5,  sortOrder: 3 },
    { label: '£500,001 – £1,000,000',     minTurnover: 500001,  maxTurnover: 1000000, multiplier: 2.0,  sortOrder: 4 },
    { label: 'Over £1,000,000',           minTurnover: 1000001, maxTurnover: null,    multiplier: 2.5,  sortOrder: 5 },
  ]

  // Delete and recreate bands (no stable unique key other than label)
  await prisma.turnoverBand.deleteMany()
  await prisma.turnoverBand.createMany({ data: bands })

  // ─── Monthly Add-ons ─────────────────────────────────────────────────────────
  const addons = [
    // TAX
    {
      name: 'Self Assessment tax return',
      description: 'Personal tax return prepared & submitted to HMRC',
      category: 'TAX',
      basePrice: 15,
      includedUnits: 1,
      additionalUnitPrice: 15,
      unitLabel: 'return',
      hasQuantity: true,
      minQuantity: 1,
      maxQuantity: 10,
      hasFrequency: false,
      enabled: true,
      sortOrder: 1,
    },
    {
      name: 'P11D preparation & submission',
      description: 'Benefits-in-kind return for directors / employees',
      category: 'TAX',
      basePrice: 20,
      includedUnits: 1,
      additionalUnitPrice: 10,
      unitLabel: 'director',
      hasQuantity: true,
      minQuantity: 1,
      maxQuantity: 20,
      hasFrequency: false,
      enabled: true,
      sortOrder: 2,
    },
    // VAT
    {
      name: 'VAT return preparation & submission',
      description: 'Quarterly (or monthly) VAT returns — MTD compliant. Standard / Flat Rate / Cash Accounting schemes.',
      category: 'VAT',
      basePrice: 34,
      includedUnits: 1,
      additionalUnitPrice: null,
      unitLabel: 'month',
      hasQuantity: false,
      minQuantity: 1,
      maxQuantity: 1,
      hasFrequency: false,
      enabled: true,
      sortOrder: 1,
    },
    // PAYROLL
    {
      name: 'Payroll — RTI submission to HMRC',
      description: 'Full payroll processing, payslips & RTI submission. Flat rate covers first employee; additional fee per extra employee.',
      category: 'PAYROLL',
      basePrice: 20,
      includedUnits: 1,
      additionalUnitPrice: 5,
      unitLabel: 'employee',
      hasQuantity: true,
      minQuantity: 1,
      maxQuantity: 50,
      hasFrequency: false,
      enabled: true,
      sortOrder: 1,
    },
    {
      name: 'Pension auto-enrolment submissions',
      description: 'Monthly pension contribution submissions to provider',
      category: 'PAYROLL',
      basePrice: 10,
      includedUnits: 1,
      additionalUnitPrice: null,
      unitLabel: 'month',
      hasQuantity: false,
      minQuantity: 1,
      maxQuantity: 1,
      hasFrequency: false,
      enabled: true,
      sortOrder: 2,
    },
    // BOOKKEEPING
    {
      name: 'Bookkeeping (we do it for you)',
      description: 'We maintain your records in Xero / QuickBooks — price depends on transaction volume. Leave blank for Pete to confirm.',
      category: 'BOOKKEEPING',
      basePrice: null,
      includedUnits: 1,
      additionalUnitPrice: null,
      unitLabel: 'month',
      hasQuantity: false,
      minQuantity: 1,
      maxQuantity: 1,
      hasFrequency: false,
      enabled: true,
      sortOrder: 1,
    },
    // CIS
    {
      name: 'CIS monthly returns & subcontractor payslips',
      description: 'Construction Industry Scheme monthly return & CIS payslips. Flat rate covers up to 5 subcontractors.',
      category: 'CIS',
      basePrice: 30,
      includedUnits: 5,
      additionalUnitPrice: 5,
      unitLabel: 'subcontractor',
      hasQuantity: true,
      minQuantity: 1,
      maxQuantity: 100,
      hasFrequency: false,
      enabled: true,
      sortOrder: 1,
    },
    // SOFTWARE
    {
      name: 'Software subscription (Xero / QuickBooks / Dext)',
      description: 'We procure and manage your cloud accounting software subscription',
      category: 'SOFTWARE',
      basePrice: 15,
      includedUnits: 1,
      additionalUnitPrice: null,
      unitLabel: 'month',
      hasQuantity: false,
      minQuantity: 1,
      maxQuantity: 1,
      hasFrequency: false,
      enabled: true,
      sortOrder: 1,
    },
    // MANAGEMENT
    {
      name: 'Management accounts',
      description: 'Detailed financial report showing profit, cashflow & key metrics. Price depends on frequency and complexity — leave blank for Pete to confirm.',
      category: 'MANAGEMENT',
      basePrice: null,
      includedUnits: 1,
      additionalUnitPrice: null,
      unitLabel: 'month',
      hasQuantity: false,
      minQuantity: 1,
      maxQuantity: 1,
      hasFrequency: true,
      enabled: true,
      sortOrder: 1,
    },
    {
      name: 'Cashflow forecasting',
      description: '13-week or annual rolling cashflow. Price depends on frequency — leave blank for Pete to confirm.',
      category: 'MANAGEMENT',
      basePrice: null,
      includedUnits: 1,
      additionalUnitPrice: null,
      unitLabel: 'month',
      hasQuantity: false,
      minQuantity: 1,
      maxQuantity: 1,
      hasFrequency: true,
      enabled: true,
      sortOrder: 2,
    },
  ]

  // Delete existing add-ons and recreate
  await prisma.pricingAddOn.deleteMany()
  await prisma.pricingAddOn.createMany({ data: addons })

  // ─── One-Off Fees ────────────────────────────────────────────────────────────
  const oneOffs = [
    // HMRC
    { name: 'HMRC Self Assessment registration',      category: 'HMRC',            price: 50,  sortOrder: 1 },
    { name: 'HMRC Payroll scheme registration',       category: 'HMRC',            price: 50,  sortOrder: 2 },
    { name: 'HMRC VAT registration',                  category: 'HMRC',            price: 100, sortOrder: 3 },
    { name: 'HMRC VAT deregistration',               category: 'HMRC',            price: 50,  sortOrder: 4 },
    // COMPANIES HOUSE
    { name: 'Company formation (new)',                category: 'COMPANIES_HOUSE', price: 150, sortOrder: 1 },
    { name: 'Incorporation (sole trader to Ltd)',     category: 'COMPANIES_HOUSE', price: 250, sortOrder: 2 },
    { name: 'Companies House — secretarial changes', category: 'COMPANIES_HOUSE', price: 50,  sortOrder: 3 },
    { name: 'Company dissolution',                   category: 'COMPANIES_HOUSE', price: 100, sortOrder: 4 },
    // ADVISORY
    { name: 'Capital gains computation',             category: 'ADVISORY',        price: 200, sortOrder: 1 },
    { name: 'Business structure review',             category: 'ADVISORY',        price: 100, sortOrder: 2 },
    { name: 'Business plan draft assistance',        category: 'ADVISORY',        price: 250, sortOrder: 3 },
    { name: 'One-off cashflow forecast (3 months)',  category: 'ADVISORY',        price: 200, sortOrder: 4 },
    { name: 'One-off cashflow forecast (12 months)', category: 'ADVISORY',        price: 500, sortOrder: 5 },
    // GENERAL
    { name: 'Mortgage / rental reference letter',   category: 'GENERAL',         price: 50,  sortOrder: 1 },
    { name: 'Accounts certification letter',        category: 'GENERAL',         price: 50,  sortOrder: 2 },
    { name: 'Cloud software setup / review / training', category: 'GENERAL',     price: 50,  sortOrder: 3 },
  ]

  await prisma.oneOffFee.deleteMany()
  await prisma.oneOffFee.createMany({ data: oneOffs })

  // ─── Industry Presets ────────────────────────────────────────────────────────
  // We'll get the CIS add-on ID after creation
  const cisAddOn = await prisma.pricingAddOn.findFirst({
    where: { category: 'CIS' },
  })

  const presetsData = [
    {
      code: 'GENERAL',
      name: 'General',
      description: 'Standard services for most businesses',
      defaultAddOnIds: JSON.stringify([]),
      sortOrder: 1,
      enabled: true,
    },
    {
      code: 'CONSTRUCTION',
      name: 'Construction (CIS)',
      description: 'Construction industry clients — includes CIS returns & subcontractor payslips',
      defaultAddOnIds: JSON.stringify(cisAddOn ? [cisAddOn.id] : []),
      sortOrder: 2,
      enabled: true,
    },
    {
      code: 'PROFESSIONAL',
      name: 'Professional Services',
      description: 'Consultants, solicitors, medical professionals',
      defaultAddOnIds: JSON.stringify([]),
      sortOrder: 3,
      enabled: true,
    },
    {
      code: 'PROPERTY',
      name: 'Property & Lettings',
      description: 'Landlords and property investors',
      defaultAddOnIds: JSON.stringify([]),
      sortOrder: 4,
      enabled: true,
    },
  ]

  for (const preset of presetsData) {
    await prisma.industryPreset.upsert({
      where:  { code: preset.code },
      update: { ...preset },
      create: { ...preset },
    })
  }
}
