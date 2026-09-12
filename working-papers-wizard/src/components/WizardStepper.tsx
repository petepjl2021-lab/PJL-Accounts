'use client'

export interface WizardStep {
  key: string
  title: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'
}

export default function WizardStepper({
  steps,
  currentIndex,
  onSelect,
}: {
  steps: WizardStep[]
  currentIndex: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="w-64 shrink-0 hidden lg:block">
      <div className="card p-2 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
        {steps.map((s, i) => (
          <button
            key={s.key}
            onClick={() => onSelect(i)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
              i === currentIndex ? 'bg-brand-50 text-brand-800 font-medium' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon status={s.status} />
            <span className="truncate">{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Icon({ status }: { status: WizardStep['status'] }) {
  if (status === 'DONE') {
    return <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center shrink-0">✓</span>
  }
  if (status === 'IN_PROGRESS') {
    return <span className="w-4 h-4 rounded-full border-2 border-amber-400 shrink-0" />
  }
  return <span className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
}
