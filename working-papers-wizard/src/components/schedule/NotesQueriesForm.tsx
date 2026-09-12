'use client'

import ScheduleStepFrame from './ScheduleStepFrame'
import EditableGrid from './EditableGrid'
import { NotesQueriesData, defaultNotesQueriesData, QueryStatus } from '@/lib/scheduleData'
import { ScheduleRecord } from '@/types'

const STATUSES: QueryStatus[] = ['Open', 'Waiting', 'Cleared']

export default function NotesQueriesForm({
  jobId,
  record,
  onBack,
  onNext,
  isFirst,
  isLast,
}: {
  jobId: string
  record: ScheduleRecord
  onBack?: () => void
  onNext?: () => void
  isFirst?: boolean
  isLast?: boolean
}) {
  return (
    <ScheduleStepFrame<NotesQueriesData>
      title="Notes and Queries"
      purpose="Log missing records, client questions, review points and how each item was cleared."
      howTo="Add one line per query, update Status, and record the final response before sign-off."
      jobId={jobId}
      scheduleKey="notesQueries"
      record={record}
      defaultData={defaultNotesQueriesData()}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
    >
      {(data, setData) => {
        const open = data.rows.filter((r) => r.status === 'Open').length
        const waiting = data.rows.filter((r) => r.status === 'Waiting').length
        return (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700">Open: {open}</span>
              <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700">Waiting on client: {waiting}</span>
            </div>
            <EditableGrid
              columns={[
                { key: 'area', label: 'Area / Sheet', type: 'text', width: 160 },
                { key: 'query', label: 'Query / Note', type: 'text', width: 260 },
                { key: 'requestedFrom', label: 'Requested From', type: 'text', width: 140 },
                { key: 'status', label: 'Status', type: 'select', options: STATUSES, width: 110 },
                { key: 'response', label: 'Client Response / Resolution', type: 'text', width: 260 },
                { key: 'clearedBy', label: 'Cleared By', type: 'text', width: 110 },
                { key: 'clearedDate', label: 'Cleared Date', type: 'date', width: 130 },
              ]}
              rows={data.rows}
              onChange={(rows) => setData({ rows: rows as any })}
              onAddRow={() =>
                setData({
                  rows: [
                    ...data.rows,
                    { ref: '', area: '', query: '', requestedFrom: '', status: 'Open', response: '', clearedBy: '', clearedDate: '' },
                  ],
                })
              }
              onRemoveRow={(i) => setData({ rows: data.rows.filter((_, idx) => idx !== i) })}
            />
          </div>
        )
      }}
    </ScheduleStepFrame>
  )
}
