import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const presets = await prisma.industryPreset.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' },
  })

  const parsed = presets.map(p => ({
    ...p,
    defaultAddOnIds: JSON.parse(p.defaultAddOnIds) as string[],
  }))

  return NextResponse.json(parsed)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const user = session.user as { role?: string }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const preset = await prisma.industryPreset.create({
    data: {
      name:           body.name,
      code:           body.code.toUpperCase().replace(/\s+/g, '_'),
      description:    body.description ?? null,
      defaultAddOnIds: JSON.stringify(body.defaultAddOnIds ?? []),
      sortOrder:      Number(body.sortOrder ?? 0),
    },
  })
  return NextResponse.json({ ...preset, defaultAddOnIds: JSON.parse(preset.defaultAddOnIds) }, { status: 201 })
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
    defaultAddOnIds?: string[]
    sortOrder?: number
    enabled?: boolean
  }>

  const updates = await Promise.all(
    body.map(item =>
      prisma.industryPreset.update({
        where: { id: item.id },
        data: {
          name:           item.name,
          description:    item.description,
          defaultAddOnIds: item.defaultAddOnIds !== undefined
            ? JSON.stringify(item.defaultAddOnIds)
            : undefined,
          sortOrder: item.sortOrder,
          enabled:   item.enabled,
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

  await prisma.industryPreset.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
