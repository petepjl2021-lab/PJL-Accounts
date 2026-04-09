import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  const prospect = await prisma.prospect.update({
    where: { id: params.id },
    data: {
      name: body.name,
      companyName: body.companyName || null,
      email: body.email || null,
      phone: body.phone || null,
      source: body.source,
      serviceTypes: JSON.stringify(body.serviceTypes ?? []),
      status: body.status,
      estimatedFees: body.estimatedFees ? parseFloat(body.estimatedFees) : null,
      notes: body.notes || null,
      nextAction: body.nextAction || null,
      nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
      lostReason: body.lostReason || null,
      assignedToId: body.assignedToId || null,
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  })

  return NextResponse.json(prospect)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await prisma.prospect.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
