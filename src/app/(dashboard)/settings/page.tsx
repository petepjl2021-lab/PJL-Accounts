'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate, initials } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function defaultUserForm() {
  return { name: '', email: '', password: '', role: 'STAFF' }
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN'

  const { data: users = [], mutate } = useSWR('/api/users', fetcher)

  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [userForm, setUserForm] = useState(defaultUserForm())
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')

  async function handleAddUser() {
    setSaving(true)
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userForm),
    })
    setSaving(false)
    setShowAddUser(false)
    setUserForm(defaultUserForm())
    mutate()
  }

  async function handleToggleActive(user: any) {
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    })
    mutate()
  }

  async function handleChangePassword() {
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg('Passwords do not match.')
      return
    }
    if (pwForm.newPw.length < 8) {
      setPwMsg('Password must be at least 8 characters.')
      return
    }
    setSaving(true)
    const userId = (session?.user as { id?: string })?.id
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwForm.newPw }),
    })
    setSaving(false)
    if (res.ok) {
      setPwMsg('Password changed successfully.')
      setPwForm({ current: '', newPw: '', confirm: '' })
    } else {
      setPwMsg('Failed to change password.')
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage users and account settings</p>
      </div>

      {/* Team Members */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Team Members</h2>
          {isAdmin && (
            <button onClick={() => setShowAddUser(true)} className="btn-primary">
              <PlusIcon className="w-4 h-4" />
              Add User
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {users.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-white">{initials(u.name)}</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">
                    {u.name}
                    {u.id === (session?.user as { id?: string })?.id && (
                      <span className="ml-2 text-xs text-slate-400">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  label={u.role}
                  variant={u.role === 'ADMIN' ? 'blue' : 'grey'}
                />
                {!u.active && <Badge label="Inactive" variant="red" />}
                {isAdmin && u.id !== (session?.user as { id?: string })?.id && (
                  <button
                    onClick={() => handleToggleActive(u)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    {u.active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Change Password</h2>
        <div className="space-y-3 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              className="input-base"
              value={pwForm.newPw}
              onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              className="input-base"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            />
          </div>
          {pwMsg && (
            <p
              className={`text-sm ${
                pwMsg.includes('success') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {pwMsg}
            </p>
          )}
          <button
            onClick={handleChangePassword}
            className="btn-primary"
            disabled={saving || !pwForm.newPw || !pwForm.confirm}
          >
            {saving ? 'Saving…' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-3">
          <Cog6ToothIcon className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">About</h2>
        </div>
        <dl className="space-y-1 text-sm text-slate-600">
          <div className="flex gap-4">
            <dt className="text-slate-400 w-32">App</dt>
            <dd>PJL Accounts — Practice Workflow Manager</dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-slate-400 w-32">Version</dt>
            <dd>1.0.0</dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-slate-400 w-32">Database</dt>
            <dd>Local SQLite</dd>
          </div>
        </dl>
      </div>

      {/* Add User Modal */}
      <Modal
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        title="Add Team Member"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              className="input-base"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="input-base"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="input-base"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              className="input-base"
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowAddUser(false)} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleAddUser}
            className="btn-primary"
            disabled={saving || !userForm.name || !userForm.email || !userForm.password}
          >
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
