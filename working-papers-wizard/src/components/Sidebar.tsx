'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 bg-brand-950 text-brand-50 min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="text-lg font-semibold text-white">WP Wizard</div>
        <div className="text-xs text-brand-100/70 mt-0.5">Working Papers</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => {
          const active = pathname?.startsWith(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-white/10 text-white' : 'text-brand-100/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-4 text-[11px] text-brand-100/50 border-t border-white/10">
        LTD Company Accounts
      </div>
    </aside>
  )
}
