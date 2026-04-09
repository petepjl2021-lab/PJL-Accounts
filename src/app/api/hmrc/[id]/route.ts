import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  const record = await prisma.hMRCAuthorisation.update({
    where: { id: params.id },
    data: {
      status: body.status,
      form64_8Sent: body.form64_8Sent ? new Date(body.form64_8Sent) : null,
      authorisedDate: body.authorisedDate ? new Date(body.authorisedDate) : null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      agentRef: body.agentRef || null,
      notes: body.notes || null,
    },
    include: { client: { select: { id: true, ref: true, name: true, companyName: true } } },
  })

  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await prisma.hMRCAuthorisation.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
