import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { defaultDataForKey } from '@/lib/scheduleData'

export async function GET(_req: NextRequest, { params }: { params: { id: string; key: string } }) {
  const record = await prisma.scheduleRecord.findUnique({
    where: { jobId_key: { jobId: params.id, key: params.key } },
  })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; key: string } }) {
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if ('data' in body) data.data = typeof body.data === 'string' ? body.data : JSON.stringify(body.data)
  if ('status' in body) data.status = body.status
  if ('preparedBy' in body) data.preparedBy = body.preparedBy
  if ('preparedDate' in body) data.preparedDate = body.preparedDate ? new Date(body.preparedDate) : null
  if ('reviewedBy' in body) data.reviewedBy = body.reviewedBy
  if ('reviewedDate' in body) data.reviewedDate = body.reviewedDate ? new Date(body.reviewedDate) : null

  const record = await prisma.scheduleRecord.upsert({
    where: { jobId_key: { jobId: params.id, key: params.key } },
    create: {
      jobId: params.id,
      key: params.key,
      data: (data.data as string) || defaultDataForKey(params.key),
      status: (data.status as string) || 'NOT_STARTED',
      preparedBy: data.preparedBy as string | undefined,
      preparedDate: data.preparedDate as Date | undefined,
      reviewedBy: data.reviewedBy as string | undefined,
      reviewedDate: data.reviewedDate as Date | undefined,
    },
    update: data,
  })
  return NextResponse.json(record)
}
