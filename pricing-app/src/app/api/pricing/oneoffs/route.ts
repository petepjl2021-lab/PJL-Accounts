import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === '1'

  const fees = await prisma.oneOffFee.findMany({
    where: all ? undefined : { enabled: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })
  return NextResponse.json(fees)
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
    category?: string
    price?: number
    enabled?: boolean
    sortOrder?: number
  }>

  const updates = await Promise.all(
    body.map(item =>
      prisma.oneOffFee.update({
        where: { id: item.id },
        data: {
          name:      item.name,
          category:  item.category,
          price:     item.price !== undefined ? Number(item.price) : undefined,
          enabled:   item.enabled,
          sortOrder: item.sortOrder,
        },
      })
    )
  )
  return NextResponse.json(updates)
}
