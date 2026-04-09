import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  const record = await prisma.taxReturn.update({
    where: { id: params.id },
    data: {
      type: body.type,
      taxYear: body.taxYear,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      status: body.status,
      infoRequestedDate: body.infoRequestedDate ? new Date(body.infoRequestedDate) : null,
      infoReceivedDate: body.infoReceivedDate ? new Date(body.infoReceivedDate) : null,
      preparedDate: body.preparedDate ? new Date(body.preparedDate) : null,
      reviewedDate: body.reviewedDate ? new Date(body.reviewedDate) : null,
      sentToClientDate: body.sentToClientDate ? new Date(body.sentToClientDate) : null,
      clientApprovedDate: body.clientApprovedDate ? new Date(body.clientApprovedDate) : null,
      filedDate: body.filedDate ? new Date(body.filedDate) : null,
      hmrcReference: body.hmrcReference || null,
      taxChargeable: body.taxChargeable ? parseFloat(body.taxChargeable) : null,
      taxPayable: body.taxPayable ? parseFloat(body.taxPayable) : null,
      paymentDueDate: body.paymentDueDate ? new Date(body.paymentDueDate) : null,
      notes: body.notes || null,
      assignedToId: body.assignedToId || null,
    },
    include: {
      client: { select: { id: true, ref: true, name: true, companyName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await prisma.taxReturn.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
