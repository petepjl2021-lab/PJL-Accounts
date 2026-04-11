'use client'

import { Modal } from './Modal'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ConfirmDialogProps {
  open:         boolean
  onClose:      () => void
  onConfirm:    () => void
  title:        string
  message:      string
  confirmLabel?: string
  danger?:      boolean
  loading?:     boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {danger && (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 shrink-0">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-600">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
