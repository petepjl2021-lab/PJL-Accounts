import { cn } from '@/lib/utils'
import { CheckIcon } from '@heroicons/react/24/solid'

interface Step {
  number: number
  label:  string
}

const STEPS: Step[] = [
  { number: 1, label: 'Client Profile'   },
  { number: 2, label: 'Choose Package'   },
  { number: 3, label: 'Add-ons & Extras' },
  { number: 4, label: 'Review & Save'    },
]

function stepNumber(step: 1 | 2 | 3 | 'summary'): number {
  return step === 'summary' ? 4 : step
}

export function WizardStepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 | 'summary' }) {
  const current = stepNumber(currentStep)

  return (
    <div className="flex items-center justify-center gap-0 select-none">
      {STEPS.map((s, idx) => {
        const done   = s.number < current
        const active = s.number === current
        const future = s.number > current

        return (
          <div key={s.number} className="flex items-center">
            {/* Connector line before */}
            {idx > 0 && (
              <div className={cn(
                'w-12 h-0.5',
                done || active ? 'bg-blue-500' : 'bg-slate-200'
              )} />
            )}

            {/* Step bubble + label */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                done   && 'bg-blue-600 text-white',
                active && 'bg-blue-600 text-white ring-4 ring-blue-100',
                future && 'bg-slate-100 text-slate-400 border-2 border-slate-200',
              )}>
                {done ? <CheckIcon className="w-5 h-5" /> : s.number}
              </div>
              <span className={cn(
                'mt-1.5 text-xs font-medium whitespace-nowrap',
                active && 'text-blue-600',
                done   && 'text-slate-500',
                future && 'text-slate-400',
              )}>
                {s.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
