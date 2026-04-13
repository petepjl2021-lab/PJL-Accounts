'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  CalculatorIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import { initials } from '@/lib/utils'
import useSWR from 'swr'
import type { PricingConfig } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const navItems = [
  { href: '/calculator', label: 'New Quote',     icon: CalculatorIcon              },
  { href: '/quotes',     label: 'Saved Quotes',  icon: ClipboardDocumentListIcon   },
]

export function Sidebar() {
  const pathname  = usePathname()
  const { data: session } = useSession()
  const { data: config }  = useSWR<PricingConfig>('/api/pricing/config', fetcher)

  const firmName = config?.firmName ?? 'Pricing Calculator'
  const user = session?.user as { role?: string; name?: string } | undefined

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-slate-900 flex flex-col z-20 print:hidden">
      {/* Branding */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        {config?.logoUrl ? (
          <img
            src={config.logoUrl}
            alt={firmName}
            className="h-9 w-auto max-w-[100px] object-contain shrink-0"
          />
        ) : (
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 shrink-0">
            <BuildingOffice2Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <p className="text-white font-semibold text-sm leading-tight truncate">{firmName}</p>
          <p className="text-slate-400 text-xs">Pricing Calculator</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/calculator' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-800 p-3 space-y-0.5">
        {user?.role === 'ADMIN' && (
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith('/settings')
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Cog6ToothIcon className="w-5 h-5 shrink-0" />
            Settings
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          Sign out
        </button>

        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-2 mt-2 border-t border-slate-800">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-white">
                {initials(session.user.name || 'U')}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{session.user.name}</p>
              <p className="text-slate-500 text-xs truncate">{user?.role ?? 'STAFF'}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
