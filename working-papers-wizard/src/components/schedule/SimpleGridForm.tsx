'use client'

import ScheduleStepFrame from './ScheduleStepFrame'
import EditableGrid, { EditableColumn } from './EditableGrid'
import PasteImportBar from './PasteImportBar'
import { ScheduleDef } from '@/lib/schedules'
import { GridData, defaultGridData } from '@/lib/scheduleData'
import { ScheduleRecord } from '@/types'

export default function SimpleGridForm({
  def,
  jobId,
  record,
  onBack,
  onNext,
  isFirst,
  isLast,
}: {
  def: ScheduleDef
  jobId: string
  record: ScheduleRecord
  onBack?: () => void
  onNext?: () => void
  isFirst?: boolean
  isLast?: boolean
}) {
  const columns = def.columns || []
  const isBankRec = def.key === 'bankReconciliation'

  const gridColumns: EditableColumn[] = columns.map((c) => ({
    key: c.key,
    label: c.label,
    type: c.type,
    options: c.options,
    width: c.width,
  }))
  if (isBankRec) {
    gridColumns.push({
      key: 'variance',
      label: 'Variance',
      type: 'number',
      computed: (row) => (num(row.statement) - num(row.ledger)),
    })
  }

  return (
    <ScheduleStepFrame<GridData>
      title={def.title}
      purpose={def.purpose}
      howTo={def.howTo}
      jobId={jobId}
      scheduleKey={def.key}
      record={record}
      defaultData={defaultGridData()}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
    >
      {(data, setData) => (
        <div className="space-y-3">
          <div className="flex justify-end">
            <PasteImportBar
              targets={columns.map((c) => ({ key: c.key, label: c.label, numeric: c.type === 'number' }))}
              onImport={(rows) => setData({ rows: [...data.rows.filter((r) => Object.keys(r).length > 0), ...rows] })}
            />
          </div>
          <EditableGrid
            columns={gridColumns}
            rows={data.rows}
            onChange={(rows) => setData({ rows })}
            onAddRow={() => setData({ rows: [...data.rows, {}] })}
            onRemoveRow={(i) => setData({ rows: data.rows.filter((_, idx) => idx !== i) })}
          />
        </div>
      )}
    </ScheduleStepFrame>
  )
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}
