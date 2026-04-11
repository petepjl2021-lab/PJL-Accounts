import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { seedPricingData } from '@/lib/seedData'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const user = session.user as { role?: string }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
  }

  await seedPricingData(prisma)

  return NextResponse.json({ ok: true, message: 'Pricing data seeded successfully' })
}
