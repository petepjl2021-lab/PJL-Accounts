'use client'

export interface EditableColumn {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  options?: string[]
  width?: number
  computed?: (row: Record<string, any>) => number | string
}

export default function EditableGrid({
  columns,
  rows,
  onChange,
  onAddRow,
  onRemoveRow,
}: {
  columns: EditableColumn[]
  rows: Record<string, any>[]
  onChange: (rows: Record<string, any>[]) => void
  onAddRow: () => void
  onRemoveRow?: (index: number) => void
}) {
  function updateCell(i: number, key: string, value: string | number) {
    const next = rows.slice()
    next[i] = { ...next[i], [key]: value }
    onChange(next)
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="grid-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ minWidth: c.width || 120 }}>
                  {c.label}
                </th>
              ))}
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.computed ? (
                      <div className="px-2 py-1.5 text-slate-500 bg-slate-50">{formatComputed(c.computed(row))}</div>
                    ) : c.type === 'select' ? (
                      <select value={row[c.key] ?? ''} onChange={(e) => updateCell(i, c.key, e.target.value)}>
                        <option value=""></option>
                        {c.options?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'}
                        step={c.type === 'number' ? '0.01' : undefined}
                        value={row[c.key] ?? ''}
                        onChange={(e) =>
                          updateCell(i, c.key, c.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)
                        }
                      />
                    )}
                  </td>
                ))}
                <td className="text-center bg-white">
                  <button
                    type="button"
                    className="text-slate-300 hover:text-red-500 px-1.5"
                    onClick={() => onRemoveRow?.(i)}
                    title="Remove row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn-secondary mt-2 text-xs" onClick={onAddRow} type="button">
        + Add row
      </button>
    </div>
  )
}

function formatComputed(v: number | string): string {
  if (typeof v === 'number') {
    return v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return v
}
