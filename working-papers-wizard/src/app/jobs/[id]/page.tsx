'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Job, ScheduleRecord } from '@/types'
import { SCHEDULES, getSchedule } from '@/lib/schedules'
import WizardStepper, { WizardStep } from '@/components/WizardStepper'
import ReviewExport from '@/components/ReviewExport'
import EditSchedulesModal from '@/components/EditSchedulesModal'
import StatusPill from '@/components/StatusPill'

import SimpleGridForm from '@/components/schedule/SimpleGridForm'
import TrialBalanceForm from '@/components/schedule/TrialBalanceForm'
import OpeningBalancesForm from '@/components/schedule/OpeningBalancesForm'
import JournalEntriesForm from '@/components/schedule/JournalEntriesForm'
import FixedAssetsForm from '@/components/schedule/FixedAssetsForm'
import DlaForm from '@/components/schedule/DlaForm'
import CorporationTaxForm from '@/components/schedule/CorporationTaxForm'
import DividendsForm from '@/components/schedule/DividendsForm'
import ChecklistForm from '@/components/schedule/ChecklistForm'
import NotesQueriesForm from '@/components/schedule/NotesQueriesForm'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function JobWizardPage({ params }: { params: { id: string } }) {
  const { data: job, mutate, isLoading } = useSWR<Job>(`/api/jobs/${params.id}`, fetcher)
  const [stepIndex, setStepIndex] = useState(0)
  const [showEditSchedules, setShowEditSchedules] = useState(false)

  const requiredKeys: string[] = useMemo(() => {
    if (!job) return []
    try {
      return JSON.parse(job.requiredSchedules)
    } catch {
      return []
    }
  }, [job])

  const orderedScheduleKeys = useMemo(() => SCHEDULES.filter((s) => requiredKeys.includes(s.key)).map((s) => s.key), [requiredKeys])

  const stepKeys = useMemo(() => [...orderedScheduleKeys, 'checklist', 'notesQueries', 'review'], [orderedScheduleKeys])

  const recordByKey = useMemo(() => {
    const map = new Map<string, ScheduleRecord>()
    ;(job?.schedules || []).forEach((s) => map.set(s.key, s))
    return map
  }, [job])

  if (isLoading) return <div className="text-slate-400 text-sm">Loading…</div>
  if (!job) return <div className="text-slate-400 text-sm">Job not found.</div>

  const steps: WizardStep[] = stepKeys.map((key) => {
    if (key === 'review') {
      return { key, title: 'Review & Export', status: job.status === 'COMPLETED' ? 'DONE' : 'NOT_STARTED' }
    }
    const record = recordByKey.get(key)
    const title = key === 'checklist' ? 'Checklist' : key === 'notesQueries' ? 'Notes and Queries' : getSchedule(key)?.title || key
    return { key, title, status: (record?.status as WizardStep['status']) || 'NOT_STARTED' }
  })

  const currentKey = stepKeys[stepIndex]
  const nav = {
    onBack: () => setStepIndex((i) => Math.max(0, i - 1)),
    onNext: () => setStepIndex((i) => Math.min(stepKeys.length - 1, i + 1)),
    isFirst: stepIndex === 0,
    isLast: stepIndex === stepKeys.length - 1,
  }

  return (
    <div>
      <div className="text-sm text-slate-500 mb-2">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>{' '}
        /{' '}
        <Link href={`/clients/${job.clientId}`} className="hover:underline">
          {job.client?.name}
        </Link>{' '}
        / Working Papers
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {job.client?.name} — Y/E {new Date(job.yearEndDate).toLocaleDateString('en-GB')}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusPill status={job.status} />
            <span className="text-xs text-slate-400">
              {job.preparedBy ? `Prepared by ${job.preparedBy}` : 'Not yet prepared'}
              {job.reviewedBy ? ` · Reviewed by ${job.reviewedBy}` : ''}
            </span>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => setShowEditSchedules(true)}>
          Edit Schedules Required
        </button>
      </div>

      <div className="flex gap-6 items-start">
        <WizardStepper steps={steps} currentIndex={stepIndex} onSelect={setStepIndex} />
        <div className="flex-1 min-w-0">
          {currentKey === 'review' ? (
            <ReviewExport job={job} clientFolderPath={job.client?.folderPath || null} onJobUpdated={() => mutate()} />
          ) : (
            renderStep(currentKey, job.id, recordByKey.get(currentKey), nav)
          )}
        </div>
      </div>

      {showEditSchedules && (
        <EditSchedulesModal
          jobId={job.id}
          current={requiredKeys}
          onClose={() => setShowEditSchedules(false)}
          onSaved={() => {
            setShowEditSchedules(false)
            mutate()
          }}
        />
      )}
    </div>
  )
}

function renderStep(
  key: string,
  jobId: string,
  record: ScheduleRecord | undefined,
  nav: { onBack: () => void; onNext: () => void; isFirst: boolean; isLast: boolean }
) {
  if (!record) return <div className="text-slate-400 text-sm">Loading schedule…</div>

  if (key === 'checklist') return <ChecklistForm jobId={jobId} record={record} {...nav} />
  if (key === 'notesQueries') return <NotesQueriesForm jobId={jobId} record={record} {...nav} />

  const def = getSchedule(key)
  if (!def) return null

  switch (def.kind) {
    case 'trialBalance':
      return <TrialBalanceForm jobId={jobId} record={record} {...nav} />
    case 'openingBalances':
      return <OpeningBalancesForm jobId={jobId} record={record} {...nav} />
    case 'journalEntries':
      return <JournalEntriesForm jobId={jobId} record={record} {...nav} />
    case 'fixedAssets':
      return <FixedAssetsForm jobId={jobId} record={record} {...nav} />
    case 'dla':
      return <DlaForm jobId={jobId} record={record} {...nav} />
    case 'corporationTax':
      return <CorporationTaxForm jobId={jobId} record={record} {...nav} />
    case 'dividends':
      return <DividendsForm jobId={jobId} record={record} {...nav} />
    default:
      return <SimpleGridForm def={def} jobId={jobId} record={record} {...nav} />
  }
}
