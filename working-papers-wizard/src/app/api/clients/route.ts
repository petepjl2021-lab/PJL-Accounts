import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const clients = await prisma.client.findMany({
    where: { archived: false },
    orderBy: { name: 'asc' },
    include: {
      jobs: {
        orderBy: { yearEndDate: 'desc' },
        take: 1,
      },
      _count: { select: { jobs: true } },
    },
  })
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.name || !String(body.name).trim()) {
    return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
  }
  const client = await prisma.client.create({
    data: {
      name: body.name.trim(),
      companyNumber: body.companyNumber || null,
      accountingStandard: body.accountingStandard || 'FRS-105',
      folderPath: body.folderPath || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(client, { status: 201 })
}
