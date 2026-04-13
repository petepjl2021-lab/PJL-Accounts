import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SINGLETON_ID = 'singleton'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const config = await prisma.pricingConfig.upsert({
    where:  { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  })

  return NextResponse.json(config)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const user = session.user as { role?: string }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
  }

  const body = await req.json()

  // Only allow specific fields to be updated
  const allowed = [
    'firmName', 'tagline', 'accentColour', 'logoUrl',
    'disclaimerText', 'closingLine',
    'packageOneName', 'packageTwoName', 'packageThreeName',
    'packageOneEmoji', 'packageTwoEmoji', 'packageThreeEmoji',
    'packageOneTagline', 'packageTwoTagline', 'packageThreeTagline',
  ]

  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const config = await prisma.pricingConfig.upsert({
    where:  { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  })

  return NextResponse.json(config)
}
