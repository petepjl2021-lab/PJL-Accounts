import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const includeRelations = {
  package:   true,
  addOns:    { include: { addOn: true } },
  oneOffs:   { include: { fee: true } },
  createdBy: { select: { id: true, name: true } },
} as const

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const quote = await prisma.quote.findUnique({
    where:   { id: params.id },
    include: includeRelations,
  })

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(quote)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  const quote = await prisma.quote.update({
    where: { id: params.id },
    data: {
      status: body.status,
      notes:  body.notes,
    },
    include: includeRelations,
  })

  return NextResponse.json(quote)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await prisma.quote.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
