export default function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    NOT_STARTED: 'bg-slate-100 text-slate-600',
    DONE: 'bg-emerald-100 text-emerald-700',
  }
  const label: Record<string, string> = {
    COMPLETED: 'Completed',
    IN_PROGRESS: 'In progress',
    NOT_STARTED: 'Not started',
    DONE: 'Done',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {label[status] || status}
    </span>
  )
}
