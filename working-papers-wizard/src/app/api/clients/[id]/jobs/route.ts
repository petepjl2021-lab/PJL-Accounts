import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ALWAYS_INCLUDED } from '@/lib/schedules'
import { defaultDataForKey, carryForwardScheduleData } from '@/lib/scheduleData'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const jobs = await prisma.job.findMany({
    where: { clientId: params.id },
    orderBy: { yearEndDate: 'desc' },
  })
  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const clientId = params.id
  const yearEndDate = new Date(body.yearEndDate)
  if (isNaN(yearEndDate.getTime())) {
    return NextResponse.json({ error: 'A valid year end date is required' }, { status: 400 })
  }

  const requiredSchedules: string[] = Array.isArray(body.requiredSchedules) ? body.requiredSchedules : []
  const carryForward = Boolean(body.carryForward)

  let prevJob: { id: string } | null = null
  if (carryForward) {
    prevJob = await prisma.job.findFirst({
      where: { clientId, yearEndDate: { lt: yearEndDate } },
      orderBy: { yearEndDate: 'desc' },
    })
  }
  const prevSchedules = prevJob
    ? await prisma.scheduleRecord.findMany({ where: { jobId: prevJob.id } })
    : []
  const prevByKey = new Map(prevSchedules.map((s) => [s.key, s.data]))

  const allKeys = Array.from(new Set([...ALWAYS_INCLUDED, ...requiredSchedules]))

  try {
    const job = await prisma.job.create({
      data: {
        clientId,
        yearEndDate,
        preparedBy: body.preparedBy || null,
        preparedDate: body.preparedDate ? new Date(body.preparedDate) : null,
        reviewedBy: body.reviewedBy || null,
        reviewedDate: body.reviewedDate ? new Date(body.reviewedDate) : null,
        requiredSchedules: JSON.stringify(requiredSchedules),
        schedules: {
          create: allKeys.map((key) => {
            const carried = carryForward ? carryForwardScheduleData(key, prevByKey.get(key)) : null
            return {
              key,
              data: carried || defaultDataForKey(key),
            }
          }),
        },
      },
      include: { schedules: true },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ error: 'A job for this client with this year end date already exists.' }, { status: 400 })
    }
    throw err
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002'
}
