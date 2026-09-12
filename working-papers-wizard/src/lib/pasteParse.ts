// Parses text pasted from a spreadsheet (Xero, QuickBooks, Excel, CSV export)
// into a simple 2D array of cells, ready for column mapping.

export function parsePastedTable(text: string): string[][] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) return []

  const hasTabs = lines.some((l) => l.includes('\t'))
  if (hasTabs) {
    return lines.map((l) => l.split('\t').map((c) => c.trim()))
  }

  // Fall back to comma-separated, but keep numbers like "1,234.56" intact by
  // only splitting on commas that aren't between two digits.
  const hasCommas = lines.some((l) => l.includes(','))
  if (hasCommas) {
    return lines.map((l) => splitCsvLine(l))
  }

  // Fall back to runs of 2+ spaces (common when pasting from a plain-text report)
  return lines.map((l) => l.split(/\s{2,}/).map((c) => c.trim()))
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      // Don't split "1,234" style thousands separators: only split when the
      // comma is not immediately flanked by digits on both sides.
      const prev = line[i - 1]
      const next = line[i + 1]
      if (prev && next && /\d/.test(prev) && /\d/.test(next)) {
        current += ch
        continue
      }
      cells.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

export function parseNumericCell(cell: string | undefined): number {
  if (!cell) return 0
  const cleaned = cell.replace(/[£$,\s]/g, '').replace(/^\((.*)\)$/, '-$1')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}
