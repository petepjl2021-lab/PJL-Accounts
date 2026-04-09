import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''

  const prospects = await prisma.prospect.findMany({
    where: {
      status: status || undefined,
      OR: search
        ? [
            { name: { contains: search } },
            { companyName: { contains: search } },
            { email: { contains: search } },
          ]
        : undefined,
    },
    include: { assignedTo: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(prospects)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  const prospect = await prisma.prospect.create({
    data: {
      name: body.name,
      companyName: body.companyName || null,
      email: body.email || null,
      phone: body.phone || null,
      source: body.source || 'OTHER',
      serviceTypes: JSON.stringify(body.serviceTypes ?? []),
      status: body.status || 'NEW',
      estimatedFees: body.estimatedFees ? parseFloat(body.estimatedFees) : null,
      notes: body.notes || null,
      nextAction: body.nextAction || null,
      nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
      assignedToId: body.assignedToId || null,
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  })

  return NextResponse.json(prospect, { status: 201 })
}
