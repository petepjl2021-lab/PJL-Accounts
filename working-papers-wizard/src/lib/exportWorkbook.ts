import ExcelJS from 'exceljs'
import { ALWAYS_INCLUDED, getSchedule, GridColumn } from './schedules'
import {
  ChecklistData,
  DividendsData,
  DlaData,
  FixedAssetsData,
  GridData,
  JournalEntriesData,
  NotesQueriesData,
  OpeningBalancesData,
  TrialBalanceData,
  CorporationTaxData,
} from './scheduleData'
import { calculateCorporationTax } from './ct'

const TEAL = '0F766E'
const TEAL_LIGHT = 'CCFBEF'
const GREY = 'F1F5F9'
const CURRENCY = '£#,##0.00;[Red]-£#,##0.00'

export interface JobForExport {
  yearEndDate: Date
  preparedBy: string | null
  preparedDate: Date | null
  reviewedBy: string | null
  reviewedDate: Date | null
}
export interface ClientForExport {
  name: string
  companyNumber: string | null
  accountingStandard: string
}
export interface ScheduleRecordForExport {
  key: string
  data: string
  status: string
  preparedBy: string | null
  reviewedBy: string | null
}

export async function buildWorkbook(
  job: JobForExport,
  client: ClientForExport,
  records: ScheduleRecordForExport[]
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'WP Wizard'
  wb.created = new Date()

  const byKey = new Map(records.map((r) => [r.key, r]))
  const includedKeys = records.map((r) => r.key)

  addCoverSheet(wb, job, client)
  addIndexSheet(wb, records, includedKeys)
  addNotesAndQueries(wb, byKey.get('notesQueries'))
  addChecklist(wb, byKey.get('checklist'))

  for (const key of includedKeys) {
    if ((ALWAYS_INCLUDED as readonly string[]).includes(key)) continue
    const def = getSchedule(key)
    const record = byKey.get(key)
    if (!def || !record) continue

    switch (def.kind) {
      case 'trialBalance':
        addTrialBalance(wb, def.title, record.data)
        break
      case 'openingBalances':
        addOpeningBalances(wb, def.title, record.data)
        break
      case 'journalEntries':
        addJournalEntries(wb, def.title, record.data)
        break
      case 'fixedAssets':
        addFixedAssets(wb, def.title, record.data)
        break
      case 'dla':
        addDla(wb, def.title, record.data)
        break
      case 'corporationTax':
        addCorporationTax(wb, def.title, record.data)
        break
      case 'dividends':
        addDividends(wb, def.title, record.data)
        break
      case 'grid':
      default:
        addGenericGrid(wb, def.title, def.columns || [], record.data)
        break
    }
  }

  return wb
}

// ─── Shared styling helpers ─────────────────────────────────────────────────

function fmtDate(d: Date | null | undefined): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB')
}

function titleRow(ws: ExcelJS.Worksheet, text: string, span: number) {
  ws.mergeCells(1, 1, 1, Math.max(span, 4))
  const cell = ws.getCell(1, 1)
  cell.value = text
  cell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } }
  cell.alignment = { vertical: 'middle' }
  ws.getRow(1).height = 24
}

function clientHeaderBlock(ws: ExcelJS.Worksheet, client: ClientForExport, job: JobForExport, startRow: number) {
  const rows: [string, string][] = [
    ['Client', client.name],
    ['Company Number', client.companyNumber || ''],
    ['Year End', fmtDate(job.yearEndDate)],
    ['Accounting Standard', client.accountingStandard],
    ['Prepared By', `${job.preparedBy || ''}${job.preparedDate ? '  (' + fmtDate(job.preparedDate) + ')' : ''}`],
    ['Reviewed By', `${job.reviewedBy || ''}${job.reviewedDate ? '  (' + fmtDate(job.reviewedDate) + ')' : ''}`],
  ]
  rows.forEach(([label, value], i) => {
    const r = startRow + i
    ws.getCell(r, 1).value = label
    ws.getCell(r, 1).font = { bold: true }
    ws.getCell(r, 2).value = value
  })
  return startRow + rows.length + 1
}

function headerRow(ws: ExcelJS.Worksheet, rowNum: number, labels: string[], startCol = 1) {
  labels.forEach((label, i) => {
    const cell = ws.getCell(rowNum, startCol + i)
    cell.value = label
    cell.font = { bold: true, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } }
    cell.border = thinBorder()
    cell.alignment = { vertical: 'middle', wrapText: true }
  })
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: 'thin', color: { argb: 'CBD5E1' } }
  return { top: side, left: side, bottom: side, right: side }
}

function dataCell(ws: ExcelJS.Worksheet, r: number, c: number, value: string | number | { formula: string } | undefined, numberFormat?: string) {
  const cell = ws.getCell(r, c)
  if (value && typeof value === 'object' && 'formula' in value) {
    cell.value = { formula: value.formula }
  } else {
    cell.value = value ?? ''
  }
  cell.border = thinBorder()
  if (numberFormat) cell.numFmt = numberFormat
  return cell
}

function totalsRow(ws: ExcelJS.Worksheet, r: number, label: string, labelCol: number, sumCols: { col: number; formula: string }[]) {
  ws.getCell(r, labelCol).value = label
  ws.getCell(r, labelCol).font = { bold: true }
  sumCols.forEach(({ col, formula }) => {
    const cell = ws.getCell(r, col)
    cell.value = { formula }
    cell.font = { bold: true }
    cell.numFmt = CURRENCY
    cell.border = thinBorder()
  })
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

function colLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - m) / 26)
  }
  return s
}

// ─── Cover Sheet ─────────────────────────────────────────────────────────────

function addCoverSheet(wb: ExcelJS.Workbook, job: JobForExport, client: ClientForExport) {
  const ws = wb.addWorksheet('Cover Sheet')
  ws.columns = [{ width: 26 }, { width: 40 }]
  titleRow(ws, `${client.name} — Working Papers`, 2)
  clientHeaderBlock(ws, client, job, 3)
}

// ─── Index ───────────────────────────────────────────────────────────────────

function addIndexSheet(wb: ExcelJS.Workbook, records: ScheduleRecordForExport[], includedKeys: string[]) {
  const ws = wb.addWorksheet('Index')
  ws.columns = [{ width: 32 }, { width: 14 }, { width: 14 }, { width: 40 }]
  titleRow(ws, 'Index', 4)
  headerRow(ws, 3, ['Schedule', 'Prepared?', 'Reviewed?', 'Notes'])

  let r = 4
  const titled = includedKeys
    .filter((k) => k !== 'coverSheet' && k !== 'index')
    .map((k) => ({ key: k, title: k === 'notesQueries' ? 'Notes and Queries' : k === 'checklist' ? 'Checklist' : getSchedule(k)?.title || k }))

  for (const { key, title } of titled) {
    const rec = records.find((x) => x.key === key)
    dataCell(ws, r, 1, title)
    dataCell(ws, r, 2, rec?.preparedBy ? 'Yes' : rec?.status === 'DONE' || rec?.status === 'IN_PROGRESS' ? 'In progress' : 'No')
    dataCell(ws, r, 3, rec?.reviewedBy ? 'Yes' : 'No')
    dataCell(ws, r, 4, '')
    r++
  }
}

// ─── Notes and Queries ───────────────────────────────────────────────────────

function addNotesAndQueries(wb: ExcelJS.Workbook, record: ScheduleRecordForExport | undefined) {
  const ws = wb.addWorksheet('Notes and Queries')
  ws.columns = [{ width: 8 }, { width: 20 }, { width: 34 }, { width: 18 }, { width: 12 }, { width: 34 }, { width: 16 }, { width: 14 }]
  titleRow(ws, 'Notes and Queries', 8)

  const data: NotesQueriesData = record ? safeParse(record.data, { rows: [] }) : { rows: [] }
  const headerAt = 3
  headerRow(ws, headerAt, ['Ref', 'Area / Sheet', 'Query / Note', 'Requested From', 'Status', 'Client Response / Resolution', 'Cleared By', 'Cleared Date'])

  let r = headerAt + 1
  data.rows.forEach((row, i) => {
    dataCell(ws, r, 1, i + 1)
    dataCell(ws, r, 2, row.area)
    dataCell(ws, r, 3, row.query)
    dataCell(ws, r, 4, row.requestedFrom)
    dataCell(ws, r, 5, row.status)
    dataCell(ws, r, 6, row.response)
    dataCell(ws, r, 7, row.clearedBy)
    dataCell(ws, r, 8, row.clearedDate)
    r++
  })

  const lastRow = Math.max(r - 1, headerAt + 1)
  ws.getCell(1, 10).value = 'Open items:'
  ws.getCell(1, 11).value = { formula: `COUNTIF(E${headerAt + 1}:E${lastRow},"Open")` }
  ws.getCell(2, 10).value = 'Waiting on client:'
  ws.getCell(2, 11).value = { formula: `COUNTIF(E${headerAt + 1}:E${lastRow},"Waiting")` }
}

// ─── Checklist ───────────────────────────────────────────────────────────────

function addChecklist(wb: ExcelJS.Workbook, record: ScheduleRecordForExport | undefined) {
  const ws = wb.addWorksheet('Checklist')
  ws.columns = [{ width: 26 }, { width: 46 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 30 }, { width: 16 }, { width: 12 }]
  titleRow(ws, 'Quality Control Checklist', 8)

  const data: ChecklistData = record ? safeParse(record.data, { items: [] }) : { items: [] }
  const headerAt = 3
  headerRow(ws, headerAt, ['Section', 'Checklist Item', 'Yes', 'No', 'N/A', 'Notes', 'Completed By', 'Date'])

  let r = headerAt + 1
  let lastSection = ''
  for (const item of data.items) {
    if (item.section !== lastSection) {
      dataCell(ws, r, 1, item.section).font = { bold: true }
      lastSection = item.section
    }
    dataCell(ws, r, 2, item.text)
    dataCell(ws, r, 3, item.response === 'Yes' ? 'X' : '')
    dataCell(ws, r, 4, item.response === 'No' ? 'X' : '')
    dataCell(ws, r, 5, item.response === 'N/A' ? 'X' : '')
    dataCell(ws, r, 6, item.notes)
    dataCell(ws, r, 7, item.completedBy)
    dataCell(ws, r, 8, item.date)
    r++
  }
}

// ─── Trial Balance ───────────────────────────────────────────────────────────

function addTrialBalance(wb: ExcelJS.Workbook, title: string, raw: string) {
  const ws = wb.addWorksheet(title)
  ws.columns = [{ width: 12 }, { width: 32 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 30 }]
  titleRow(ws, title, 7)

  const data: TrialBalanceData = safeParse(raw, { rows: [] })
  const headerAt = 3
  headerRow(ws, headerAt, ['Nominal', 'Description', 'Prior Year', 'Current Year', 'Adjustment', 'Final TB', 'Comment'])

  let r = headerAt + 1
  data.rows.forEach((row) => {
    dataCell(ws, r, 1, row.nominal)
    dataCell(ws, r, 2, row.description)
    dataCell(ws, r, 3, row.priorYear ?? '', CURRENCY)
    dataCell(ws, r, 4, num(row.currentYear), CURRENCY)
    dataCell(ws, r, 5, num(row.adjustment), CURRENCY)
    dataCell(ws, r, 6, { formula: `D${r}+E${r}` }, CURRENCY)
    dataCell(ws, r, 7, row.comment)
    r++
  })
  const lastData = r - 1
  if (lastData >= headerAt + 1) {
    totalsRow(ws, r, 'Total (should net to nil if debits are + and credits are -)', 2, [
      { col: 4, formula: `SUM(D${headerAt + 1}:D${lastData})` },
      { col: 5, formula: `SUM(E${headerAt + 1}:E${lastData})` },
      { col: 6, formula: `SUM(F${headerAt + 1}:F${lastData})` },
    ])
  }
}

// ─── Opening Balances ────────────────────────────────────────────────────────

function addOpeningBalances(wb: ExcelJS.Workbook, title: string, raw: string) {
  const ws = wb.addWorksheet(title)
  ws.columns = [{ width: 16 }, { width: 24 }, { width: 14 }, { width: 14 }, { width: 30 }]
  titleRow(ws, title, 5)

  const data: OpeningBalancesData = safeParse(raw, { accountsRows: [], correctionRows: [] })

  ws.getCell(3, 1).value = 'Prior Year Accounts Balances'
  ws.getCell(3, 1).font = { bold: true }
  headerRow(ws, 4, ['Nominal Code', 'Debit', 'Credit', 'Notes'])
  let r = 5
  data.accountsRows.forEach((row) => {
    dataCell(ws, r, 1, row.nominalCode)
    dataCell(ws, r, 2, num(row.debit), CURRENCY)
    dataCell(ws, r, 3, num(row.credit), CURRENCY)
    dataCell(ws, r, 4, row.notes)
    r++
  })
  const accountsLast = r - 1
  if (accountsLast >= 5) {
    totalsRow(ws, r, 'Total', 1, [
      { col: 2, formula: `SUM(B5:B${accountsLast})` },
      { col: 3, formula: `SUM(C5:C${accountsLast})` },
    ])
    r++
  }

  r += 2
  ws.getCell(r, 1).value = 'Correction Journals (to match software TB to prior year accounts)'
  ws.getCell(r, 1).font = { bold: true }
  r++
  const journalHeaderRow = r
  headerRow(ws, journalHeaderRow, ['Nominal Code', 'Nominal Name', 'Debit', 'Credit', 'Notes'], 1)
  r++
  const journalStart = r
  data.correctionRows.forEach((row) => {
    dataCell(ws, r, 1, row.nominalCode)
    dataCell(ws, r, 2, row.nominalName)
    dataCell(ws, r, 3, num(row.debit), CURRENCY)
    dataCell(ws, r, 4, num(row.credit), CURRENCY)
    dataCell(ws, r, 5, row.notes)
    r++
  })
  const journalLast = r - 1
  if (journalLast >= journalStart) {
    totalsRow(ws, r, 'Total', 2, [
      { col: 3, formula: `SUM(C${journalStart}:C${journalLast})` },
      { col: 4, formula: `SUM(D${journalStart}:D${journalLast})` },
    ])
    r++
    ws.getCell(r, 2).value = 'Difference (should be nil)'
    ws.getCell(r, 3).value = { formula: `C${r - 1}-D${r - 1}` }
    ws.getCell(r, 3).numFmt = CURRENCY
  }
}

// ─── Journal Entries ─────────────────────────────────────────────────────────

function addJournalEntries(wb: ExcelJS.Workbook, title: string, raw: string) {
  const ws = wb.addWorksheet(title)
  ws.columns = [{ width: 14 }, { width: 32 }, { width: 14 }, { width: 14 }, { width: 40 }]
  titleRow(ws, title, 5)

  const data: JournalEntriesData = safeParse(raw, { rows: [] })
  const headerAt = 3
  headerRow(ws, headerAt, ['Journal Ref', 'Description', 'Debit', 'Credit', 'Explanation'])

  let r = headerAt + 1
  data.rows.forEach((row) => {
    dataCell(ws, r, 1, row.ref)
    dataCell(ws, r, 2, row.description)
    dataCell(ws, r, 3, num(row.debit), CURRENCY)
    dataCell(ws, r, 4, num(row.credit), CURRENCY)
    dataCell(ws, r, 5, row.explanation)
    r++
  })
  const lastData = r - 1
  if (lastData >= headerAt + 1) {
    totalsRow(ws, r, 'Total', 2, [
      { col: 3, formula: `SUM(C${headerAt + 1}:C${lastData})` },
      { col: 4, formula: `SUM(D${headerAt + 1}:D${lastData})` },
    ])
    r++
    ws.getCell(r, 2).value = 'Difference (should be nil)'
    ws.getCell(r, 3).value = { formula: `C${r - 1}-D${r - 1}` }
    ws.getCell(r, 3).numFmt = CURRENCY
  }
}

// ─── Fixed Assets & Depreciation ─────────────────────────────────────────────

function addFixedAssets(wb: ExcelJS.Workbook, title: string, raw: string) {
  const ws = wb.addWorksheet(title)
  ws.columns = [
    { width: 12 }, { width: 22 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 12 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
  ]
  titleRow(ws, title, 11)

  const data: FixedAssetsData = safeParse(raw, { classes: [] })
  let r = 3
  const chargeCells: string[] = []
  const nbvCells: string[] = []
  const costCfCells: string[] = []

  for (const cls of data.classes) {
    ws.getCell(r, 1).value = cls.name
    ws.getCell(r, 1).font = { bold: true }
    ws.getCell(r, 3).value = `${cls.ratePct}% ${cls.method}`
    r++
    headerRow(ws, r, ['Date', 'Asset', 'Cost B/F', 'Additions', 'Disposals', 'Cost C/F', 'Months', 'Dep B/F', 'Charge for Year', 'Dep C/F', 'NBV'])
    r++
    const start = r
    cls.rows.forEach((row) => {
      dataCell(ws, r, 1, row.date)
      dataCell(ws, r, 2, row.asset)
      dataCell(ws, r, 3, num(row.bf), CURRENCY)
      dataCell(ws, r, 4, num(row.additions), CURRENCY)
      dataCell(ws, r, 5, num(row.disposal), CURRENCY)
      dataCell(ws, r, 6, { formula: `C${r}+D${r}+E${r}` }, CURRENCY)
      dataCell(ws, r, 7, row.months === '' ? '' : num(row.months))
      dataCell(ws, r, 8, num(row.depBf), CURRENCY)
      dataCell(ws, r, 9, { formula: `F${r}*${cls.ratePct}%/12*IF(G${r}="",12,G${r})` }, CURRENCY)
      dataCell(ws, r, 10, { formula: `H${r}+I${r}` }, CURRENCY)
      dataCell(ws, r, 11, { formula: `F${r}-J${r}` }, CURRENCY)
      r++
    })
    const last = r - 1
    if (last >= start) {
      totalsRow(ws, r, `Total — ${cls.name}`, 2, [
        { col: 3, formula: `SUM(C${start}:C${last})` },
        { col: 4, formula: `SUM(D${start}:D${last})` },
        { col: 5, formula: `SUM(E${start}:E${last})` },
        { col: 6, formula: `SUM(F${start}:F${last})` },
        { col: 8, formula: `SUM(H${start}:H${last})` },
        { col: 9, formula: `SUM(I${start}:I${last})` },
        { col: 10, formula: `SUM(J${start}:J${last})` },
        { col: 11, formula: `SUM(K${start}:K${last})` },
      ])
      chargeCells.push(`I${r}`)
      nbvCells.push(`K${r}`)
      costCfCells.push(`F${r}`)
      r++
    }
    r++ // blank row between classes
  }

  r++
  ws.getCell(r, 1).value = 'Total depreciation charge'
  ws.getCell(r, 1).font = { bold: true }
  ws.getCell(r, 3).value = chargeCells.length ? { formula: `SUM(${chargeCells.join(',')})` } : 0
  ws.getCell(r, 3).numFmt = CURRENCY
  r++
  ws.getCell(r, 1).value = 'Total net book value'
  ws.getCell(r, 1).font = { bold: true }
  ws.getCell(r, 3).value = nbvCells.length ? { formula: `SUM(${nbvCells.join(',')})` } : 0
  ws.getCell(r, 3).numFmt = CURRENCY
  r++
  ws.getCell(r, 1).value = 'Total cost carried forward'
  ws.getCell(r, 1).font = { bold: true }
  ws.getCell(r, 3).value = costCfCells.length ? { formula: `SUM(${costCfCells.join(',')})` } : 0
  ws.getCell(r, 3).numFmt = CURRENCY
}

// ─── Directors Loan Account ──────────────────────────────────────────────────

function addDla(wb: ExcelJS.Workbook, title: string, raw: string) {
  const ws = wb.addWorksheet(title)
  ws.columns = [{ width: 14 }, { width: 32 }, { width: 14 }, { width: 24 }, { width: 16 }]
  titleRow(ws, title, 5)

  const data: DlaData = safeParse(raw, { openingBalance: 0, rows: [] })
  ws.getCell(3, 1).value = 'Opening Balance (amount owed TO director, credit +)'
  ws.getCell(3, 1).font = { bold: true }
  ws.getCell(3, 3).value = num(data.openingBalance)
  ws.getCell(3, 3).numFmt = CURRENCY

  const headerAt = 5
  headerRow(ws, headerAt, ['Date', 'Description', 'Amount', 'Direction', 'Running Balance'])
  let r = headerAt + 1
  const start = r
  data.rows.forEach((row) => {
    dataCell(ws, r, 1, row.date)
    dataCell(ws, r, 2, row.description)
    dataCell(ws, r, 3, num(row.amount), CURRENCY)
    dataCell(ws, r, 4, row.direction)
    const prevBalanceRef = r === start ? '$C$3' : `E${r - 1}`
    dataCell(ws, r, 5, { formula: `${prevBalanceRef}+IF(D${r}="Debit (owed by director)",-C${r},C${r})` }, CURRENCY)
    r++
  })
  const last = r - 1
  ws.getCell(r, 2).value = 'Closing Balance'
  ws.getCell(r, 2).font = { bold: true }
  ws.getCell(r, 5).value = { formula: last >= start ? `E${last}` : `C3` }
  ws.getCell(r, 5).numFmt = CURRENCY
  ws.getCell(r, 5).font = { bold: true }
}

// ─── Corporation Tax Computation ─────────────────────────────────────────────

function addCorporationTax(wb: ExcelJS.Workbook, title: string, raw: string) {
  const ws = wb.addWorksheet(title)
  ws.columns = [{ width: 36 }, { width: 16 }, { width: 40 }]
  titleRow(ws, title, 3)

  const data: CorporationTaxData = safeParse(raw, {
    profitBeforeTax: 0,
    addBacks: [],
    capitalAllowances: [],
    overrideTaxableProfit: null,
    overrideTaxDue: null,
  })

  let r = 3
  ws.getCell(r, 1).value = 'Profit Before Tax (per TB)'
  ws.getCell(r, 1).font = { bold: true }
  ws.getCell(r, 2).value = num(data.profitBeforeTax)
  ws.getCell(r, 2).numFmt = CURRENCY
  const pbtRow = r
  r += 2

  ws.getCell(r, 1).value = 'Add Back: Disallowable Expenses'
  ws.getCell(r, 1).font = { bold: true }
  r++
  const addBackStart = r
  data.addBacks.forEach((item) => {
    dataCell(ws, r, 1, item.description)
    dataCell(ws, r, 2, num(item.amount), CURRENCY)
    r++
  })
  const addBackEnd = r - 1
  const addBackTotalRow = r
  ws.getCell(r, 1).value = 'Total add-backs'
  ws.getCell(r, 2).value = addBackEnd >= addBackStart ? { formula: `SUM(B${addBackStart}:B${addBackEnd})` } : 0
  ws.getCell(r, 2).numFmt = CURRENCY
  r += 2

  ws.getCell(r, 1).value = 'Less: Capital Allowances'
  ws.getCell(r, 1).font = { bold: true }
  r++
  const capAllStart = r
  data.capitalAllowances.forEach((item) => {
    dataCell(ws, r, 1, item.description)
    dataCell(ws, r, 2, num(item.amount), CURRENCY)
    r++
  })
  const capAllEnd = r - 1
  const capAllTotalRow = r
  ws.getCell(r, 1).value = 'Total capital allowances'
  ws.getCell(r, 2).value = capAllEnd >= capAllStart ? { formula: `SUM(B${capAllStart}:B${capAllEnd})` } : 0
  ws.getCell(r, 2).numFmt = CURRENCY
  r += 2

  ws.getCell(r, 1).value = 'Taxable Profit'
  ws.getCell(r, 1).font = { bold: true }
  ws.getCell(r, 2).value = { formula: `B${pbtRow}+B${addBackTotalRow}-B${capAllTotalRow}` }
  ws.getCell(r, 2).numFmt = CURRENCY
  const taxableProfitRow = r
  r += 2

  const addBacksTotal = data.addBacks.reduce((s, i) => s + num(i.amount), 0)
  const capAllTotal = data.capitalAllowances.reduce((s, i) => s + num(i.amount), 0)
  const taxableProfit = data.overrideTaxableProfit ?? num(data.profitBeforeTax) + addBacksTotal - capAllTotal
  const ct = calculateCorporationTax(taxableProfit)

  ws.getCell(r, 1).value = 'Rate Applied'
  ws.getCell(r, 2).value = ct.rateApplied
  r++
  ws.getCell(r, 1).value = 'Effective Rate'
  ws.getCell(r, 2).value = `${ct.effectiveRatePct.toFixed(2)}%`
  r++
  if (ct.marginalRelief > 0) {
    ws.getCell(r, 1).value = 'Marginal Relief'
    ws.getCell(r, 2).value = ct.marginalRelief
    ws.getCell(r, 2).numFmt = CURRENCY
    r++
  }
  ws.getCell(r, 1).value = 'Corporation Tax Due'
  ws.getCell(r, 1).font = { bold: true }
  ws.getCell(r, 2).value = data.overrideTaxDue ?? ct.corporationTaxDue
  ws.getCell(r, 2).numFmt = CURRENCY
  ws.getCell(r, 2).font = { bold: true }
  r += 2
  ws.getCell(r, 1).value = 'Note: estimate assumes a single company (not part of an associated group). Verify before filing.'
  ws.getCell(r, 1).font = { italic: true, size: 9, color: { argb: '64748B' } }
}

// ─── Dividends & Reserves ─────────────────────────────────────────────────────

function addDividends(wb: ExcelJS.Workbook, title: string, raw: string) {
  const ws = wb.addWorksheet(title)
  ws.columns = [{ width: 14 }, { width: 32 }, { width: 16 }]
  titleRow(ws, title, 3)

  const data: DividendsData = safeParse(raw, { reservesBroughtForward: 0, currentYearProfit: 0, dividends: [] })
  let r = 3
  ws.getCell(r, 2).value = 'Reserves Brought Forward'
  ws.getCell(r, 3).value = num(data.reservesBroughtForward)
  ws.getCell(r, 3).numFmt = CURRENCY
  const bfRow = r
  r++
  ws.getCell(r, 2).value = 'Current Year Profit After Tax'
  ws.getCell(r, 3).value = num(data.currentYearProfit)
  ws.getCell(r, 3).numFmt = CURRENCY
  const profitRow = r
  r += 2

  headerRow(ws, r, ['Date', 'Description', 'Amount'])
  r++
  const start = r
  data.dividends.forEach((row) => {
    dataCell(ws, r, 1, row.date)
    dataCell(ws, r, 2, row.description)
    dataCell(ws, r, 3, num(row.amount), CURRENCY)
    r++
  })
  const last = r - 1
  const divTotalRow = r
  ws.getCell(r, 2).value = 'Total Dividends'
  ws.getCell(r, 2).font = { bold: true }
  ws.getCell(r, 3).value = last >= start ? { formula: `SUM(C${start}:C${last})` } : 0
  ws.getCell(r, 3).numFmt = CURRENCY
  r += 2

  ws.getCell(r, 2).value = 'Reserves Carried Forward'
  ws.getCell(r, 2).font = { bold: true }
  ws.getCell(r, 3).value = { formula: `C${bfRow}+C${profitRow}-C${divTotalRow}` }
  ws.getCell(r, 3).numFmt = CURRENCY
  ws.getCell(r, 3).font = { bold: true }
}

// ─── Generic grid schedules ───────────────────────────────────────────────────

function addGenericGrid(wb: ExcelJS.Workbook, title: string, columns: GridColumn[], raw: string) {
  const ws = wb.addWorksheet(title)
  ws.columns = columns.map((c) => ({ width: Math.max(12, Math.round((c.width || 160) / 7)) }))
  titleRow(ws, title, columns.length)

  const data: GridData = safeParse(raw, { rows: [] })
  const headerAt = 3
  headerRow(ws, headerAt, columns.map((c) => c.label))

  let r = headerAt + 1
  data.rows
    .filter((row) => columns.some((c) => row[c.key] !== undefined && row[c.key] !== ''))
    .forEach((row) => {
      columns.forEach((c, i) => {
        const val = row[c.key]
        const isVariance = title === 'Bank Reconciliation' && c.key === 'variance'
        if (c.type === 'number') {
          dataCell(ws, r, i + 1, num(val), CURRENCY)
        } else {
          dataCell(ws, r, i + 1, (val as string) ?? '')
        }
      })
      // Bank Reconciliation: compute variance = statement - ledger
      if (title === 'Bank Reconciliation') {
        const statementCol = columns.findIndex((c) => c.key === 'statement') + 1
        const ledgerCol = columns.findIndex((c) => c.key === 'ledger') + 1
        if (statementCol && ledgerCol) {
          const varCol = columns.length + 1
          if (r === headerAt + 1) {
            ws.getColumn(varCol).width = 14
            headerRow(ws, headerAt, ['Variance'], varCol)
          }
          dataCell(ws, r, varCol, { formula: `${colLetter(statementCol)}${r}-${colLetter(ledgerCol)}${r}` }, CURRENCY)
        }
      }
      r++
    })

  const lastData = r - 1
  const numericCols = columns.map((c, i) => ({ c, i })).filter((x) => x.c.type === 'number')
  if (lastData >= headerAt + 1 && numericCols.length > 0) {
    totalsRow(
      ws,
      r,
      'Total',
      1,
      numericCols.map((x) => ({ col: x.i + 1, formula: `SUM(${colLetter(x.i + 1)}${headerAt + 1}:${colLetter(x.i + 1)}${lastData})` }))
    )
  }
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
