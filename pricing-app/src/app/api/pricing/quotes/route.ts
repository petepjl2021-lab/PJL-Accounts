import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcAddOnMonthlyPrice } from '@/lib/pricing'
import type { BusinessType } from '@/lib/pricing'

function getPackageBasePrice(pkg: {
  priceSoleTrader: number
  pricePartnership: number
  priceLtd: number
  priceIndividual: number
}, businessType: string): number {
  switch (businessType) {
    case 'SOLE_TRADER':     return pkg.priceSoleTrader
    case 'PARTNERSHIP':     return pkg.pricePartnership
    case 'LIMITED_COMPANY': return pkg.priceLtd
    case 'INDIVIDUAL':      return pkg.priceIndividual
    default:                return 0
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''

  const quotes = await prisma.quote.findMany({
    where: {
      status: status || undefined,
      clientName: search ? { contains: search } : undefined,
    },
    include: {
      package:   true,
      addOns:    { include: { addOn: true } },
      oneOffs:   { include: { fee: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(quotes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const user = session.user as { id?: string }
  const body = await req.json()

  // ── Fetch package to snapshot pricing ────────────────────────────────────────
  const pkg = body.packageId
    ? await prisma.pricingPackage.findUnique({ where: { id: body.packageId } })
    : null

  const band = body.turnoverBandId
    ? await prisma.turnoverBand.findUnique({ where: { id: body.turnoverBandId } })
    : null

  const multiplier = band?.multiplier ?? 1.0
  const baseMonthlyFee = pkg
    ? Math.round(getPackageBasePrice(pkg, body.businessType as string) * multiplier * 100) / 100
    : 0

  // ── Fetch add-ons to snapshot prices ────────────────────────────────────────
  const selectedAddOns = (body.selectedAddOns ?? []) as Array<{
    addOnId: string
    quantity: number
    frequency: 'MONTHLY' | 'QUARTERLY'
  }>

  const addOnIds = selectedAddOns.map(a => a.addOnId)
  const addOnRecords = addOnIds.length
    ? await prisma.pricingAddOn.findMany({ where: { id: { in: addOnIds } } })
    : []

  // ── Fetch one-offs ────────────────────────────────────────────────────────────
  const selectedOneOffIds = (body.selectedOneOffIds ?? []) as string[]
  const oneOffRecords = selectedOneOffIds.length
    ? await prisma.oneOffFee.findMany({ where: { id: { in: selectedOneOffIds } } })
    : []

  // ── Calculate totals server-side ─────────────────────────────────────────────
  let addOnsMonthlyFee = 0
  const addOnData = selectedAddOns.map(sel => {
    const addOn = addOnRecords.find(a => a.id === sel.addOnId)
    if (!addOn) return null

    const monthlyContrib = calcAddOnMonthlyPrice(
      addOn,
      sel.quantity,
      sel.frequency,
    )
    addOnsMonthlyFee += monthlyContrib

    return {
      addOnId:     sel.addOnId,
      nameSnap:    addOn.name,
      quantity:    sel.quantity,
      frequency:   sel.frequency,
      unitPrice:   addOn.basePrice ?? 0,
      monthlyTotal: Math.round(monthlyContrib * 100) / 100,
    }
  }).filter(Boolean) as Array<{
    addOnId: string; nameSnap: string; quantity: number
    frequency: string; unitPrice: number; monthlyTotal: number
  }>

  addOnsMonthlyFee = Math.round(addOnsMonthlyFee * 100) / 100

  const oneOffTotal = oneOffRecords.reduce((sum, f) => sum + f.price, 0)
  const monthlyTotal = Math.round((baseMonthlyFee + addOnsMonthlyFee) * 100) / 100
  const annualTotal  = Math.round(monthlyTotal * 12 * 100) / 100

  // ── Create the quote in a transaction ────────────────────────────────────────
  const quote = await prisma.$transaction(async (tx) => {
    const q = await tx.quote.create({
      data: {
        createdById:       user.id ?? null,
        clientName:        body.clientName ?? 'Unnamed Client',
        clientEmail:       body.clientEmail ?? null,
        businessType:      body.businessType,
        isExistingClient:  body.isExistingClient ?? false,
        industry:          body.industry ?? 'GENERAL',
        turnoverBandId:    band?.id ?? null,
        turnoverBandLabel: band?.label ?? null,
        turnoverMultiplier: multiplier,
        packageId:         pkg?.id ?? null,
        packageNameSnap:   body.packageNameSnap ?? pkg?.tier ?? null,
        baseMonthlyFee,
        addOnsMonthlyFee,
        monthlyTotal,
        annualTotal,
        oneOffTotal,
        status: 'DRAFT',
        notes:  body.notes ?? null,
      },
    })

    if (addOnData.length) {
      await tx.quoteAddOn.createMany({
        data: addOnData.map(a => ({ ...a, quoteId: q.id })),
      })
    }

    if (oneOffRecords.length) {
      await tx.quoteOneOff.createMany({
        data: oneOffRecords.map(f => ({
          quoteId:  q.id,
          feeId:    f.id,
          nameSnap: f.name,
          price:    f.price,
        })),
      })
    }

    return q
  })

  // Return full quote with relations
  const full = await prisma.quote.findUnique({
    where: { id: quote.id },
    include: {
      package:   true,
      addOns:    { include: { addOn: true } },
      oneOffs:   { include: { fee: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(full, { status: 201 })
}
