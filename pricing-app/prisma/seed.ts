import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { seedPricingData } from '../src/lib/seedData'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database…')

  // ─── Admin user ────────────────────────────────────────────────────────────
  const email    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@pjlaccounts.co.uk'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123'
  const hashed   = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where:  { email },
    update: {},
    create: {
      name:     'Admin',
      email,
      password: hashed,
      role:     'ADMIN',
      active:   true,
    },
  })

  console.log(`✓ Admin user: ${email}`)

  // ─── Pricing data ──────────────────────────────────────────────────────────
  await seedPricingData(prisma)

  console.log('✓ Pricing packages (3 tiers)')
  console.log('✓ Turnover bands (5)')
  console.log('✓ Monthly add-ons (10)')
  console.log('✓ One-off fees (16)')
  console.log('✓ Industry presets (4)')
  console.log('✓ Pricing config (singleton)')
  console.log('\n🎉 Seed complete!')
  console.log(`\nLogin: ${email} / ${password}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
