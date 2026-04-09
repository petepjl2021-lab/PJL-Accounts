import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      onboarding: true,
      hmrcAuths: { orderBy: { type: 'asc' } },
      taxReturns: {
        orderBy: [{ taxYear: 'desc' }, { type: 'asc' }],
        include: { assignedTo: { select: { id: true, name: true } } },
      },
      tasks: {
        orderBy: { createdAt: 'desc' },
        include: { assignedTo: { select: { id: true, name: true } } },
      },
    },
  })

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: body.name,
      companyName: body.companyName || null,
      clientType: body.clientType,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      postcode: body.postcode || null,
      utr: body.utr || null,
      nino: body.nino || null,
      companyNo: body.companyNo || null,
      vatNo: body.vatNo || null,
      notes: body.notes || null,
      status: body.status,
    },
  })

  return NextResponse.json(client)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Only admin can delete clients
  if ((session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.client.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
