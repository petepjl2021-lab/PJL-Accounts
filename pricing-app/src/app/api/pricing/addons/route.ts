import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === '1'

  const addons = await prisma.pricingAddOn.findMany({
    where: all ? undefined : { enabled: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })
  return NextResponse.json(addons)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const user = session.user as { role?: string }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as Array<{
    id: string
    name?: string
    description?: string | null
    category?: string
    basePrice?: number | null
    includedUnits?: number
    additionalUnitPrice?: number | null
    unitLabel?: string
    hasQuantity?: boolean
    minQuantity?: number
    maxQuantity?: number
    hasFrequency?: boolean
    enabled?: boolean
    sortOrder?: number
  }>

  const updates = await Promise.all(
    body.map(item =>
      prisma.pricingAddOn.update({
        where: { id: item.id },
        data: {
          name:                item.name,
          description:         item.description,
          category:            item.category,
          basePrice:           item.basePrice !== undefined ? item.basePrice : undefined,
          includedUnits:       item.includedUnits,
          additionalUnitPrice: item.additionalUnitPrice !== undefined ? item.additionalUnitPrice : undefined,
          unitLabel:           item.unitLabel,
          hasQuantity:         item.hasQuantity,
          minQuantity:         item.minQuantity,
          maxQuantity:         item.maxQuantity,
          hasFrequency:        item.hasFrequency,
          enabled:             item.enabled,
          sortOrder:           item.sortOrder,
        },
      })
    )
  )
  return NextResponse.json(updates)
}
