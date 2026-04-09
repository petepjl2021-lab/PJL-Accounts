'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  HomeIcon,
  UserGroupIcon,
  UserPlusIcon,
  ClipboardDocumentCheckIcon,
  IdentificationIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'
import { initials } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/clients', label: 'Clients', icon: UserGroupIcon },
  { href: '/prospects', label: 'Prospects', icon: UserPlusIcon },
  { href: '/onboarding', label: 'Onboarding', icon: ClipboardDocumentCheckIcon },
  { href: '/hmrc', label: 'HMRC Auth', icon: IdentificationIcon },
  { href: '/tax-returns', label: 'Tax Returns', icon: DocumentTextIcon },
  { href: '/tasks', label: 'Tasks', icon: CheckCircleIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-slate-900 flex flex-col z-20">
      {/* Branding */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 shrink-0">
          <BuildingOfficeIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">PJL Accounts</p>
          <p className="text-slate-400 text-xs">Practice Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
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
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Cog6ToothIcon className="w-5 h-5 shrink-0" />
          Settings
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          Sign out
        </button>

        {/* User info */}
        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-2 mt-2 border-t border-slate-800">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-white">
                {initials(session.user.name || 'U')}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{session.user.name}</p>
              <p className="text-slate-500 text-xs truncate">{session.user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
