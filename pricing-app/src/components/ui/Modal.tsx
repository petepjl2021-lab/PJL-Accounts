'use client'

import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface ModalProps {
  open:      boolean
  onClose:   () => void
  title?:    string
  children:  React.ReactNode
  size?:     'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, size = 'md', className }: ModalProps) {
  // Close on ESC
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={cn(
        'relative bg-white rounded-xl shadow-2xl w-full animate-slide-up',
        sizes[size],
        className,
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button onClick={onClose} className="btn-ghost p-1">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 btn-ghost p-1 z-10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
