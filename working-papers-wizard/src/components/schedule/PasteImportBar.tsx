'use client'

import { useState } from 'react'
import { parsePastedTable, parseNumericCell } from '@/lib/pasteParse'

export interface ImportTarget {
  key: string
  label: string
  numeric?: boolean
}

export default function PasteImportBar({
  targets,
  onImport,
}: {
  targets: ImportTarget[]
  onImport: (rows: Record<string, any>[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [table, setTable] = useState<string[][]>([])
  const [mapping, setMapping] = useState<string[]>([])

  function parse() {
    const t = parsePastedTable(text)
    setTable(t)
    const colCount = t[0]?.length || 0
    const guess = Array.from({ length: colCount }, (_, i) => targets[i]?.key || '')
    setMapping(guess)
  }

  function confirmImport() {
    const rows = table
      .map((cells) => {
        const row: Record<string, any> = {}
        mapping.forEach((key, i) => {
          if (!key) return
          const target = targets.find((t) => t.key === key)
          const raw = cells[i] ?? ''
          row[key] = target?.numeric ? parseNumericCell(raw) : raw
        })
        return row
      })
      .filter((r) => Object.values(r).some((v) => v !== '' && v !== 0))
    onImport(rows)
    reset()
  }

  function reset() {
    setOpen(false)
    setText('')
    setTable([])
    setMapping([])
  }

  if (!open) {
    return (
      <button type="button" className="btn-secondary text-xs" onClick={() => setOpen(true)}>
        Paste from spreadsheet
      </button>
    )
  }

  return (
    <div className="border border-brand-200 bg-brand-50 rounded-md p-3 space-y-3 w-full">
      <p className="text-xs text-slate-600">
        Copy rows straight from Xero, QuickBooks, Excel or a CSV export, then paste them below.
      </p>
      <textarea
        className="input-base font-mono text-xs"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste here…"
        autoFocus
      />
      <div className="flex gap-2">
        <button type="button" className="btn-secondary text-xs" onClick={parse} disabled={!text.trim()}>
          Parse
        </button>
        <button type="button" className="text-xs text-slate-500 px-2" onClick={reset}>
          Cancel
        </button>
      </div>
      {table.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-700 mb-1">Match each pasted column to a field:</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {mapping.map((m, i) => (
              <select
                key={i}
                className="input-base text-xs w-auto"
                value={m}
                onChange={(e) => {
                  const next = mapping.slice()
                  next[i] = e.target.value
                  setMapping(next)
                }}
              >
                <option value="">Column {i + 1} — ignore</option>
                {targets.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <div className="max-h-40 overflow-auto border border-slate-200 rounded bg-white">
            <table className="text-xs w-full">
              <tbody>
                {table.slice(0, 6).map((row, ri) => (
                  <tr key={ri} className="border-b border-slate-100">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {table.length} row(s) detected{table.length > 6 ? ' (showing first 6)' : ''}.
          </p>
          <button type="button" className="btn-primary text-xs mt-2" onClick={confirmImport}>
            Import {table.length} row(s)
          </button>
        </div>
      )}
    </div>
  )
}
