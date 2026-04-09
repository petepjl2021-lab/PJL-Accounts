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

  const records = await prisma.hMRCAuthorisation.findMany({
    where: {
      status: status || undefined,
      type: type || undefined,
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
    },
    orderBy: [{ client: { ref: 'asc' } }, { type: 'asc' }],
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  const record = await prisma.hMRCAuthorisation.create({
    data: {
      clientId: body.clientId,
      type: body.type,
      status: body.status || 'NOT_STARTED',
      form64_8Sent: body.form64_8Sent ? new Date(body.form64_8Sent) : null,
      authorisedDate: body.authorisedDate ? new Date(body.authorisedDate) : null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      agentRef: body.agentRef || null,
      notes: body.notes || null,
    },
    include: { client: { select: { id: true, ref: true, name: true, companyName: true } } },
  })

  return NextResponse.json(record, { status: 201 })
}
