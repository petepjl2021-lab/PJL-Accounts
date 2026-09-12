import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { jobs: { orderBy: { yearEndDate: 'desc' } } },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: body.name,
      companyNumber: body.companyNumber,
      accountingStandard: body.accountingStandard,
      folderPath: body.folderPath,
      notes: body.notes,
      archived: body.archived,
    },
  })
  return NextResponse.json(client)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.client.update({ where: { id: params.id }, data: { archived: true } })
  return NextResponse.json({ ok: true })
}
