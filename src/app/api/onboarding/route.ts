import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const stage = searchParams.get('stage') ?? ''

  const records = await prisma.clientOnboarding.findMany({
    where: {
      stage: stage || undefined,
      client: search
        ? {
            OR: [
              { name: { contains: search } },
              { companyName: { contains: search } },
              { ref: { contains: search } },
            ],
          }
        : undefined,
    },
    include: {
      client: {
        select: { id: true, ref: true, name: true, companyName: true, clientType: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(records)
}
