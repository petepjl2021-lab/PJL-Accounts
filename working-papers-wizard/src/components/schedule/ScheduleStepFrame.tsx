'use client'

import { useEffect, useRef, useState } from 'react'
import { ScheduleRecord } from '@/types'

export default function ScheduleStepFrame<T>({
  title,
  purpose,
  howTo,
  jobId,
  scheduleKey,
  record,
  defaultData,
  onBack,
  onNext,
  isFirst,
  isLast,
  children,
}: {
  title: string
  purpose: string
  howTo: string
  jobId: string
  scheduleKey: string
  record: ScheduleRecord
  defaultData: T
  onBack?: () => void
  onNext?: () => void
  isFirst?: boolean
  isLast?: boolean
  children: (data: T, setData: (d: T) => void) => React.ReactNode
}) {
  const [data, setData] = useState<T>(() => safeParse(record.data, defaultData))
  const [preparedBy, setPreparedBy] = useState(record.preparedBy || '')
  const [reviewedBy, setReviewedBy] = useState(record.reviewedBy || '')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const skipNextSave = useRef(true)
  const dataRef = useRef(data)
  const isDirtyRef = useRef(false)

  useEffect(() => {
    setData(safeParse(record.data, defaultData))
    setPreparedBy(record.preparedBy || '')
    setReviewedBy(record.reviewedBy || '')
    skipNextSave.current = true
    isDirtyRef.current = false
    setSaveState('idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id])

  useEffect(() => {
    dataRef.current = data
  }, [data])

  function persist(payload: Record<string, unknown>) {
    return fetch(`/api/jobs/${jobId}/schedules/${scheduleKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    isDirtyRef.current = true
    setSaveState('saving')
    const id = setTimeout(async () => {
      await persist({ data: dataRef.current, status: 'IN_PROGRESS' })
      isDirtyRef.current = false
      setSaveState('saved')
    }, 700)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Flush any pending edit immediately when leaving this schedule (e.g. switching
  // wizard steps before the debounce timer above has fired), so nothing is lost.
  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        persist({ data: dataRef.current, status: 'IN_PROGRESS' })
        isDirtyRef.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, scheduleKey])

  async function markDone() {
    setSaveState('saving')
    isDirtyRef.current = false
    await persist({
      data,
      status: 'DONE',
      preparedBy: preparedBy || null,
      preparedDate: preparedBy ? new Date().toISOString() : null,
      reviewedBy: reviewedBy || null,
      reviewedDate: reviewedBy ? new Date().toISOString() : null,
    })
    setSaveState('saved')
    onNext?.()
  }

  return (
    <div>
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between mb-1 gap-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <SaveIndicator state={saveState} />
        </div>
        <p className="text-sm text-slate-500">{purpose}</p>
        <p className="text-xs text-slate-400 mt-1">{howTo}</p>
      </div>

      <div className="card p-5 mb-4">{children(data, setData)}</div>

      <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <span className="text-slate-500">Prepared by</span>
            <input className="input-base w-24 py-1" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-slate-500">Reviewed by</span>
            <input className="input-base w-24 py-1" value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value)} />
          </label>
        </div>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button className="btn-secondary" onClick={onBack} type="button">
              Back
            </button>
          )}
          <button className="btn-primary" onClick={markDone} type="button">
            {isLast ? 'Mark Done' : 'Mark Done & Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function SaveIndicator({ state }: { state: string }) {
  if (state === 'saving') return <span className="text-xs text-slate-400 shrink-0">Saving…</span>
  if (state === 'saved') return <span className="text-xs text-emerald-600 shrink-0">Saved</span>
  return <span className="text-xs text-transparent shrink-0">Saved</span>
}
