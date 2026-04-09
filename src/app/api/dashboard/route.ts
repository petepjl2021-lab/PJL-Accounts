import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const now = new Date()
  const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [
    activeClients,
    prospects,
    pendingHMRCAuths,
    taxReturnsDueSoon,
    overdueReturns,
    openTasks,
    urgentTasks,
    inProgressOnboarding,
    recentProspects,
    upcomingDeadlines,
  ] = await Promise.all([
    prisma.client.count({ where: { status: 'ACTIVE' } }),
    prisma.prospect.count({ where: { status: { notIn: ['ENGAGED', 'LOST'] } } }),
    prisma.hMRCAuthorisation.count({
      where: { status: { in: ['FORM_SENT', 'PENDING_HMRC'] } },
    }),
    prisma.taxReturn.count({
      where: {
        dueDate: { lte: in30days, gte: now },
        status: { notIn: ['FILED'] },
      },
    }),
    prisma.taxReturn.count({
      where: {
        dueDate: { lt: now },
        status: { notIn: ['FILED'] },
      },
    }),
    prisma.task.count({
      where: { status: { in: ['TODO', 'IN_PROGRESS'] } },
    }),
    prisma.task.count({
      where: { priority: 'URGENT', status: { in: ['TODO', 'IN_PROGRESS'] } },
    }),
    prisma.clientOnboarding.count({
      where: { stage: { notIn: ['COMPLETED'] } },
    }),
    prisma.prospect.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { assignedTo: { select: { name: true } } },
    }),
    prisma.taxReturn.findMany({
      where: {
        dueDate: { lte: in30days },
        status: { notIn: ['FILED'] },
      },
      orderBy: { dueDate: 'asc' },
      take: 8,
      include: { client: { select: { ref: true, name: true, companyName: true } } },
    }),
  ])

  return NextResponse.json({
    stats: {
      activeClients,
      prospects,
      pendingHMRCAuths,
      taxReturnsDueSoon,
      overdueReturns,
      openTasks,
      urgentTasks,
      inProgressOnboarding,
    },
    recentProspects,
    upcomingDeadlines,
  })
}
