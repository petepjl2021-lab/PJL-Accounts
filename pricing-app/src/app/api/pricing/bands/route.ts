import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const bands = await prisma.turnoverBand.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(bands)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const user = session.user as { role?: string }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const band = await prisma.turnoverBand.create({
    data: {
      label:       body.label,
      minTurnover: Number(body.minTurnover),
      maxTurnover: body.maxTurnover != null ? Number(body.maxTurnover) : null,
      multiplier:  Number(body.multiplier),
      sortOrder:   Number(body.sortOrder ?? 0),
    },
  })
  return NextResponse.json(band, { status: 201 })
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
    label?: string
    minTurnover?: number
    maxTurnover?: number | null
    multiplier?: number
    sortOrder?: number
  }>

  const updates = await Promise.all(
    body.map(item =>
      prisma.turnoverBand.update({
        where: { id: item.id },
        data: {
          label:       item.label,
          minTurnover: item.minTurnover !== undefined ? Number(item.minTurnover) : undefined,
          maxTurnover: item.maxTurnover !== undefined
            ? (item.maxTurnover != null ? Number(item.maxTurnover) : null)
            : undefined,
          multiplier:  item.multiplier !== undefined ? Number(item.multiplier) : undefined,
          sortOrder:   item.sortOrder  !== undefined ? Number(item.sortOrder)  : undefined,
        },
      })
    )
  )
  return NextResponse.json(updates)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const user = session.user as { role?: string }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.turnoverBand.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
