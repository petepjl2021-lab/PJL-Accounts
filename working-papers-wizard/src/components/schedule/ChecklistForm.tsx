'use client'

import ScheduleStepFrame from './ScheduleStepFrame'
import { ChecklistData, defaultChecklistData, ChecklistResponse } from '@/lib/scheduleData'
import { ScheduleRecord } from '@/types'

const RESPONSES: ChecklistResponse[] = ['Yes', 'No', 'N/A']

export default function ChecklistForm({
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
    <ScheduleStepFrame<ChecklistData>
      title="Quality Control Checklist"
      purpose="Use this as the quality control checklist before finalising the accounts and CT computation."
      howTo="Mark each item Yes / No / N/A, add notes where needed, and record who completed it."
      jobId={jobId}
      scheduleKey="checklist"
      record={record}
      defaultData={defaultChecklistData()}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
    >
      {(data, setData) => {
        function update(i: number, patch: Partial<ChecklistData['items'][number]>) {
          const items = data.items.slice()
          items[i] = { ...items[i], ...patch }
          setData({ items })
        }

        let lastSection = ''
        return (
          <div className="space-y-1">
            {data.items.map((item, i) => {
              const showSection = item.section !== lastSection
              lastSection = item.section
              return (
                <div key={i}>
                  {showSection && <div className="text-xs font-semibold text-brand-700 uppercase tracking-wide mt-4 mb-1">{item.section}</div>}
                  <div className="flex items-center gap-3 py-1.5 border-b border-slate-100 flex-wrap">
                    <div className="flex-1 min-w-[220px] text-sm text-slate-700">{item.text}</div>
                    <div className="flex gap-1">
                      {RESPONSES.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => update(i, { response: item.response === r ? '' : r })}
                          className={`text-xs px-2 py-1 rounded-md border ${
                            item.response === r
                              ? r === 'Yes'
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : r === 'No'
                                ? 'bg-red-500 border-red-500 text-white'
                                : 'bg-slate-500 border-slate-500 text-white'
                              : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <input
                      className="input-base w-48 py-1 text-xs"
                      placeholder="Notes"
                      value={item.notes}
                      onChange={(e) => update(i, { notes: e.target.value })}
                    />
                    <input
                      className="input-base w-24 py-1 text-xs"
                      placeholder="By"
                      value={item.completedBy}
                      onChange={(e) => update(i, { completedBy: e.target.value })}
                    />
                    <input
                      type="date"
                      className="input-base w-36 py-1 text-xs"
                      value={item.date}
                      onChange={(e) => update(i, { date: e.target.value })}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )
      }}
    </ScheduleStepFrame>
  )
}
