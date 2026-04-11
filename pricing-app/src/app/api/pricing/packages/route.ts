import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const packages = await prisma.pricingPackage.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  // Deserialise JSON fields
  const parsed = packages.map(pkg => ({
    ...pkg,
    includedServices: JSON.parse(pkg.includedServices) as string[],
  }))

  return NextResponse.json(parsed)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const user = session.user as { role?: string }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
  }

  const body = await req.json() as Array<{
    id: string
    priceSoleTrader?: number
    pricePartnership?: number
    priceLtd?: number
    priceIndividual?: number
    includedServices?: string[]
    highlighted?: boolean
    enabled?: boolean
  }>

  const updates = await Promise.all(
    body.map(item =>
      prisma.pricingPackage.update({
        where: { id: item.id },
        data: {
          priceSoleTrader:  item.priceSoleTrader,
          pricePartnership: item.pricePartnership,
          priceLtd:         item.priceLtd,
          priceIndividual:  item.priceIndividual,
          includedServices: item.includedServices !== undefined
            ? JSON.stringify(item.includedServices)
            : undefined,
          highlighted: item.highlighted,
          enabled:     item.enabled,
        },
      })
    )
  )

  return NextResponse.json(updates)
}
