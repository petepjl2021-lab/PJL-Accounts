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
  const type = searchParams.get('type') ?? ''
  const taxYear = searchParams.get('taxYear') ?? ''

  const records = await prisma.taxReturn.findMany({
    where: {
      status: status || undefined,
      type: type || undefined,
      taxYear: taxYear || undefined,
      client: search
        ? {
            OR: [
              { name: { contains: search } },
              { companyName: { contains: search } },
              { ref: { contains: search } },
            ],
          }
        : undefined,
    },
    include: {
      client: { select: { id: true, ref: true, name: true, companyName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { client: { ref: 'asc' } }],
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  const record = await prisma.taxReturn.create({
    data: {
      clientId: body.clientId,
      type: body.type,
      taxYear: body.taxYear,
      dueDate: new Date(body.dueDate),
      status: body.status || 'NOT_STARTED',
      notes: body.notes || null,
      assignedToId: body.assignedToId || null,
    },
    include: {
      client: { select: { id: true, ref: true, name: true, companyName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(record, { status: 201 })
}
