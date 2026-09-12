import { CHECKLIST_ITEMS, getSchedule } from './schedules'

// ─── Shape definitions for each schedule's JSON payload ────────────────────────

export interface GridRow {
  [key: string]: string | number
}
export interface GridData {
  rows: GridRow[]
}

export interface TrialBalanceRow {
  nominal: string
  description: string
  priorYear?: number
  currentYear: number
  adjustment: number
  comment: string
}
export interface TrialBalanceData {
  rows: TrialBalanceRow[]
}

export interface OpeningBalanceRow {
  nominalCode: string
  debit: number
  credit: number
  notes: string
}
export interface CorrectionJournalRow {
  nominalCode: string
  nominalName: string
  debit: number
  credit: number
  notes: string
}
export interface OpeningBalancesData {
  accountsRows: OpeningBalanceRow[]
  correctionRows: CorrectionJournalRow[]
}

export interface JournalEntryRow {
  ref: string
  description: string
  debit: number
  credit: number
  explanation: string
}
export interface JournalEntriesData {
  rows: JournalEntryRow[]
}

export interface FixedAssetRow {
  date: string
  asset: string
  bf: number
  additions: number
  disposal: number
  months: number | ''
  depBf: number
}
export interface FixedAssetClass {
  name: string
  ratePct: number
  method: string
  rows: FixedAssetRow[]
}
export interface FixedAssetsData {
  classes: FixedAssetClass[]
}

export type DlaDirection = 'Credit (owed to director)' | 'Debit (owed by director)'
export interface DlaMovementRow {
  date: string
  description: string
  amount: number
  direction: DlaDirection
}
export interface DlaData {
  openingBalance: number
  rows: DlaMovementRow[]
}

export interface CtLineItem {
  description: string
  amount: number
}
export interface CorporationTaxData {
  profitBeforeTax: number
  addBacks: CtLineItem[]
  capitalAllowances: CtLineItem[]
  overrideTaxableProfit: number | null
  overrideTaxDue: number | null
}

export interface DividendRow {
  date: string
  description: string
  amount: number
}
export interface DividendsData {
  reservesBroughtForward: number
  currentYearProfit: number
  dividends: DividendRow[]
}

export type ChecklistResponse = 'Yes' | 'No' | 'N/A' | ''
export interface ChecklistLine {
  section: string
  text: string
  response: ChecklistResponse
  notes: string
  completedBy: string
  date: string
}
export interface ChecklistData {
  items: ChecklistLine[]
}

export type QueryStatus = 'Open' | 'Waiting' | 'Cleared'
export interface NoteQueryRow {
  ref: string
  area: string
  query: string
  requestedFrom: string
  status: QueryStatus
  response: string
  clearedBy: string
  clearedDate: string
}
export interface NotesQueriesData {
  rows: NoteQueryRow[]
}

// ─── Default (blank) data factories ────────────────────────────────────────────

function blankGridRows(n: number): GridRow[] {
  return Array.from({ length: n }, () => ({}))
}

export function defaultGridData(): GridData {
  return { rows: blankGridRows(8) }
}

export function defaultTrialBalanceData(): TrialBalanceData {
  return { rows: [] }
}

export function defaultOpeningBalancesData(): OpeningBalancesData {
  return { accountsRows: [], correctionRows: [] }
}

export function defaultJournalEntriesData(): JournalEntriesData {
  return { rows: [] }
}

const DEFAULT_ASSET_CLASSES: { name: string; ratePct: number; method: string }[] = [
  { name: 'Computer Equipment', ratePct: 20, method: 'Straight Line' },
  { name: 'Motor Vehicles', ratePct: 20, method: 'Reducing Balance' },
  { name: 'Plant & Machinery', ratePct: 20, method: 'Reducing Balance' },
]

export function defaultFixedAssetsData(): FixedAssetsData {
  return {
    classes: DEFAULT_ASSET_CLASSES.map((c) => ({ ...c, rows: [] })),
  }
}

export function defaultDlaData(): DlaData {
  return { openingBalance: 0, rows: [] }
}

export function defaultCorporationTaxData(): CorporationTaxData {
  return { profitBeforeTax: 0, addBacks: [], capitalAllowances: [], overrideTaxableProfit: null, overrideTaxDue: null }
}

export function defaultDividendsData(): DividendsData {
  return { reservesBroughtForward: 0, currentYearProfit: 0, dividends: [] }
}

export function defaultChecklistData(): ChecklistData {
  return {
    items: CHECKLIST_ITEMS.map((i) => ({ section: i.section, text: i.text, response: '', notes: '', completedBy: '', date: '' })),
  }
}

export function defaultNotesQueriesData(): NotesQueriesData {
  return { rows: [] }
}

// ─── Fixed asset formulas (mirrors the original template's spreadsheet logic) ──

export function assetRowCostCf(row: FixedAssetRow): number {
  return num(row.bf) + num(row.additions) + num(row.disposal)
}
export function assetRowCharge(row: FixedAssetRow, ratePct: number): number {
  const months = row.months === '' ? 12 : num(row.months)
  return (assetRowCostCf(row) * (ratePct / 100)) / 12 * months
}
export function assetRowDepCf(row: FixedAssetRow, ratePct: number): number {
  return num(row.depBf) + assetRowCharge(row, ratePct)
}
export function assetRowNbv(row: FixedAssetRow, ratePct: number): number {
  return assetRowCostCf(row) - assetRowDepCf(row, ratePct)
}

function num(v: number | '' | undefined | null): number {
  if (v === '' || v === undefined || v === null) return 0
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

// ─── Carry-forward: seed a new job's schedule data from last year's completed job ──

export function carryForwardScheduleData(key: string, prevRaw: string | undefined): string | null {
  if (!prevRaw) return null
  try {
    switch (key) {
      case 'fixedAssets': {
        const prev = JSON.parse(prevRaw) as FixedAssetsData
        const next: FixedAssetsData = {
          classes: prev.classes.map((cls) => ({
            name: cls.name,
            ratePct: cls.ratePct,
            method: cls.method,
            rows: cls.rows
              .filter((r) => assetRowCostCf(r) !== 0 || assetRowDepCf(r, cls.ratePct) !== 0)
              .map((r) => ({
                date: '',
                asset: r.asset,
                bf: round2(assetRowCostCf(r)),
                additions: 0,
                disposal: 0,
                months: '',
                depBf: round2(assetRowDepCf(r, cls.ratePct)),
              })),
          })),
        }
        return JSON.stringify(next)
      }
      case 'directorsLoanAccount': {
        const prev = JSON.parse(prevRaw) as DlaData
        const closing = computeDlaClosing(prev)
        const next: DlaData = { openingBalance: round2(closing), rows: [] }
        return JSON.stringify(next)
      }
      case 'dividendsAndReserves': {
        const prev = JSON.parse(prevRaw) as DividendsData
        const closing = computeReservesCarriedForward(prev)
        const next: DividendsData = { reservesBroughtForward: round2(closing), currentYearProfit: 0, dividends: [] }
        return JSON.stringify(next)
      }
      case 'trialBalance': {
        const prev = JSON.parse(prevRaw) as TrialBalanceData
        const next: TrialBalanceData = {
          rows: prev.rows
            .filter((r) => r.nominal || r.description)
            .map((r) => ({
              nominal: r.nominal,
              description: r.description,
              priorYear: round2(num(r.currentYear) + num(r.adjustment)),
              currentYear: 0,
              adjustment: 0,
              comment: '',
            })),
        }
        return JSON.stringify(next)
      }
      default:
        return null
    }
  } catch {
    return null
  }
}

export function computeDlaClosing(data: DlaData): number {
  const movementTotal = data.rows.reduce((sum, r) => {
    const amt = num(r.amount)
    return sum + (r.direction === 'Debit (owed by director)' ? -amt : amt)
  }, 0)
  return num(data.openingBalance) + movementTotal
}

export function computeReservesCarriedForward(data: DividendsData): number {
  const dividendsTotal = data.dividends.reduce((sum, r) => sum + num(r.amount), 0)
  return num(data.reservesBroughtForward) + num(data.currentYearProfit) - dividendsTotal
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function defaultDataForKey(key: string): string {
  if (key === 'checklist') return JSON.stringify(defaultChecklistData())
  if (key === 'notesQueries') return JSON.stringify(defaultNotesQueriesData())
  const def = getSchedule(key)
  switch (def?.kind) {
    case 'trialBalance':
      return JSON.stringify(defaultTrialBalanceData())
    case 'openingBalances':
      return JSON.stringify(defaultOpeningBalancesData())
    case 'journalEntries':
      return JSON.stringify(defaultJournalEntriesData())
    case 'fixedAssets':
      return JSON.stringify(defaultFixedAssetsData())
    case 'dla':
      return JSON.stringify(defaultDlaData())
    case 'corporationTax':
      return JSON.stringify(defaultCorporationTaxData())
    case 'dividends':
      return JSON.stringify(defaultDividendsData())
    default:
      return JSON.stringify(defaultGridData())
  }
}
