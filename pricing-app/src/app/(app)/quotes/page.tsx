'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { formatCurrency, formatDate, BUSINESS_TYPE_SHORT } from '@/lib/utils'
import { QuoteStatusBadge } from '@/components/ui/Badge'
import type { QuoteWithRelations } from '@/types'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_OPTIONS = ['', 'DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'ARCHIVED']
const STATUS_LABELS: Record<string, string> = {
  '': 'All Statuses', DRAFT: 'Draft', SENT: 'Sent',
  ACCEPTED: 'Accepted', DECLINED: 'Declined', ARCHIVED: 'Archived',
}

export default function QuotesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data: quotes, isLoading } = useSWR<QuoteWithRelations[]>(
    `/api/pricing/quotes?search=${encodeURIComponent(search)}&status=${status}`,
    fetcher
  )

  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Saved Quotes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {quotes?.length ?? 0} quote{quotes?.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link href="/calculator" className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client name…"
            className="input-base pl-9"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="input-base w-auto"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading quotes…</div>
        ) : !quotes?.length ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No quotes yet</p>
            <p className="text-slate-400 text-sm mt-1">
              {search || status ? 'Try adjusting your filters.' : 'Start by creating a new quote from the calculator.'}
            </p>
            <Link href="/calculator" className="btn-primary mt-4 inline-flex">
              <PlusIcon className="w-4 h-4" /> New Quote
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Business Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Package</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Monthly</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Annual</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map(quote => (
                <tr key={quote.id} className="table-row-hover">
                  <td className="px-4 py-3 text-sm text-slate-500">
                    <Link href={`/quotes/${quote.id}`} className="block">
                      {formatDate(quote.createdAt)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/quotes/${quote.id}`} className="block">
                      <p className="text-sm font-medium text-slate-900">{quote.clientName}</p>
                      {quote.clientEmail && (
                        <p className="text-xs text-slate-400">{quote.clientEmail}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    <Link href={`/quotes/${quote.id}`} className="block">
                      {BUSINESS_TYPE_SHORT[quote.businessType] ?? quote.businessType}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <Link href={`/quotes/${quote.id}`} className="block">
                      {quote.packageNameSnap ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                    <Link href={`/quotes/${quote.id}`} className="block">
                      {formatCurrency(quote.monthlyTotal)}/mo
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">
                    <Link href={`/quotes/${quote.id}`} className="block">
                      {formatCurrency(quote.annualTotal)}/yr
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/quotes/${quote.id}`} className="block">
                      <QuoteStatusBadge status={quote.status} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
