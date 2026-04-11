'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import {
  formatCurrency, formatDate,
  BUSINESS_TYPE_LABELS, QUOTE_STATUS_LABELS,
} from '@/lib/utils'
import { QuoteStatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog }    from '@/components/ui/ConfirmDialog'
import type { QuoteWithRelations } from '@/types'
import {
  ArrowLeftIcon,
  PrinterIcon,
  PresentationChartBarIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'ARCHIVED']

export default function QuoteDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { data: quote, mutate } = useSWR<QuoteWithRelations>(
    id ? `/api/pricing/quotes/${id}` : null,
    fetcher
  )

  async function updateStatus(status: string) {
    await fetch(`/api/pricing/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    mutate()
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/pricing/quotes/${id}`, { method: 'DELETE' })
    router.push('/quotes')
  }

  if (!quote) {
    return (
      <div className="p-8">
        <div className="text-slate-400 text-center py-16">Loading quote…</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="page-header print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/quotes" className="btn-ghost p-2">
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="page-title">{quote.clientName}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {formatDate(quote.createdAt)} · {BUSINESS_TYPE_LABELS[quote.businessType] ?? quote.businessType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/present/${id}`, '_blank')}
            className="btn-secondary"
          >
            <PresentationChartBarIcon className="w-4 h-4" />
            Present
          </button>
          <button onClick={() => window.print()} className="btn-secondary">
            <PrinterIcon className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-ghost text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="card p-4 mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">Status:</span>
          <QuoteStatusBadge status={quote.status} />
        </div>
        <div className="flex gap-2">
          {STATUSES.filter(s => s !== quote.status).map(s => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className="btn-ghost text-xs py-1 px-2"
            >
              Mark as {QUOTE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Print header (hidden on screen) */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Fee Proposal</h1>
        <p className="text-slate-500">{formatDate(quote.createdAt)}</p>
      </div>

      {/* Client details */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-slate-900 mb-3">Client Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Name</span>
            <p className="font-medium text-slate-900">{quote.clientName}</p>
          </div>
          {quote.clientEmail && (
            <div>
              <span className="text-slate-500">Email</span>
              <p className="font-medium text-slate-800">{quote.clientEmail}</p>
            </div>
          )}
          <div>
            <span className="text-slate-500">Business Type</span>
            <p className="font-medium text-slate-800">{BUSINESS_TYPE_LABELS[quote.businessType]}</p>
          </div>
          <div>
            <span className="text-slate-500">Turnover Band</span>
            <p className="font-medium text-slate-800">{quote.turnoverBandLabel ?? '—'}</p>
          </div>
          <div>
            <span className="text-slate-500">Status</span>
            <p className="font-medium text-slate-800">
              {quote.isExistingClient ? 'Existing client' : 'New prospect'}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Industry</span>
            <p className="font-medium text-slate-800">{quote.industry}</p>
          </div>
        </div>
      </div>

      {/* Package */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">
            {quote.packageNameSnap ?? 'Selected Package'}
          </h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(quote.baseMonthlyFee)}<span className="text-sm font-normal text-slate-400">/mo</span>
            </div>
            <p className="text-xs text-slate-400">×{quote.turnoverMultiplier} turnover multiplier</p>
          </div>
        </div>
        {quote.package?.includedServices && (
          <ul className="space-y-1.5">
            {(JSON.parse(quote.package.includedServices) as string[]).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckIcon className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add-ons */}
      {quote.addOns.length > 0 && (
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-slate-900 mb-3">Monthly Add-ons</h2>
          <div className="space-y-2">
            {quote.addOns.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-800">{a.nameSnap}</span>
                  {a.quantity > 1 && (
                    <span className="text-slate-500 ml-2">
                      × {a.quantity} {a.addOn.unitLabel}{a.quantity > 1 ? 's' : ''}
                    </span>
                  )}
                  {a.frequency === 'QUARTERLY' && (
                    <span className="text-slate-400 ml-2">(quarterly)</span>
                  )}
                </div>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(a.monthlyTotal)}/mo
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold border-t border-slate-100 pt-2 mt-2">
              <span className="text-slate-700">Add-ons subtotal</span>
              <span className="text-slate-900">{formatCurrency(quote.addOnsMonthlyFee)}/mo</span>
            </div>
          </div>
        </div>
      )}

      {/* One-offs */}
      {quote.oneOffs.length > 0 && (
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-slate-900 mb-3">One-off Services</h2>
          <div className="space-y-2">
            {quote.oneOffs.map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-800">{o.nameSnap}</span>
                <span className="font-semibold text-slate-800">{formatCurrency(o.price)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold border-t border-slate-100 pt-2 mt-2">
              <span className="text-slate-700">One-off total</span>
              <span className="text-slate-900">{formatCurrency(quote.oneOffTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Grand total */}
      <div className="card p-5 bg-blue-50 border-blue-200 mb-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900">Estimated Monthly Fee</p>
            <p className="text-xs text-blue-600">Ex-VAT · Direct Debit · No hidden charges</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-700">
              {formatCurrency(quote.monthlyTotal)}<span className="text-lg font-normal text-blue-400">/mo</span>
            </div>
            <p className="text-sm text-blue-600 mt-0.5">{formatCurrency(quote.annualTotal)}/year</p>
          </div>
        </div>
        {quote.oneOffTotal > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between text-sm text-blue-800">
            <span>Plus one-off setup fees:</span>
            <span className="font-semibold">{formatCurrency(quote.oneOffTotal)}</span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="card p-4 bg-amber-50 border-amber-200 text-sm text-amber-800 mb-6">
        <p className="font-semibold mb-1">Important</p>
        <p>This is a rough guide — I&apos;ll confirm exact fees once I know more about your business.</p>
        <p className="mt-1 font-medium">Can I arrange a discovery call?</p>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="card p-4 mb-6 print:hidden">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Internal Notes</h3>
          <p className="text-sm text-slate-700">{quote.notes}</p>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this quote?"
        message={`This will permanently delete the quote for ${quote.clientName}. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}
