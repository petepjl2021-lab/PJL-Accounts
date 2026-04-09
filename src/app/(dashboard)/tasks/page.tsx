'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { TaskPriorityBadge, TaskStatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, isOverdue, PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/lib/utils'
import type { TaskWithRelations } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS)
const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS)

function defaultForm() {
  return {
    title: '',
    description: '',
    clientId: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    assignedToId: '',
  }
}

export default function TasksPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODO,IN_PROGRESS')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TaskWithRelations | null>(null)
  const [deleting, setDeleting] = useState<TaskWithRelations | null>(null)
  const [form, setForm] = useState(defaultForm())
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  // Pass multiple statuses or single
  if (statusFilter) params.set('status', statusFilter)
  if (priorityFilter) params.set('priority', priorityFilter)

  const { data: allTasks = [], mutate } = useSWR<TaskWithRelations[]>(
    '/api/tasks',
    fetcher,
    { refreshInterval: 30000 }
  )
  const { data: clients = [] } = useSWR('/api/clients', fetcher)
  const { data: users = [] } = useSWR('/api/users', fetcher)

  // Client-side filter
  const tasks = allTasks.filter((t) => {
    if (search) {
      const q = search.toLowerCase()
      if (!t.title.toLowerCase().includes(q) && !t.client?.name.toLowerCase().includes(q)) return false
    }
    if (statusFilter === 'TODO,IN_PROGRESS') {
      if (!['TODO', 'IN_PROGRESS'].includes(t.status)) return false
    } else if (statusFilter) {
      if (t.status !== statusFilter) return false
    }
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  function openNew() {
    setForm(defaultForm())
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(t: TaskWithRelations) {
    setForm({
      title: t.title,
      description: t.description ?? '',
      clientId: t.clientId ?? '',
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      assignedToId: t.assignedToId ?? '',
    })
    setEditing(t)
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    const url = editing ? `/api/tasks/${editing.id}` : '/api/tasks'
    const method = editing ? 'PATCH' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    mutate()
  }

  async function markDone(t: TaskWithRelations) {
    await fetch(`/api/tasks/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...t, status: 'DONE' }),
    })
    mutate()
  }

  async function handleDelete() {
    if (!deleting) return
    await fetch(`/api/tasks/${deleting.id}`, { method: 'DELETE' })
    setDeleting(null)
    mutate()
  }

  const urgent = tasks.filter((t) => t.priority === 'URGENT').length
  const overdue = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'DONE').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">
            {tasks.length} tasks
            {urgent > 0 && <span className="text-red-600 ml-2">· {urgent} urgent</span>}
            {overdue > 0 && <span className="text-red-600 ml-2">· {overdue} overdue</span>}
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Task
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base w-44"
        >
          <option value="TODO,IN_PROGRESS">Open Tasks</option>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input-base w-36"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckCircleIcon}
            title="No tasks found"
            description="Add tasks to track your work, linked to clients if needed."
            action={
              <button onClick={openNew} className="btn-primary">
                <PlusIcon className="w-4 h-4" /> Add Task
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Task</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Due</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Assigned</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => {
                const due = t.dueDate && isOverdue(t.dueDate) && t.status !== 'DONE'
                return (
                  <tr key={t.id} className={`table-row-hover ${due ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{t.title}</p>
                      {t.description && (
                        <p className="text-xs text-slate-500 truncate max-w-xs">{t.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.client ? (
                        <span>
                          <span className="font-mono text-xs text-slate-400">{t.client.ref}</span>{' '}
                          {t.client.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <TaskPriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <TaskStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={due ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                        {formatDate(t.dueDate)}
                        {due && ' ⚠'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.assignedTo?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {t.status !== 'DONE' && (
                          <button
                            onClick={() => markDone(t)}
                            className="text-xs text-green-600 hover:underline"
                          >
                            Done
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(t)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting(t)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Task' : 'Add Task'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className="input-base"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              className="input-base"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
              <select
                className="input-base"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              >
                <option value="">No client</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.ref} — {c.companyName ?? c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
              <select
                className="input-base"
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                className="input-base"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITY_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                className="input-base"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                className="input-base"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !form.title}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Delete "${deleting?.title}"? This cannot be undone.`}
      />
    </div>
  )
}
