import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  const record = await prisma.clientOnboarding.update({
    where: { id: params.id },
    data: {
      stage: body.stage,
      amlStatus: body.amlStatus,
      amlCompletedDate: body.amlCompletedDate ? new Date(body.amlCompletedDate) : null,
      idVerified: body.idVerified ?? false,
      addressVerified: body.addressVerified ?? false,
      amlNotes: body.amlNotes || null,
      engagementLetterSent: body.engagementLetterSent
        ? new Date(body.engagementLetterSent)
        : null,
      engagementLetterSigned: body.engagementLetterSigned
        ? new Date(body.engagementLetterSigned)
        : null,
      termsAccepted: body.termsAccepted ?? false,
      termsDate: body.termsDate ? new Date(body.termsDate) : null,
      hmrcOnlineSetup: body.hmrcOnlineSetup ?? false,
      agentAuthRequested: body.agentAuthRequested ?? false,
      softwareSetup: body.softwareSetup ?? false,
      softwareName: body.softwareName || null,
      conflictCheckDone: body.conflictCheckDone ?? false,
      ddSetup: body.ddSetup ?? false,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      notes: body.notes || null,
    },
    include: {
      client: {
        select: { id: true, ref: true, name: true, companyName: true, clientType: true },
      },
    },
  })

  return NextResponse.json(record)
}
