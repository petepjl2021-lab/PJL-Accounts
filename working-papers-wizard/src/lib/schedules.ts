// Central catalog of every working paper schedule, matching the columns and
// purpose of the original "LTD Company Working Papers" Excel template.
// This drives the wizard steps, the on-screen forms, and the exported workbook.

export type GridColumnType = 'text' | 'number' | 'date' | 'select'

export interface GridColumn {
  key: string
  label: string
  type: GridColumnType
  options?: string[]
  width?: number
}

export type ScheduleKind = 'grid' | 'trialBalance' | 'openingBalances' | 'journalEntries' | 'fixedAssets' | 'dla' | 'corporationTax' | 'dividends'

export interface ScheduleDef {
  key: string
  title: string
  kind: ScheduleKind
  purpose: string
  howTo: string
  optional: boolean // true = shown on the "tick the schedules you need" step
  defaultChecked: boolean
  columns?: GridColumn[]
}

// Schedules the wizard always includes, regardless of what's ticked.
export const ALWAYS_INCLUDED = ['coverSheet', 'index', 'notesQueries', 'checklist'] as const

export const SCHEDULES: ScheduleDef[] = [
  {
    key: 'trialBalance',
    title: 'Trial Balance',
    kind: 'trialBalance',
    purpose: 'Paste the year-end TB, record adjustments, and let the final TB calculate automatically.',
    howTo: 'Paste a Nominal / Description / Amount block copied from Xero, QuickBooks or a CSV export directly into the grid.',
    optional: true,
    defaultChecked: true,
  },
  {
    key: 'openingBalances',
    title: 'Opening Balances',
    kind: 'openingBalances',
    purpose: 'Compare software opening balances to prior statutory accounts and identify mismatch journals.',
    howTo: 'Paste software balances and prior-year accounts figures, then use the correction journal grid for differences.',
    optional: true,
    defaultChecked: false,
  },
  {
    key: 'journalEntries',
    title: 'Journal Entries',
    kind: 'journalEntries',
    purpose: 'Record all year-end journals that need posting back to bookkeeping or retained for support.',
    howTo: 'Each journal should balance (debits = credits), include a clear explanation, and tie to supporting papers.',
    optional: true,
    defaultChecked: true,
  },
  {
    key: 'profitAndLossReview',
    title: 'Profit & Loss Review',
    kind: 'grid',
    purpose: 'Summarise major profit and loss headings and explain unusual movements or review points.',
    howTo: 'List the key lines reviewed, compare to expectation or prior year, and note any follow-up.',
    optional: true,
    defaultChecked: true,
    columns: [
      { key: 'lineItem', label: 'Line item', type: 'text', width: 220 },
      { key: 'movement', label: 'Movement / explanation', type: 'text', width: 260 },
      { key: 'followUp', label: 'Follow-up', type: 'text', width: 220 },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Cleared', 'N/A'], width: 110 },
      { key: 'note', label: 'Note', type: 'text', width: 200 },
    ],
  },
  {
    key: 'bankReconciliation',
    title: 'Bank Reconciliation',
    kind: 'grid',
    purpose: 'Reconcile each bank or card account to the ledger balance at year end.',
    howTo: 'Enter statement balance, bookkeeping balance, and note how each difference is cleared. Variance calculates automatically.',
    optional: true,
    defaultChecked: true,
    columns: [
      { key: 'account', label: 'Account', type: 'text', width: 200 },
      { key: 'statement', label: 'Statement balance', type: 'number', width: 140 },
      { key: 'ledger', label: 'Ledger balance', type: 'number', width: 140 },
      { key: 'note', label: 'Note', type: 'text', width: 260 },
    ],
  },
  {
    key: 'debtorsAndPrepayments',
    title: 'Debtors & Prepayments',
    kind: 'grid',
    purpose: 'Support trade debtors, other debtors and prepayments with a clear breakdown at year end.',
    howTo: 'List each balance, identify what it relates to, and tie totals back to the TB.',
    optional: true,
    defaultChecked: true,
    columns: [
      { key: 'balanceType', label: 'Balance type', type: 'text', width: 180 },
      { key: 'description', label: 'Description', type: 'text', width: 240 },
      { key: 'amount', label: 'Amount', type: 'number', width: 130 },
      { key: 'treatment', label: 'Year end treatment', type: 'text', width: 220 },
      { key: 'note', label: 'Note', type: 'text', width: 200 },
    ],
  },
  {
    key: 'creditorsAndAccruals',
    title: 'Creditors & Accruals',
    kind: 'grid',
    purpose: 'Break down trade creditors, accruals and other year-end liabilities.',
    howTo: 'List each supplier or accrual, describe the cost, and ensure the total agrees to the TB.',
    optional: true,
    defaultChecked: true,
    columns: [
      { key: 'balanceType', label: 'Balance type', type: 'text', width: 180 },
      { key: 'description', label: 'Description', type: 'text', width: 240 },
      { key: 'amount', label: 'Amount', type: 'number', width: 130 },
      { key: 'treatment', label: 'Year end treatment', type: 'text', width: 220 },
      { key: 'note', label: 'Note', type: 'text', width: 200 },
    ],
  },
  {
    key: 'vatControl',
    title: 'VAT Control',
    kind: 'grid',
    purpose: 'Reconcile the VAT control account to the final VAT return position or HMRC account.',
    howTo: 'Show output tax, input tax, payments or refunds and the balance outstanding at year end.',
    optional: true,
    defaultChecked: true,
    columns: [
      { key: 'item', label: 'VAT item', type: 'text', width: 200 },
      { key: 'description', label: 'Description', type: 'text', width: 220 },
      { key: 'amount', label: 'Amount', type: 'number', width: 130 },
      { key: 'direction', label: 'Direction', type: 'select', options: ['Debtor', 'Creditor'], width: 120 },
      { key: 'note', label: 'Note', type: 'text', width: 200 },
    ],
  },
  {
    key: 'payeAndNic',
    title: 'PAYE & NIC Control',
    kind: 'grid',
    purpose: 'Support PAYE, employee NIC, employer NIC and related payroll liabilities.',
    howTo: 'Enter the payroll totals and payments to HMRC so the closing liability is clear.',
    optional: true,
    defaultChecked: false,
    columns: [
      { key: 'item', label: 'Payroll item', type: 'text', width: 200 },
      { key: 'description', label: 'Description', type: 'text', width: 220 },
      { key: 'amount', label: 'Amount', type: 'number', width: 130 },
      { key: 'direction', label: 'Direction', type: 'select', options: ['Debtor', 'Creditor'], width: 120 },
      { key: 'note', label: 'Note', type: 'text', width: 200 },
    ],
  },
  {
    key: 'wagesControl',
    title: 'Wages Control',
    kind: 'grid',
    purpose: 'Summarise gross wages, net pay, PAYE/NIC and pension deductions for the year.',
    howTo: 'Use payroll reports to total the year and tie the wage cost back to the TB.',
    optional: true,
    defaultChecked: false,
    columns: [
      { key: 'line', label: 'Payroll line', type: 'text', width: 200 },
      { key: 'description', label: 'Description', type: 'text', width: 220 },
      { key: 'amount', label: 'Amount', type: 'number', width: 130 },
      { key: 'type', label: 'Type', type: 'text', width: 140 },
      { key: 'note', label: 'Note', type: 'text', width: 200 },
    ],
  },
  {
    key: 'fixedAssets',
    title: 'Fixed Assets & Depreciation',
    kind: 'fixedAssets',
    purpose: 'Track fixed asset additions, disposals, depreciation policy and closing NBV by class.',
    howTo: 'Enter each asset on a separate line with months used; charge and NBV calculate automatically.',
    optional: true,
    defaultChecked: true,
  },
  {
    key: 'directorsLoanAccount',
    title: 'Directors Loan Account',
    kind: 'dla',
    purpose: 'Reconcile movements on the director loan account over the year.',
    howTo: 'List drawings, repayments, salary or dividend postings; opening balance carries forward from last year automatically.',
    optional: true,
    defaultChecked: true,
  },
  {
    key: 'corporationTax',
    title: 'Corporation Tax Computation',
    kind: 'corporationTax',
    purpose: 'Calculate taxable profit from accounting profit and estimate corporation tax due.',
    howTo: 'Start with profit before tax, add back disallowables, deduct capital allowances, then apply the rate (marginal relief calculated automatically).',
    optional: true,
    defaultChecked: true,
  },
  {
    key: 'dividendsAndReserves',
    title: 'Dividends & Reserves',
    kind: 'dividends',
    purpose: 'Track movements in reserves and dividends declared or paid during the year.',
    howTo: 'Reserves brought forward carry over automatically; add current year profit and dividends declared.',
    optional: true,
    defaultChecked: true,
  },
  {
    key: 'balanceSheetReview',
    title: 'Balance Sheet Review',
    kind: 'grid',
    purpose: 'Summarise each balance sheet account, confirm support exists and note any review comments.',
    howTo: 'List the account, tie to working papers, confirm whether reconciled, and explain open items.',
    optional: true,
    defaultChecked: true,
    columns: [
      { key: 'account', label: 'Account', type: 'text', width: 220 },
      { key: 'tbBalance', label: 'TB balance', type: 'number', width: 130 },
      { key: 'reconciled', label: 'Reconciled?', type: 'select', options: ['Yes', 'No'], width: 110 },
      { key: 'crossRef', label: 'Cross-reference', type: 'text', width: 180 },
      { key: 'note', label: 'Note', type: 'text', width: 220 },
    ],
  },
]

export function getSchedule(key: string): ScheduleDef | undefined {
  return SCHEDULES.find((s) => s.key === key)
}

export const SCHEDULE_KEYS = SCHEDULES.map((s) => s.key)

// ─── Checklist (fixed items, mirrors the template's Checklist tab) ─────────────

export interface ChecklistItem {
  section: string
  text: string
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { section: 'Initial Preparation and Opening Balances', text: 'Carry out risk assessment of client and ensure entered on Client Engager' },
  { section: 'Initial Preparation and Opening Balances', text: 'Confirm source of accounting records – QuickBooks / Xero / Spreadsheet / Other' },
  { section: 'Initial Preparation and Opening Balances', text: 'Confirm accounting software shows correct opening balance agreeing to prior year accounts – carry out opening balance comparison and adjust where necessary' },
  { section: 'Initial Preparation and Opening Balances', text: 'If opening balances incorrect, identify variances and post adjustments in accounting software' },
  { section: 'Initial Preparation and Opening Balances', text: 'Ensure client is set up on TaxCalc ready to enter or import Trial Balance' },
  { section: 'Initial Preparation and Opening Balances', text: 'If not on TaxCalc, add client using details on Client Engager' },
  { section: 'Initial Preparation and Opening Balances', text: 'Review prior year accounts to understand business and required balance sheet reconciliations' },
  { section: 'Bank', text: 'Are all bank accounts reconciled (including savings accounts)?' },
  { section: 'Bank', text: 'Are all credit card statements reconciled?' },
  { section: 'Sales', text: 'Have debtors been reconciled to the ledger?' },
  { section: 'Sales', text: 'Are there any bad debts to write off?' },
  { section: 'Purchases', text: 'Have creditors been reconciled to the ledger?' },
  { section: 'Purchases', text: 'Is there any significant variation in Gross Profit compared to prior year?' },
  { section: 'Dividends', text: 'Has the client distributed excessive dividends?' },
  { section: 'Dividends', text: 'Is there an opportunity to pay another shareholder?' },
  { section: 'Tax Savings', text: 'Is there an opportunity to pay a director’s pension contribution?' },
  { section: 'Tax Savings', text: 'Is there an opportunity to pay relative life assurance?' },
  { section: 'Year End Journals', text: 'Have all year-end journals been posted to the client’s accounting software?' },
  { section: 'Year End Journals', text: 'Fixed Asset Register reconciled' },
  { section: 'Year End Journals', text: 'VAT Control Account reconciled' },
  { section: 'Year End Journals', text: 'Wages Control Account reconciled' },
  { section: 'Year End Journals', text: 'PAYE Control Account reconciled' },
  { section: 'Year End Journals', text: 'Loan Accounts reconciled' },
  { section: 'Year End Journals', text: 'Directors Loan Account reconciled' },
]
