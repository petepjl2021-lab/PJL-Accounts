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

  const clients = await prisma.client.findMany({
    where: {
      status: status || undefined,
      OR: search
        ? [
            { name: { contains: search } },
            { companyName: { contains: search } },
            { ref: { contains: search } },
            { email: { contains: search } },
          ]
        : undefined,
    },
    include: {
      onboarding: { select: { stage: true } },
      _count: { select: { taxReturns: true, hmrcAuths: true } },
    },
    orderBy: { ref: 'asc' },
  })

  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  // Auto-generate ref if not provided
  let ref = body.ref?.trim()
  if (!ref) {
    const last = await prisma.client.findFirst({ orderBy: { ref: 'desc' } })
    const num = last ? parseInt(last.ref.replace(/\D/g, '') || '0') + 1 : 1
    ref = `PJL${String(num).padStart(4, '0')}`
  }

  const client = await prisma.client.create({
    data: {
      ref,
      name: body.name,
      companyName: body.companyName || null,
      clientType: body.clientType || 'INDIVIDUAL',
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      postcode: body.postcode || null,
      utr: body.utr || null,
      nino: body.nino || null,
      companyNo: body.companyNo || null,
      vatNo: body.vatNo || null,
      notes: body.notes || null,
      status: 'ACTIVE',
    },
  })

  // Create blank onboarding record
  await prisma.clientOnboarding.create({
    data: { clientId: client.id },
  })

  return NextResponse.json(client, { status: 201 })
}
