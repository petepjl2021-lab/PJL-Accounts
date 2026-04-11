'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate as globalMutate } from 'swr'
import { formatCurrency, cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { PricingConfig, PricingPackage, TurnoverBand, PricingAddOn, OneOffFee } from '@/types'
import type { ParsedIndustryPreset } from '@/types'
import {
  CheckIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type TabId = 'branding' | 'packages' | 'bands' | 'addons' | 'oneoffs'

const TABS: { id: TabId; label: string }[] = [
  { id: 'branding',  label: 'Branding & Text' },
  { id: 'packages',  label: 'Packages & Prices' },
  { id: 'bands',     label: 'Turnover Bands'   },
  { id: 'addons',    label: 'Monthly Add-ons'  },
  { id: 'oneoffs',   label: 'One-off Fees'     },
]

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-slide-up">
      <CheckIcon className="w-4 h-4 text-green-400" />
      {message}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab]   = useState<TabId>('branding')
  const [toast, setToast] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  const user = session?.user as { role?: string } | undefined

  // Redirect non-admins
  if (status !== 'loading' && user?.role !== 'ADMIN') {
    router.push('/calculator')
    return null
  }

  const { data: config }  = useSWR<PricingConfig>('/api/pricing/config', fetcher)
  const { data: packages } = useSWR<PricingPackage[]>('/api/pricing/packages', fetcher)
  const { data: bands }   = useSWR<TurnoverBand[]>('/api/pricing/bands', fetcher)
  const { data: addOns }  = useSWR<PricingAddOn[]>('/api/pricing/addons?all=1', fetcher)
  const { data: oneOffs } = useSWR<OneOffFee[]>('/api/pricing/oneoffs?all=1', fetcher)

  async function handleReset() {
    setResetting(true)
    await fetch('/api/pricing/seed', { method: 'POST' })
    setResetting(false)
    setResetOpen(false)
    // Revalidate everything
    globalMutate('/api/pricing/config')
    globalMutate('/api/pricing/packages')
    globalMutate('/api/pricing/bands')
    globalMutate('/api/pricing/addons?all=1')
    globalMutate('/api/pricing/oneoffs?all=1')
    setToast('Pricing data reset to defaults')
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure pricing, packages, and branding</p>
        </div>
        <button
          onClick={() => setResetOpen(true)}
          className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-8">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'branding'  && config   && <BrandingTab  config={config}   onSaved={setToast} />}
      {tab === 'packages'  && packages  && <PackagesTab  packages={packages} onSaved={setToast} />}
      {tab === 'bands'     && bands     && <BandsTab     bands={bands}     onSaved={setToast} />}
      {tab === 'addons'    && addOns    && <AddOnsTab    addOns={addOns}   onSaved={setToast} />}
      {tab === 'oneoffs'   && oneOffs   && <OneOffsTab   oneOffs={oneOffs} onSaved={setToast} />}

      {toast && <Toast message={toast} onDone={() => setToast('')} />}

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        title="Reset all pricing data?"
        message="This will restore all packages, turnover bands, add-ons, and one-off fees to factory defaults. Your saved quotes will not be affected."
        confirmLabel="Yes, reset to defaults"
        danger
        loading={resetting}
      />
    </div>
  )
}

// ─── Branding Tab ─────────────────────────────────────────────────────────────
function BrandingTab({ config, onSaved }: { config: PricingConfig; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState({ ...config })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch('/api/pricing/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    globalMutate('/api/pricing/config')
    setSaving(false)
    onSaved('Branding settings saved')
  }

  return (
    <div className="space-y-8">
      {/* Firm identity */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Firm Identity</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">Firm Name</label>
            <input type="text" value={form.firmName} onChange={e => setForm(f => ({...f, firmName: e.target.value}))} className="input-base" />
          </div>
          <div>
            <label className="label-base">Tagline</label>
            <input type="text" value={form.tagline} onChange={e => setForm(f => ({...f, tagline: e.target.value}))} className="input-base" />
          </div>
        </div>
        <div>
          <label className="label-base">Accent Colour</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.accentColour} onChange={e => setForm(f => ({...f, accentColour: e.target.value}))} className="h-10 w-16 rounded border border-slate-300 cursor-pointer" />
            <input type="text"  value={form.accentColour} onChange={e => setForm(f => ({...f, accentColour: e.target.value}))} className="input-base w-32 font-mono" placeholder="#2563eb" />
          </div>
        </div>
      </div>

      {/* Package names */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Package Names & Presentation</h2>
        {(['One', 'Two', 'Three'] as const).map((n, i) => {
          const nameKey    = `package${n}Name`    as keyof PricingConfig
          const emojiKey   = `package${n}Emoji`   as keyof PricingConfig
          const taglineKey = `package${n}Tagline` as keyof PricingConfig
          return (
            <div key={n} className="grid grid-cols-4 gap-3 items-end">
              <div>
                <label className="label-base">Tier {i+1} Name</label>
                <input type="text" value={String(form[nameKey])} onChange={e => setForm(f => ({...f, [nameKey]: e.target.value}))} className="input-base" />
              </div>
              <div>
                <label className="label-base">Emoji</label>
                <input type="text" value={String(form[emojiKey])} onChange={e => setForm(f => ({...f, [emojiKey]: e.target.value}))} className="input-base text-2xl" maxLength={4} />
              </div>
              <div className="col-span-2">
                <label className="label-base">Tagline</label>
                <input type="text" value={String(form[taglineKey])} onChange={e => setForm(f => ({...f, [taglineKey]: e.target.value}))} className="input-base" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Disclaimer text */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Quote Disclaimer</h2>
        <div>
          <label className="label-base">Disclaimer Text</label>
          <textarea value={form.disclaimerText} onChange={e => setForm(f => ({...f, disclaimerText: e.target.value}))} rows={3} className="input-base resize-none" />
        </div>
        <div>
          <label className="label-base">Closing Line</label>
          <input type="text" value={form.closingLine} onChange={e => setForm(f => ({...f, closingLine: e.target.value}))} className="input-base" />
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary px-8">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ─── Packages Tab ─────────────────────────────────────────────────────────────
function PackagesTab({ packages, onSaved }: { packages: PricingPackage[]; onSaved: (msg: string) => void }) {
  type PkgEdit = PricingPackage & { includedServicesArr: string[] }
  const [items, setItems] = useState<PkgEdit[]>(
    packages.map(p => ({
      ...p,
      includedServicesArr: JSON.parse(p.includedServices) as string[],
    }))
  )
  const [saving, setSaving] = useState(false)

  const TIER_NAMES: Record<string, string> = { TIER_ONE: 'Tier 1 (Base)', TIER_TWO: 'Tier 2 (Boost)', TIER_THREE: 'Tier 3 (Beyond)' }

  function updateItem(id: string, patch: Partial<PkgEdit>) {
    setItems(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/pricing/packages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items.map(p => ({
        id:               p.id,
        priceSoleTrader:  p.priceSoleTrader,
        pricePartnership: p.pricePartnership,
        priceLtd:         p.priceLtd,
        priceIndividual:  p.priceIndividual,
        includedServices: p.includedServicesArr,
        highlighted:      p.highlighted,
        enabled:          p.enabled,
      }))),
    })
    globalMutate('/api/pricing/packages')
    setSaving(false)
    onSaved('Package prices saved')
  }

  return (
    <div className="space-y-6">
      {items.map(pkg => (
        <div key={pkg.id} className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">{TIER_NAMES[pkg.tier] ?? pkg.tier}</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={pkg.highlighted} onChange={e => updateItem(pkg.id, { highlighted: e.target.checked })} className="rounded border-slate-300 text-blue-600" />
                Mark as Recommended
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={pkg.enabled} onChange={e => updateItem(pkg.id, { enabled: e.target.checked })} className="rounded border-slate-300 text-blue-600" />
                Enabled
              </label>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Sole Trader', key: 'priceSoleTrader' as const },
              { label: 'Partnership', key: 'pricePartnership' as const },
              { label: 'Ltd Company', key: 'priceLtd' as const },
              { label: 'Individual',  key: 'priceIndividual'  as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="label-base">{label} (£/mo)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={pkg[key]}
                  onChange={e => updateItem(pkg.id, { [key]: parseFloat(e.target.value) || 0 })}
                  className="input-base"
                />
              </div>
            ))}
          </div>

          {/* Services list */}
          <div>
            <label className="label-base">Included Services (one per line)</label>
            <textarea
              value={pkg.includedServicesArr.join('\n')}
              onChange={e => updateItem(pkg.id, {
                includedServicesArr: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
              })}
              rows={pkg.includedServicesArr.length + 1}
              className="input-base resize-y font-mono text-xs"
            />
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary px-8">
          {saving ? 'Saving…' : 'Save Packages'}
        </button>
      </div>
    </div>
  )
}

// ─── Bands Tab ────────────────────────────────────────────────────────────────
function BandsTab({ bands, onSaved }: { bands: TurnoverBand[]; onSaved: (msg: string) => void }) {
  const [items, setItems] = useState([...bands])
  const [saving, setSaving] = useState(false)

  function updateItem(id: string, patch: Partial<TurnoverBand>) {
    setItems(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/pricing/bands', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    })
    globalMutate('/api/pricing/bands')
    setSaving(false)
    onSaved('Turnover bands saved')
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Set the turnover ranges and multipliers. The multiplier is applied to the base package price to calculate the final monthly fee.
      </p>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Label</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Min Turnover (£)</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Max Turnover (£)</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Multiplier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(band => (
              <tr key={band.id}>
                <td className="px-4 py-2">
                  <input type="text" value={band.label} onChange={e => updateItem(band.id, { label: e.target.value })} className="input-base" />
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={band.minTurnover} onChange={e => updateItem(band.id, { minTurnover: parseFloat(e.target.value) || 0 })} className="input-base" min={0} />
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={band.maxTurnover ?? ''} onChange={e => updateItem(band.id, { maxTurnover: e.target.value ? parseFloat(e.target.value) : null })} className="input-base" min={0} placeholder="No limit" />
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={band.multiplier} onChange={e => updateItem(band.id, { multiplier: parseFloat(e.target.value) || 1 })} className="input-base w-24" min={0.1} max={10} step={0.05} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary px-8">
          {saving ? 'Saving…' : 'Save Bands'}
        </button>
      </div>
    </div>
  )
}

// ─── Add-ons Tab ──────────────────────────────────────────────────────────────
function AddOnsTab({ addOns, onSaved }: { addOns: PricingAddOn[]; onSaved: (msg: string) => void }) {
  const [items, setItems] = useState([...addOns])
  const [saving, setSaving] = useState(false)

  function updateItem(id: string, patch: Partial<PricingAddOn>) {
    setItems(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/pricing/addons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    })
    globalMutate('/api/pricing/addons')
    globalMutate('/api/pricing/addons?all=1')
    setSaving(false)
    onSaved('Add-ons saved')
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Configure monthly add-on services. For services with incremental pricing, set the base price (for the included units) plus the per-additional-unit rate.
      </p>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 w-48">Name</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500">Base Price (£)</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500">Included Units</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500">+£ per extra unit</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500">Unit Label</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500">Qty?</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500">On?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(a => (
              <tr key={a.id} className={cn(!a.enabled && 'opacity-50 bg-slate-50')}>
                <td className="px-3 py-2 font-medium text-slate-800 max-w-[200px]">
                  <div className="text-xs text-slate-500 mb-0.5">{a.category}</div>
                  {a.name}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={a.basePrice ?? ''}
                    onChange={e => updateItem(a.id, { basePrice: e.target.value ? parseFloat(e.target.value) : null })}
                    className="input-base w-20"
                    min={0} step={0.5}
                    placeholder="TBC"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={a.includedUnits}
                    onChange={e => updateItem(a.id, { includedUnits: parseInt(e.target.value) || 1 })}
                    className="input-base w-16"
                    min={1}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={a.additionalUnitPrice ?? ''}
                    onChange={e => updateItem(a.id, { additionalUnitPrice: e.target.value ? parseFloat(e.target.value) : null })}
                    className="input-base w-20"
                    min={0} step={0.5}
                    placeholder="—"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={a.unitLabel}
                    onChange={e => updateItem(a.id, { unitLabel: e.target.value })}
                    className="input-base w-28"
                    placeholder="month"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input type="checkbox" checked={a.hasQuantity} onChange={e => updateItem(a.id, { hasQuantity: e.target.checked })} className="rounded border-slate-300 text-blue-600" />
                </td>
                <td className="px-3 py-2 text-center">
                  <input type="checkbox" checked={a.enabled} onChange={e => updateItem(a.id, { enabled: e.target.checked })} className="rounded border-slate-300 text-blue-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary px-8">
          {saving ? 'Saving…' : 'Save Add-ons'}
        </button>
      </div>
    </div>
  )
}

// ─── One-offs Tab ─────────────────────────────────────────────────────────────
function OneOffsTab({ oneOffs, onSaved }: { oneOffs: OneOffFee[]; onSaved: (msg: string) => void }) {
  const [items, setItems] = useState([...oneOffs])
  const [saving, setSaving] = useState(false)

  function updateItem(id: string, patch: Partial<OneOffFee>) {
    setItems(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/pricing/oneoffs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    })
    globalMutate('/api/pricing/oneoffs')
    globalMutate('/api/pricing/oneoffs?all=1')
    setSaving(false)
    onSaved('One-off fees saved')
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Service Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Price (£)</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Enabled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(fee => (
              <tr key={fee.id} className={cn(!fee.enabled && 'opacity-50 bg-slate-50')}>
                <td className="px-4 py-2 text-slate-500 text-xs">{fee.category}</td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={fee.name}
                    onChange={e => updateItem(fee.id, { name: e.target.value })}
                    className="input-base"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={fee.price}
                    onChange={e => updateItem(fee.id, { price: parseFloat(e.target.value) || 0 })}
                    className="input-base w-24"
                    min={0} step={5}
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={fee.enabled}
                    onChange={e => updateItem(fee.id, { enabled: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary px-8">
          {saving ? 'Saving…' : 'Save Fees'}
        </button>
      </div>
    </div>
  )
}
