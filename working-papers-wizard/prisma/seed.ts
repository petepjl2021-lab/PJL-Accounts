import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.client.findFirst()
  if (existing) {
    console.log('Database already has clients — skipping seed.')
    return
  }

  await prisma.client.create({
    data: {
      name: 'ABC Engineering Ltd',
      companyNumber: '12345678',
      accountingStandard: 'FRS-105',
      notes: 'Example client — feel free to delete.',
    },
  })

  console.log('Seeded one example client.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
