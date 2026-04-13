import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { seedPricingData } from '@/lib/seedData'
import bcrypt from 'bcryptjs'

// ─── POST: admin-authenticated reset (used by Settings → Reset to Defaults) ───

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const user = session.user as { role?: string }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
  }

  const firmName = process.env.SEED_FIRM_NAME
  await seedPricingData(prisma, firmName)

  return NextResponse.json({ ok: true, message: 'Pricing data seeded successfully' })
}

// ─── GET: first-time auto-seed (used on fresh Vercel deployments) ─────────────
// Only works when SEED_ON_STARTUP=true AND the database has no users yet.

export async function GET() {
  if (process.env.SEED_ON_STARTUP !== 'true') {
    return NextResponse.json({ error: 'Not enabled' }, { status: 404 })
  }

  const userCount = await prisma.user.count()
  if (userCount > 0) {
    return NextResponse.json({ ok: true, message: 'Already seeded — nothing to do' })
  }

  const email    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@example.com'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123'
  const firmName = process.env.SEED_FIRM_NAME      ?? 'My Firm'
  const hashed   = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name:     'Admin',
      email,
      password: hashed,
      role:     'ADMIN',
      active:   true,
    },
  })

  await seedPricingData(prisma, firmName)

  return NextResponse.json({
    ok:      true,
    message: `Database seeded. Login with: ${email} / ${password}`,
  })
}
