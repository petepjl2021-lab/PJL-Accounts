import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ALWAYS_INCLUDED } from '@/lib/schedules'
import { defaultDataForKey } from '@/lib/scheduleData'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: { client: true, schedules: true },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(job)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if ('preparedBy' in body) data.preparedBy = body.preparedBy
  if ('preparedDate' in body) data.preparedDate = body.preparedDate ? new Date(body.preparedDate) : null
  if ('reviewedBy' in body) data.reviewedBy = body.reviewedBy
  if ('reviewedDate' in body) data.reviewedDate = body.reviewedDate ? new Date(body.reviewedDate) : null
  if ('status' in body) data.status = body.status
  if ('requiredSchedules' in body) data.requiredSchedules = JSON.stringify(body.requiredSchedules)
  if ('yearEndDate' in body) data.yearEndDate = new Date(body.yearEndDate)

  const job = await prisma.job.update({ where: { id: params.id }, data })

  if ('requiredSchedules' in body) {
    const wanted: string[] = Array.from(new Set([...ALWAYS_INCLUDED, ...(body.requiredSchedules as string[])]))
    const existing = await prisma.scheduleRecord.findMany({ where: { jobId: job.id }, select: { key: true } })
    const existingKeys = new Set(existing.map((s) => s.key))
    const missing = wanted.filter((k) => !existingKeys.has(k))
    if (missing.length > 0) {
      await prisma.scheduleRecord.createMany({
        data: missing.map((key) => ({ jobId: job.id, key, data: defaultDataForKey(key) })),
      })
    }
  }

  return NextResponse.json(job)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.job.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
